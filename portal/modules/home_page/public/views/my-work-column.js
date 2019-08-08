/**
 * Copyright (c) 2015-2018 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2015-2018 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by wangliping on 2019/6/12.
 */
import '../css/my-work-column.less';
import classNames from 'classnames';
import {Dropdown, Icon, Menu, Tag, Popover, Button} from 'antd';
import ColumnItem from './column-item';
import GeminiScrollbar from 'CMP_DIR/react-gemini-scrollbar';
import {getColumnHeight} from './common-util';
import myWorkAjax from '../ajax';
import CrmScheduleForm from 'MOD_DIR/crm/public/views/schedule/form';
import DetailCard from 'CMP_DIR/detail-card';
import PhoneCallout from 'CMP_DIR/phone-callout';
import Spinner from 'CMP_DIR/spinner';
import crmUtil from 'MOD_DIR/crm/public/utils/crm-util';
import {RightPanel} from 'CMP_DIR/rightPanel';
import AlertTimer from 'CMP_DIR/alert-timer';
import AppUserManage from 'MOD_DIR/app_user_manage/public';
import UserDetail from 'MOD_DIR/app_user_manage/public/views/user-detail';
import {scrollBarEmitter, myWorkEmitter, notificationEmitter, phoneMsgEmitter} from 'PUB_DIR/sources/utils/emitters';
import UserApplyDetail from 'MOD_DIR/user_apply/public/views/apply-view-detail';
import OpportunityApplyDetail from 'MOD_DIR/sales_opportunity/public/view/apply-view-detail';
import CustomerVisitApplyDetail from 'MOD_DIR/business-apply/public/view/apply-view-detail';
import LeaveApplyDetail from 'MOD_DIR/leave-apply/public/view/apply-view-detail';
import DocumentApplyDetail from 'MOD_DIR/document_write/public/view/apply-view-detail';
import ReportApplyDetail from 'MOD_DIR/report_send/public/view/apply-view-detail';
import RightPanelModal from 'CMP_DIR/right-panel-modal';
import {APPLY_APPROVE_TYPES} from 'PUB_DIR/sources/utils/consts';
import DealDetailPanel from 'MOD_DIR/deal_manage/public/views/deal-detail-panel';
import NoDataIntro from 'CMP_DIR/no-data-intro';
import BootProcess from './boot-process/';
import {getTimeStrFromNow, getFutureTimeStr} from 'PUB_DIR/sources/utils/time-format-util';
import {hasPrivilege} from 'CMP_DIR/privilege/checker';
import RecommendClues from './boot-process/recommend_clues';
import userData from 'PUB_DIR/sources/user-data';

//工作类型
const WORK_TYPES = {
    LEAD: 'lead',//待处理线索，区分日程是否是线索的类型
    APPLY: 'apply',//申请消息
    SCHEDULE: 'schedule',//待联系的客户:日程
    DEAL: 'deal',// 待处理的订单deal
    CUSTOMER: 'customer'//用来区分日程是否是客户的类型
};
const WORK_DETAIL_TAGS = {
    SCHEDULE: 'schedule',//日程
    APPLY: 'apply',//申请、审批
    LEAD: 'lead',//待处理线索
    DEAL: 'deal',//订单
    MAJOR_CYCLE: 'major_cycle',//大循环
    MEDIUM_CYCLE: 'medium_cycle',//中循环
    MINIONR_CYCLE: 'minor_cycle',//小循环
    DISTRIBUTION: 'distribution',//新分配未联系
    EXPIRED: 'expired',//近期已过期的试用客户（近十天）
    WILLEXPIRE: 'willexpire',//近期已过期的试用客户（近十天）
};
//联系计划类型
const SCHEDULE_TYPES = {
    LEAD_CALLS: 'lead',//线索中打电话的联系计划
    CALLS: 'calls',//客户中打电话的联系计划
    VISIT: 'visit',//拜访
    OTHER: 'other'//其他
};
//申请状态
const APPLY_STATUS = {
    ONGOING: 'ongoing',//待审批
    REJECT: 'reject',//驳回
    PASS: 'pass',//通过
    CANCEL: 'cancel',//撤销
};

class MyWorkColumn extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            curWorkType: '',//当前筛选类型
            myWorkList: [],
            //我的工作类型
            myWorkTypes: [{name: Intl.get('home.page.work.all', '全部事务'), value: ''}],
            loading: false,
            load_id: '',//用于下拉加载的id
            totalCount: 0,//共多少条工作
            listenScrollBottom: true,//是否下拉加载
            curOpenDetailWork: null,//当前需要打开详情的工作
            handlingWork: null,//当前正在处理的工作（打电话、看详情写跟进）
            isShowRefreshTip: false,//是否展示刷新数据的提示
            isShowAddToDo: false,//是否展示添加日程面板
            isShowRecormendClue: false,//是否展示推荐线索的面板
            guideConfig: [], // 引导流程列表
        };
    }

    componentDidMount() {
        this.getGuideConfig();
        this.getMyWorkTypes();
        this.getMyWorkList();
        //关闭详情前，已完成工作处理的监听
        myWorkEmitter.on(myWorkEmitter.HANDLE_FINISHED_WORK, this.handleFinishedWork);
        //打通电话或写了跟进、分配线索后，将当前正在处理的工作改为已完成的监听
        myWorkEmitter.on(myWorkEmitter.SET_WORK_FINISHED, this.setWorkFinished);
        //监听推送的申请、审批消息
        notificationEmitter.emit(notificationEmitter.SHOW_UNHANDLE_APPLY_COUNT);
        notificationEmitter.on(notificationEmitter.APPLY_UPDATED, this.updateRefreshMyWork);
        notificationEmitter.on(notificationEmitter.APPLY_UPDATED_REPORT_SEND, this.updateRefreshMyWork);
        notificationEmitter.on(notificationEmitter.APPLY_UPDATED_DOCUMENT_WRITE, this.updateRefreshMyWork);
        notificationEmitter.on(notificationEmitter.APPLY_UPDATED_CUSTOMER_VISIT, this.updateRefreshMyWork);
        notificationEmitter.on(notificationEmitter.APPLY_UPDATED_SALES_OPPORTUNITY, this.updateRefreshMyWork);
        notificationEmitter.on(notificationEmitter.APPLY_UPDATED_LEAVE, this.updateRefreshMyWork);
        notificationEmitter.on(notificationEmitter.APPLY_UPDATED_MEMBER_INVITE, this.updateRefreshMyWork);

        //监听待处理线索的消息
        notificationEmitter.on(notificationEmitter.UPDATED_MY_HANDLE_CLUE, this.updateRefreshMyWork);
    }

    componentWillUnmount() {
        myWorkEmitter.removeListener(myWorkEmitter.HANDLE_FINISHED_WORK, this.handleFinishedWork);
        myWorkEmitter.removeListener(myWorkEmitter.SET_WORK_FINISHED, this.setWorkFinished);
        notificationEmitter.removeListener(notificationEmitter.APPLY_UPDATED, this.updateRefreshMyWork);
        notificationEmitter.removeListener(notificationEmitter.APPLY_UPDATED_REPORT_SEND, this.updateRefreshMyWork);
        notificationEmitter.removeListener(notificationEmitter.APPLY_UPDATED_DOCUMENT_WRITE, this.updateRefreshMyWork);
        notificationEmitter.removeListener(notificationEmitter.APPLY_UPDATED_CUSTOMER_VISIT, this.updateRefreshMyWork);
        notificationEmitter.removeListener(notificationEmitter.APPLY_UPDATED_SALES_OPPORTUNITY, this.updateRefreshMyWork);
        notificationEmitter.removeListener(notificationEmitter.APPLY_UPDATED_LEAVE, this.updateRefreshMyWork);
        notificationEmitter.removeListener(notificationEmitter.APPLY_UPDATED_MEMBER_INVITE, this.updateRefreshMyWork);
        notificationEmitter.removeListener(notificationEmitter.UPDATED_MY_HANDLE_CLUE, this.updateRefreshMyWork);
    }

    //修改刷新我的工作的标识
    updateRefreshMyWork = (data) => {
        //不筛选类型时，再展示有新工作的提示
        if (!this.state.curWorkType) {
            this.setState({isShowRefreshTip: true});
        }
    }

    //关闭、切换详情前，已完成工作的处理
    handleFinishedWork = () => {
        let handlingWork = this.state.handlingWork;
        if (handlingWork && handlingWork.isFinished) {
            this.handleMyWork(this.state.handlingWork);
        }
    }
    //打通电话或写了跟进、分配线索后，将当前正在处理的工作改为已完成
    setWorkFinished = () => {
        let handlingWork = this.state.handlingWork;
        if (handlingWork) {
            handlingWork.isFinished = true;
            this.setState({handlingWork});
        }
    }

    getGuideConfig() {
        let guideConfig = _.get(userData.getUserData(), 'guideConfig', []);
        this.setState({guideConfig});
    }

    getMyWorkTypes() {
        myWorkAjax.getMyWorkTypes().then((typeList) => {
            let workTypes = _.map(typeList, item => {
                return {name: item.name, value: item.key};
            });
            workTypes.unshift({name: Intl.get('home.page.work.all', '全部事务'), value: ''});
            this.setState({myWorkTypes: workTypes});
        }, (errorMsg) => {

        });
    }

    getMyWorkList() {
        let queryParams = {
            page_size: 20,
            type: this.state.curWorkType,
            load_id: this.state.load_id,
            // sort_id: '',
            //order:'desc'
        };
        if (this.state.curWorkType) {
            queryParams.type = this.state.curWorkType;
        }
        this.setState({loading: true});
        myWorkAjax.getMyWorkList(queryParams).then((result) => {
            scrollBarEmitter.emit(scrollBarEmitter.STOP_LOADED_DATA);
            scrollBarEmitter.emit(scrollBarEmitter.HIDE_BOTTOM_LOADING);
            let myWorkList = this.state.myWorkList;
            if (this.state.load_id) {//下拉加载时
                myWorkList = _.concat(myWorkList, _.get(result, 'list', []));
            } else {//首次加载
                myWorkList = _.get(result, 'list', []);
            }
            let totalCount = _.get(result, 'total', 0);
            let listenScrollBottom = false;
            if (_.get(myWorkList, 'length') < totalCount) {
                listenScrollBottom = true;
            }
            this.setState({
                loading: false,
                isShowRefreshTip: false,
                load_id: _.get(_.last(myWorkList), 'id', ''),
                myWorkList,
                totalCount,
                listenScrollBottom
            });
        }, (errorMsg) => {
            scrollBarEmitter.emit(scrollBarEmitter.STOP_LOADED_DATA);
            scrollBarEmitter.emit(scrollBarEmitter.HIDE_BOTTOM_LOADING);
            this.setState({loading: false});
        });
    }

    onChangeWorkType = ({key}) => {
        this.setState({curWorkType: key === 'item_0' ? '' : key, myWorkList: [], load_id: ''}, () => {
            this.getMyWorkList();
        });
    }

    getWorkTypeDropdown() {
        const workTypeMenu = (
            <Menu onClick={this.onChangeWorkType}>
                {_.map(this.state.myWorkTypes, item => {
                    return (<Menu.Item key={item.value}>{item.name}</Menu.Item>);
                })}
            </Menu>);
        const curWorkType = _.find(this.state.myWorkTypes, item => item.value === this.state.curWorkType);
        const curWorkTypeName = _.get(curWorkType, 'name', this.state.myWorkTypes[0].name);
        return (
            <Dropdown overlay={workTypeMenu} trigger={['click']} placement='bottomRight'>
                <span className='my-work-dropdown-trigger'>
                    {curWorkTypeName}
                    <Icon type='down' className='dropdown-icon'/>
                </span>
            </Dropdown>);
    }

    openClueDetail = (clueId, work) => {
        //打开新详情前先将之前已完成的工作处理掉
        this.handleFinishedWork();
        this.setState({handlingWork: work});
        phoneMsgEmitter.emit(phoneMsgEmitter.OPEN_CLUE_PANEL, {
            clue_params: {
                currentId: clueId,
                hideRightPanel: this.hideClueRightPanel,
                afterDeleteClue: this.afterDeleteClue,
            }
        });
    }
    hideClueRightPanel = () => {

    }
    //删除线索之后
    afterDeleteClue = () => {

    };

    openCustomerDetail(customerId, index, work) {
        if (this.state.curShowUserId) {
            this.closeRightUserPanel();
        }
        //是否是待审批的工作
        let isApplyWork = work.type === WORK_TYPES.APPLY && _.get(work, 'apply.opinion') === APPLY_STATUS.ONGOING;
        //打开新详情前先将之前已完成的工作处理掉
        this.handleFinishedWork();
        this.setState({
            curShowCustomerId: customerId,
            selectedLiIndex: index,
            handlingWork: isApplyWork ? null : work,
        });
        phoneMsgEmitter.emit(phoneMsgEmitter.OPEN_PHONE_PANEL, {
            customer_params: {
                currentId: customerId,
                ShowCustomerUserListPanel: this.showCustomerUserListPanel,
                showRightPanel: this.showRightPanel,
                hideRightPanel: this.closeRightCustomerPanel
            }
        });
    }

    openCustomerOrClueDetail(id, index, work) {
        if (!id) return;
        //打开线索详情
        if (!_.isEmpty(work.lead)) {
            this.openClueDetail(id, work);
        } else if (!_.isEmpty(work.customer)) {
            //打开客户详情
            this.openCustomerDetail(id, index, work);
        }
    }

    closeRightCustomerPanel = () => {
        this.setState({
            curShowCustomerId: '',
            selectedLiIndex: null
        });
    };
    showCustomerUserListPanel = (data) => {
        this.setState({
            isShowCustomerUserListPanel: true,
            customerOfCurUser: data.customerObj
        });

    };

    closeCustomerUserListPanel = () => {
        this.setState({
            isShowCustomerUserListPanel: false,
            customerOfCurUser: {}
        });
    };
    openUserDetail = (user_id, idx) => {
        if (this.state.curShowCustomerId) {
            this.closeRightCustomerPanel();
        }
        this.setState({
            curShowUserId: user_id,
            selectedLiIndex: idx
        });
    };
    closeRightUserPanel = () => {
        this.setState({
            curShowUserId: '',
            selectedLiIndex: null
        });
    };

    renderWorkName(item, index) {
        let workObj = {};
        let titleTip = '';
        if (!_.isEmpty(item.customer)) {
            workObj = item.customer;
            titleTip = Intl.get('home.page.work.click.tip', '点击查看{type}详情', {type: Intl.get('call.record.customer', '客户')});
        } else if (!_.isEmpty(item.lead)) {
            workObj = item.lead;
            titleTip = Intl.get('home.page.work.click.tip', '点击查看{type}详情', {type: Intl.get('crm.sales.clue', '线索')});
        } else if (item.type === WORK_TYPES.APPLY && _.get(item, 'apply.applyType') === APPLY_APPROVE_TYPES.PERSONAL_LEAVE) {
            //请假申请
            workObj = {name: Intl.get('leave.apply.leave.application', '请假申请')};
        }
        //客户阶段标签
        const customer_label = workObj.tag;
        //客户合格标签
        // const qualify_label = workObj.qualify_label;
        //分数
        const score = workObj.score;
        //客户id或线索id
        const id = workObj.id;
        const nameCls = classNames('work-name-text', {
            'customer-clue-name': !!id
        });
        return (
            <div className='work-name'>
                {customer_label ? (
                    <Tag
                        className={crmUtil.getCrmLabelCls(customer_label)}>
                        {customer_label}</Tag>) : null
                }
                {/*qualify_label ? (
                 <Tag className={crmUtil.getCrmLabelCls(qualify_label)}>
                 {qualify_label === 1 ? crmUtil.CUSTOMER_TAGS.QUALIFIED :
                 qualify_label === 2 ? crmUtil.CUSTOMER_TAGS.HISTORY_QUALIFIED : ''}</Tag>) : null
                 */}
                <span className={nameCls} title={titleTip}
                    onClick={this.openCustomerOrClueDetail.bind(this, id, index, item)}>
                    {_.get(workObj, 'name', '')}
                </span>
                {score ? (
                    <span className='custmer-score'>
                        <i className='iconfont icon-customer-score'/>
                        {score}
                    </span>) : null}
            </div>);
    }

    //联系人和联系电话
    renderPopoverContent(contacts, item) {
        return (
            <div className="contacts-containers">
                {_.map(contacts, (contact) => {
                    var cls = classNames('contacts-item',
                        {'def-contact-item': contact.def_contancts === 'true'});
                    return (
                        <div className={cls}>
                            <div className="contacts-name-content">
                                <i className="iconfont icon-contact-default"/>
                                {contact.name}
                            </div>
                            <div className="contacts-phone-content" data-tracename="联系人电话列表">
                                {_.map(contact.phone, (phone) => {
                                    return (
                                        <div className="phone-item">
                                            <PhoneCallout
                                                phoneNumber={phone}
                                                contactName={contact.name}
                                                showPhoneIcon={true}
                                                onCallSuccess={this.onCallSuccess.bind(this, item)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    //联系人及电话的渲染
    renderContactItem(item) {
        let contacts = [];
        if (item.type === WORK_TYPES.CUSTOMER) {
            contacts = _.get(item, 'customer.contacts', []);
        } else if (item.type === WORK_TYPES.LEAD) {
            contacts = _.get(item, 'lead.contacts', []);
        }
        let phones = _.map(contacts, 'phone');
        if (!_.isEmpty(contacts) && !_.isEmpty(phones)) {
            let contactsContent = this.renderPopoverContent(contacts, item);
            return (
                <div className='work-hover-show-detail'>
                    <Popover content={contactsContent} placement="bottom"
                        overlayClassName='contact-phone-popover'
                        getPopupContainer={() => document.getElementById(`home-page-work${item.id}`)}>
                        <span className='work-contact-phone'>
                            <i className="iconfont icon-phone-call-out"/>
                        </span>
                    </Popover>
                </div>);
        }
    }

    //拨打电话成功后，记住当前正在拨打电话的工作,以便打通电话写完跟进后将此项工作去掉
    onCallSuccess(item) {
        //线索中拨打电话时
        if (item.type === WORK_TYPES.LEAD) {
            this.openClueDetail(_.get(item, 'lead.id'), item);
        } else {
            //打开新电话弹屏前先将之前已完成的工作处理掉
            this.handleFinishedWork();
            this.setState({handlingWork: item});
        }
    }

    //能否打开工作详情
    enableOpenWorkDetail(item) {
        //订单详情、申请详情能否打开的判断
        return _.includes(item.tags, WORK_TYPES.DEAL) || (item.type === WORK_TYPES.APPLY && _.get(item, `[${WORK_TYPES.APPLY}].opinion`) === APPLY_STATUS.ONGOING);
    }

    getScheduleType(type) {
        let typeDescr = '';
        switch (type) {
            case 'visit'://客户拜访的日程类型
                typeDescr = Intl.get('customer.visit', '拜访');
                break;
            case 'calls'://客户打电话的日程类型
                typeDescr = Intl.get('crm.schedule.call', '打电话');
                break;
            case 'lead'://线索打电话的日程类型
                typeDescr = Intl.get('crm.schedule.call', '打电话');
                break;
            case 'other'://其他
                typeDescr = '';
                break;
        }
        return typeDescr;
    }

    getApplyType(type) {
        const APPLY_TYPE_MAP = {
            'business_opportunities': Intl.get('leave.apply.sales.oppotunity', '机会申请'),
            'customer_visit': Intl.get('leave.apply.add.leave.apply', '出差申请'),
            'personal_leave': Intl.get('leave.apply.leave.application', '请假申请'),
            'opinion_report': Intl.get('home.page.user.application.for', '{type}申请', {type: Intl.get('apply.approve.lyrical.report', '舆情报告')}),
            'document_writing': Intl.get('home.page.user.application.for', '{type}申请', {type: Intl.get('apply.approve.document.writing', '文件撰写')}),
            'apply_user_official': Intl.get('home.page.user.formal.apply', '签约用户申请'),
            'apply_user_trial': Intl.get('home.page.user.trial.apply', '试用用户申请'),
            'apply_app_official': Intl.get('home.page.user.formal.apply', '签约用户申请'),
            'apply_app_trial': Intl.get('home.page.user.trial.apply', '试用用户申请'),
            'apply_grant_delay_multiapp': Intl.get('home.page.user.delay.apply', '用户延期申请'),
            'apply_pwd_change': Intl.get('home.page.user.password.apply', '修改密码申请'),
            'apply_grant_status_change_multiapp': Intl.get('home.page.user.status.apply', '禁用用户申请'),
            'apply_sth_else': Intl.get('home.page.user.other.apply', '其他申请')
        };
        let typeDescr = APPLY_TYPE_MAP[type];
        return typeDescr;
    }

    getApplyRemark(item, tag) {
        let remark = '';
        let type = this.getApplyType(_.get(item, `[${tag}].applyType`, ''));
        switch (_.get(item, `[${tag}].opinion`, '')) {
            case APPLY_STATUS.ONGOING://待审批
                remark = _.get(item, `[${tag}].applicant`, '') + ' ' + type;
                break;
            case APPLY_STATUS.PASS://通过
                remark = Intl.get('home.page.approve.pass.tip', '{user}通过了您的{applyType}', {
                    user: _.get(item, `[${tag}].approver`, ''),
                    applyType: type
                });
                break;
            case APPLY_STATUS.REJECT://驳回
                remark = Intl.get('home.page.approve.reject.tip', '{user}驳回了您的{applyType}', {
                    user: _.get(item, `[${tag}].approver`, ''),
                    applyType: type
                });
                break;
            case APPLY_STATUS.CANCEL://撤销
                remark = Intl.get('home.page.approve.cancel.tip', '{user}撤回了{applyType}', {
                    user: _.get(item, `[${tag}].applicant`, ''),
                    applyType: type
                });
                break;
        }
        return remark;
    }

    getLastTrace(item) {
        return moment(_.get(item, 'customer.last_contact_time')).format(oplateConsts.DATE_TIME_WITHOUT_SECOND_FORMAT) + ' ' + _.get(item, 'customer.customer_trace', '');
    }

    renderWorkRemarks(tag, item, index) {
        let tagDescr = '', remark = '', startTime = '', endTime = '', type = '';
        switch (tag) {
            case WORK_DETAIL_TAGS.SCHEDULE://日程
                tagDescr = Intl.get('menu.shortName.schedule', '日程');
                startTime = _.get(item, `[${tag}].start_time`) ? moment(item[tag].start_time).format(oplateConsts.HOUR_MUNITE_FORMAT) : '';
                endTime = _.get(item, `[${tag}].end_time`) ? moment(item[tag].end_time).format(oplateConsts.HOUR_MUNITE_FORMAT) : '';
                type = this.getScheduleType(_.get(item, `[${tag}].schedule_type`, ''));
                //xxx-xxx 打电话 联系内容的备注
                remark = startTime + ' - ' + endTime + ' ';
                if (type) {
                    remark += type + ' ';
                }
                remark += _.get(item, `[${tag}].content`);
                break;
            case WORK_DETAIL_TAGS.APPLY://申请、审批
                tagDescr = Intl.get('home.page.apply.type', '申请');
                //xxx 试用用户申请
                //xxx 驳回了您的 试用用户申请
                remark = this.getApplyRemark(item, tag);
                break;
            case WORK_DETAIL_TAGS.LEAD://待处理线索
                tagDescr = Intl.get('crm.sales.clue', '线索');
                //线索描述
                remark = _.get(item, `[${tag}].source`, '');
                break;
            case WORK_DETAIL_TAGS.DEAL://订单
                tagDescr = Intl.get('user.apply.detail.order', '订单');
                //订单预算
                remark = Intl.get('leave.apply.buget.count', '预算') + ': ' + Intl.get('contract.159', '{num}元', {num: _.get(item, `[${tag}].budget`, '0')});
                break;
            case WORK_DETAIL_TAGS.MAJOR_CYCLE://大循环设置的联系频率
                tagDescr = Intl.get('home.page.contact.great.cycle', '大循环');
                //最后一次跟进时间与跟进内容
                remark = this.getLastTrace(item);
                break;
            case WORK_DETAIL_TAGS.MEDIUM_CYCLE://中循环设置的联系频率
                tagDescr = Intl.get('home.page.contact.medium.cycle', '中循环');
                //最后一次跟进时间与跟进内容
                remark = this.getLastTrace(item);
                break;
            case WORK_DETAIL_TAGS.MINIONR_CYCLE://小循环设置的联系频率
                tagDescr = Intl.get('home.page.contact.minor.cycle', '小循环');
                //最后一次跟进时间与跟进内容
                remark = this.getLastTrace(item);
                break;
            case WORK_DETAIL_TAGS.DISTRIBUTION://新分配未联系
                tagDescr = Intl.get('home.page.distribute.new', '新分配');
                break;
            case WORK_DETAIL_TAGS.WILLEXPIRE://即将到期
                tagDescr = Intl.get('home.page.will.expire.customer', '即将到期');
                //xxx时间到期
                remark = this.getExpireTip(item, tag);
                break;
            case WORK_DETAIL_TAGS.EXPIRED://已到期
                tagDescr = Intl.get('home.page.expired.customer', '已过期');
                //xxx时间已到期
                remark = this.getExpireTip(item, tag);
                break;
        }
        return (
            <div className='work-remark-content'>
                【{tagDescr}】{remark}
            </div>
        );
    }

    getExpireTip(item, tag) {
        let time = _.get(item, `[${tag}][0].end_date`), timeStr = '';
        if (tag === WORK_DETAIL_TAGS.WILLEXPIRE) {
            //今天、明天、后天、xxx天后到期
            timeStr = getFutureTimeStr(time);
        } else if (tag === WORK_DETAIL_TAGS.EXPIRED) {
            //今天、昨天、前天、xxx天前到期
            timeStr = getTimeStrFromNow(time);
        }
        return _.get(item, `[${tag}][0].user_name`, '') + ' ' + timeStr + ' ' + Intl.get('apply.delay.endTime', '到期');
    }

    renderWorkCard(item, index) {
        const contentCls = classNames('work-content-wrap', {
            'open-work-detail-style': this.enableOpenWorkDetail(item)
        });
        let clickTip = '';
        if (this.enableOpenWorkDetail(item)) {
            if (item.type === WORK_TYPES.APPLY) {
                clickTip = Intl.get('home.page.work.click.tip', '点击查看{type}详情', {type: Intl.get('home.page.apply.type', '申请')});
            } else if (_.includes(item.tags, WORK_TYPES.DEAL)) {
                clickTip = Intl.get('home.page.work.click.tip', '点击查看{type}详情', {type: Intl.get('user.apply.detail.order', '订单')});
            }
        }
        return (
            <div className='my-work-card-container' onClick={this.openWorkDetail.bind(this, item)} title={clickTip}>
                <div className={contentCls} id={`home-page-work${item.id}`}>
                    {this.renderWorkName(item, index)}
                    <div className='work-remark'>
                        {_.map(item.tags, (tag, index) => this.renderWorkRemarks(tag, item, index))}
                    </div>
                    <div className='my-work-item-hover'>
                        {this.renderContactItem(item)}
                        {this.renderHandleWorkBtn(item)}
                    </div>
                </div>
            </div>);
    }

    //打开工作详情
    openWorkDetail = (item, event) => {
        //点击到客户名或线索名时，打开客户或线索详情，不触发打开工作详情的处理
        if (event && $(event.target).hasClass('customer-clue-name')) return;
        //打开订单详情、申请详情
        if (this.enableOpenWorkDetail(item)) {
            this.setState({curOpenDetailWork: item});
        }
    }

    renderHandleWorkBtn(item) {
        //当前工作是否正在编辑
        if (item.isEidtingWorkStatus) {
            return ( <div className='handle-work-finish'>(<Icon type="loading"/></div>);
        } else if (item.editWorkStatusErrorMsg) {
            return (<AlertTimer time={3000}
                message={item.editWorkStatusErrorMsg}
                type="error"
                showIcon
                onHide={this.hideEditStatusTip.bind(this, item)}/>);
        } else {
            return (
                <div className='handle-work-finish' onClick={this.handleMyWork.bind(this, item)}>
                    <span className='work-finish-text' title={Intl.get('home.page.my.work.finished', '点击设为已完成')}>
                        <i className="iconfont icon-select-member"/>
                    </span>
                </div>);
        }
    }

    hideEditStatusTip = (item) => {
        let myWorkList = this.state.myWorkList;
        _.each(myWorkList, work => {
            if (work.id === item.id) {
                delete work.editWorkStatusErrorMsg;
                return false;
            }
        });
        this.setState({myWorkList});
    }

    handleMyWork = (item) => {
        if (!_.get(item, 'id')) return;
        let myWorkList = this.state.myWorkList;
        _.each(myWorkList, work => {
            if (work.id === item.id) {
                work.isEidtingWorkStatus = true;
                return false;
            }
        });
        this.setState({myWorkList});
        myWorkAjax.handleMyWorkStatus({id: item.id, status: 1}).then(result => {
            if (result) {
                //过滤掉已处理的工作
                myWorkList = _.filter(myWorkList, work => work.id !== item.id);
                //已处理的工作就是之前记录的正在处理的工作，将正在处理的工作置空
                let handlingWork = this.state.handlingWork;
                if (handlingWork && item.id === handlingWork.id) {
                    handlingWork = null;
                }
                this.setState({myWorkList, handlingWork});
                let workListLength = _.get(myWorkList, 'length');
                //如果当前展示的工作个数小于一页获取的数据，并且小于总工作数时需要继续加载一页数据，以防处理完工作后下面的工作没有及时补上来
                if (workListLength < 20 && workListLength < this.state.totalCount) {
                    this.getMyWorkList();
                }
            } else {
                _.each(myWorkList, work => {
                    if (work.id === item.id) {
                        work.isEidtingWorkStatus = false;
                        work.editWorkStatusErrorMsg = Intl.get('notification.system.handled.error', '处理失败');
                        return false;
                    }
                });
                this.setState({myWorkList});
            }
        }, (errorMsg) => {
            _.each(myWorkList, work => {
                if (work.id === item.id) {
                    work.isEidtingWorkStatus = false;
                    work.editWorkStatusErrorMsg = errorMsg || Intl.get('notification.system.handled.error', '处理失败');
                    return false;
                }
            });
            this.setState({myWorkList});
        });
    }

    renderMyWorkList() {
        //等待效果的渲染
        if (this.state.loading && !this.state.load_id) {
            return <Spinner/>;
        } else {
            let workList = [];
            //有新工作，请刷新后再处理
            if (this.state.isShowRefreshTip) {
                workList.push(
                    <div className="refresh-data-tip">
                        <ReactIntl.FormattedMessage
                            id="home.page.new.work.tip"
                            defaultMessage={'工作有变动，点此{refreshTip}'}
                            values={{
                                'refreshTip': <a
                                    onClick={this.refreshMyworkList}>{Intl.get('common.refresh', '刷新')}</a>
                            }}
                        />
                    </div>);
            }
            //没数据时的渲染,
            if (_.isEmpty(this.state.myWorkList)) {
                //需判断是否还有引导流程,没有时才显示无数据
                if(_.isEmpty(this.state.guideConfig)) {
                    workList.push(
                        <NoDataIntro
                            noDataAndAddBtnTip={Intl.get('home.page.no.work.tip', '暂无工作')}
                            renderAddAndImportBtns={this.renderAddAndImportBtns}
                            showAddBtn={true}
                            noDataTip={Intl.get('home.page.no.work.tip', '暂无工作')}
                        />);
                }
            } else {//工作列表的渲染
                _.each(this.state.myWorkList, (item, index) => {
                    workList.push(this.renderWorkCard(item, index));
                });
            }
            return workList;
        }
    }

    showAddSchedulePanel = () => {
        this.setState({isShowAddToDo: true});
    }
    showRecommendCluePanel = () => {
        this.setState({isShowRecormendClue: true});
    }
    renderAddAndImportBtns = () => {
        if (hasPrivilege('CUSTOMER_ADD')) {
            return (
                <div className="btn-containers">
                    <Button type='primary' className='import-btn'
                        onClick={this.showAddSchedulePanel}>{Intl.get('home.page.add.schedule', '添加日程')}</Button>
                    <Button className='add-clue-btn'
                        onClick={this.showRecommendCluePanel}>{Intl.get('clue.customer.recommend.clue.lists', '推荐线索')}</Button>
                </div>
            );
        } else {
            return null;
        }
    };
    closeGuidDetailPanel = () => {
        this.setState({isShowRecormendClue: false});
    };

    // 提取线索
    renderExtractClue() {
        if (!this.state.isShowRecormendClue) return null;
        let detailContent = (
            <RecommendClues
                onClosePanel={this.closeGuidDetailPanel}
            />);
        return (
            <RightPanelModal
                isShowMadal
                isShowCloseBtn
                onClosePanel={this.closeGuidDetailPanel}
                content={detailContent}
                dataTracename="推荐线索"
            />
        );
    }

    refreshMyworkList = () => {
        this.setState({
            load_id: '',
            isShowRefreshTip: false,
        }, () => {
            this.getMyWorkList();
        });
    }
    handleScrollBottom = () => {
        this.getMyWorkList();
    }

    // 关闭引导
    closeGuideMark = (key) => {
        let list = _.filter(this.state.guideConfig, guide => key !== guide.content);
        this.setState({guideConfig: list}, () => {
            userData.setUserData('guideConfig', list);
        });
    };

    renderBootProcessBlock = () => {
        if(_.isEmpty(this.state.guideConfig)) {
            return null;
        }else {
            return (
                <BootProcess
                    guideConfig={this.state.guideConfig}
                    closeGuideMark={this.closeGuideMark}
                />
            );
        }
    };

    renderWorkContent() {
        let customerOfCurUser = this.state.customerOfCurUser;
        return (
            <div className='my-work-content' style={{height: getColumnHeight()}}>
                <GeminiScrollbar
                    listenScrollBottom={this.state.listenScrollBottom}
                    handleScrollBottom={this.handleScrollBottom}
                    itemCssSelector=".my-work-content .detail-card-container">
                    {this.renderBootProcessBlock()}
                    {this.renderMyWorkList()}
                </GeminiScrollbar>
                {/*该客户下的用户列表*/}
                <RightPanel
                    className="customer-user-list-panel"
                    showFlag={this.state.isShowCustomerUserListPanel}
                >
                    { this.state.isShowCustomerUserListPanel ?
                        <AppUserManage
                            customer_id={customerOfCurUser.id}
                            hideCustomerUserList={this.closeCustomerUserListPanel}
                            customer_name={customerOfCurUser.name}
                        /> : null
                    }
                </RightPanel>
                {
                    this.state.curShowUserId ?
                        <RightPanel
                            className="app_user_manage_rightpanel white-space-nowrap right-pannel-default right-panel detail-v3-panel"
                            showFlag={this.state.curShowUserId}>
                            <UserDetail userId={this.state.curShowUserId}
                                closeRightPanel={this.closeRightUserPanel}/>
                        </RightPanel>
                        : null
                }
                {this.state.curOpenDetailWork ? this.renderWorkDetail() : null}
                {/*添加日程*/}
                {this.state.isShowAddToDo ? (
                    <RightPanelModal
                        className="todo-add-container"
                        isShowMadal={true}
                        isShowCloseBtn={true}
                        onClosePanel={this.handleCancel}
                        title={Intl.get('home.page.add.schedule', '添加日程')}
                        content={this.renderCrmFormContent()}
                        dataTracename='添加日程'/>) : null}
                {this.renderExtractClue()}
            </div>);
    }

    // 渲染添加日程界面
    renderCrmFormContent() {
        return (
            <DetailCard className='add-todo' content={
                <CrmScheduleForm
                    isAddToDoClicked
                    handleScheduleAdd={this.refreshMyworkList}
                    handleScheduleCancel={this.handleCancel}
                    currentSchedule={{}}/>
            }>
            </DetailCard>

        );
    }

    //处理添加日程的关闭事件
    handleCancel = (e) => {
        e && e.preventDefault();
        this.setState({
            isShowAddToDo: false
        });
    };

    renderWorkDetail() {
        const work = this.state.curOpenDetailWork;
        //订单详情
        if (_.includes(work.tags, WORK_TYPES.DEAL)) {
            return (
                <DealDetailPanel
                    currDealId={_.get(work, 'deal.id')}
                    hideDetailPanel={this.closeWorkDetailPanel}/>);
        } else {//申请详情
            let detailContent = null;
            const applyInfo = {
                id: _.get(work, 'apply.id'),
                approval_state: '0',
                topic: this.getApplyType(_.get(work, 'apply.applyType', ''))
            };
            switch (_.get(work, 'apply.applyType')) {
                case APPLY_APPROVE_TYPES.BUSINESS_OPPORTUNITIES://销售机会申请
                    detailContent = (
                        <OpportunityApplyDetail
                            isHomeMyWork={true}
                            detailItem={applyInfo}
                            applyListType='false'//待审批状态
                            afterApprovedFunc={this.afterFinishWork}
                        />);
                    break;
                case APPLY_APPROVE_TYPES.CUSTOMER_VISIT://出差申请
                    detailContent = (
                        <CustomerVisitApplyDetail
                            isHomeMyWork={true}
                            detailItem={applyInfo}
                            applyListType='false'//待审批状态
                            afterApprovedFunc={this.afterFinishWork}
                        />);
                    break;
                case APPLY_APPROVE_TYPES.PERSONAL_LEAVE://请假申请
                    detailContent = (
                        <LeaveApplyDetail
                            isHomeMyWork={true}
                            detailItem={applyInfo}
                            applyListType='false'//待审批状态
                            afterApprovedFunc={this.afterFinishWork}
                        />);
                    break;
                case APPLY_APPROVE_TYPES.OPINION_REPORT://舆情报告申请
                    detailContent = (
                        <ReportApplyDetail
                            isHomeMyWork={true}
                            detailItem={applyInfo}
                            applyListType='false'//待审批状态
                            afterApprovedFunc={this.afterFinishWork}
                        />);
                    break;
                case APPLY_APPROVE_TYPES.DOCUMENT_WRITING://文件撰写申请
                    detailContent = (
                        <DocumentApplyDetail
                            isHomeMyWork={true}
                            detailItem={applyInfo}
                            applyListType='false'//待审批状态
                            afterApprovedFunc={this.afterFinishWork}
                        />);
                    break;
                default://用户申请（试用、签约用户申请、修改密码、延期、其他）
                    detailContent = (
                        <UserApplyDetail
                            isHomeMyWork={true}
                            detailItem={applyInfo}
                            applyListType='false'//待审批状态
                            afterApprovedFunc={this.afterFinishWork}
                        />);
                    break;
            }
            return (
                <RightPanelModal
                    className="my-work-detail-panel"
                    isShowMadal={false}
                    isShowCloseBtn={true}
                    onClosePanel={this.closeWorkDetailPanel}
                    content={detailContent}
                    dataTracename="申请详情"
                />);
        }
    }

    afterFinishWork = () => {
        const work = this.state.curOpenDetailWork;
        //过滤掉处理完的工作
        const myWorkList = _.filter(this.state.myWorkList, item => item.id !== work.id);
        this.setState({curOpenDetailWork: null, myWorkList});
    }
    closeWorkDetailPanel = () => {
        this.setState({curOpenDetailWork: null});
    }

    render() {
        let title = Intl.get('home.page.my.work', '我的工作');
        // if (this.state.totalCount) {
        //     title += this.state.totalCount;
        // }
        return (
            <ColumnItem contianerClass='my-work-wrap'
                title={title}
                titleHandleElement={this.getWorkTypeDropdown()}
                content={this.renderWorkContent()}
                width='50%'
            />);
    }
}

export default MyWorkColumn;