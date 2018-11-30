/**
 * Copyright (c) 2015-2018 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2015-2018 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by zhangshujuan on 2018/9/28.
 */
var LeaveApplyDetailStore = require('../store/leave-apply-detail-store');
var LeaveApplyDetailAction = require('../action/leave-apply-detail-action');
import Trace from 'LIB_DIR/trace';
import {Alert, Icon, Input, Row, Col, Button, Steps} from 'antd';
const Step = Steps.Step;
import GeminiScrollbar from 'CMP_DIR/react-gemini-scrollbar';
import {phoneMsgEmitter} from 'PUB_DIR/sources/utils/emitters';
import {RightPanel} from 'CMP_DIR/rightPanel';
import AppUserManage from 'MOD_DIR/app_user_manage/public';
require('../css/leave-apply-detail.less');
import ApplyDetailBlock from 'CMP_DIR/apply-detail-block';
import ApplyDetailRemarks from 'CMP_DIR/apply-detail-remarks';
import ApplyDetailInfo from 'CMP_DIR/apply-detail-info';
import ApplyDetailCustomer from 'CMP_DIR/apply-detail-customer';
import ApplyDetailStatus from 'CMP_DIR/apply-detail-status';
import ApplyApproveStatus from 'CMP_DIR/apply-approve-status';
import ApplyDetailBottom from 'CMP_DIR/apply-detail-bottom';
import {APPLY_LIST_LAYOUT_CONSTANTS,APPLY_STATUS} from 'PUB_DIR/sources/utils/consts';
import {getApplyTopicText, getApplyResultDscr,getApplyStatusTimeLineDesc} from 'PUB_DIR/sources/utils/common-method-util';
import {LEAVE_TYPE} from 'PUB_DIR/sources/utils/consts';
let userData = require('PUB_DIR/sources/user-data');
import ModalDialog from 'CMP_DIR/ModalDialog';
import {hasPrivilege} from 'CMP_DIR/privilege/checker';
class ApplyViewDetail extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isShowCustomerUserListPanel: false,//是否展示该客户下的用户列表
            customerOfCurUser: {},//当前展示用户所属客户的详情
            showBackoutConfirm: false,
            ...LeaveApplyDetailStore.getState()
        };
    }

    onStoreChange = () => {
        this.setState(LeaveApplyDetailStore.getState());
    };

    componentDidMount() {
        LeaveApplyDetailStore.listen(this.onStoreChange);
        if (_.get(this.props,'detailItem.afterAddReplySuccess')){
            setTimeout(() => {
                LeaveApplyDetailAction.setDetailInfoObj(this.props.detailItem);
            });
        }else if (this.props.detailItem.id) {
            this.getBusinessApplyDetailData(this.props.detailItem);
        }
    }
    //审批状态
    renderApplyStatus = (detailInfo) => {
        var applyStatus = this.getApplyStatusText(detailInfo);
        var showApplyInfo = [{
            label: Intl.get('leave.apply.application.status', '审批状态'),
            text: applyStatus,
        }];
        return (
            <ApplyDetailInfo
                iconClass='icon-apply-status'
                showApplyInfo={showApplyInfo}
            />
        );
    };
    // 确认撤销申请
    saleConfirmBackoutApply = (e) => {
        Trace.traceEvent(e, '点击撤销申请按钮');
        this.setState({
            showBackoutConfirm: true
        });
    };
    // 隐藏撤销申请的模态框
    hideBackoutModal = () => {
        Trace.traceEvent($(ReactDOM.findDOMNode(this)).find('.btn-cancel'), '点击取消按钮');
        this.setState({
            showBackoutConfirm: false
        });
    };
    // 撤销申请
    cancelApplyApprove = (e) => {
        e.stopPropagation();
        Trace.traceEvent(e, '点击撤销按钮');
        let backoutObj = {
            id: this.props.detailItem.id,
        };
        LeaveApplyDetailAction.cancelApplyApprove(backoutObj,() => {
            this.setState({
                showBackoutConfirm: false
            });
        });
    };

    componentWillReceiveProps(nextProps) {
        var thisPropsId = this.props.detailItem.id;
        var nextPropsId = nextProps.detailItem.id;
        if (_.get(nextProps,'detailItem.afterAddReplySuccess')){
            setTimeout(() => {
                LeaveApplyDetailAction.setDetailInfoObj(nextProps.detailItem);
            });
        }else if (thisPropsId && nextPropsId && nextPropsId !== thisPropsId) {
            this.getBusinessApplyDetailData(nextProps.detailItem);
        }
    }

    componentWillUnmount() {
        LeaveApplyDetailStore.unlisten(this.onStoreChange);
    }

    getApplyListDivHeight() {
        var height = $(window).height() - APPLY_LIST_LAYOUT_CONSTANTS.TOP_DELTA - APPLY_LIST_LAYOUT_CONSTANTS.BOTTOM_DELTA;
        return height;
    }

    retryFetchDetail = (e) => {
        Trace.traceEvent(e, '点击了重试');
        if (this.props.detailItem.id) {
            this.getBusinessApplyDetailData(this.props.detailItem);
        }
    };

    getBusinessApplyDetailData(detailItem) {
        setTimeout(() => {
            LeaveApplyDetailAction.setInitialData(detailItem);

            //如果申请的状态是已通过或者是已驳回的时候，就不用发请求获取回复列表，直接用详情中的回复列表
            //其他状态需要发请求请求回复列表
            if (detailItem.status === 'pass' || detailItem.status === 'reject') {
                LeaveApplyDetailAction.getLeaveApplyCommentList({id: detailItem.id});
                LeaveApplyDetailAction.getLeaveApplyDetailById({id: detailItem.id}, detailItem.status);
            } else if (detailItem.id) {
                LeaveApplyDetailAction.getLeaveApplyDetailById({id: detailItem.id});
                LeaveApplyDetailAction.getLeaveApplyCommentList({id: detailItem.id});
                //根据申请的id获取申请的状态
                LeaveApplyDetailAction.getLeaveApplyStatusById({id: detailItem.id});
            }
        });
    }

    //重新获取回复列表
    refreshReplyList = (e) => {
        Trace.traceEvent(e, '点击了重新获取');
        var detailItem = this.props.detailItem;
        if (detailItem.status === 'pass' || detailItem.state === 'reject') {
            LeaveApplyDetailAction.setApplyComment(detailItem.approve_details);
        } else if (detailItem.id) {
            LeaveApplyDetailAction.getLeaveApplyCommentList({id: detailItem.id});
        }
    };
    //重新获取申请的状态
    refreshApplyStatusList = (e) => {
        var detailItem = this.props.detailItem;
        LeaveApplyDetailAction.getLeaveApplyStatusById({id: detailItem.id});
    };


    //显示客户详情
    showCustomerDetail(customerId) {
        //触发打开带拨打电话状态的客户详情面板
        phoneMsgEmitter.emit(phoneMsgEmitter.OPEN_PHONE_PANEL, {
            customer_params: {
                currentId: customerId,
                ShowCustomerUserListPanel: this.ShowCustomerUserListPanel,
                hideRightPanel: this.closeRightPanel
            }
        });
    }

    closeRightPanel = () => {
        this.setState({
            isShowCustomerUserListPanel: false,
            customerOfCurUser: {}
        });
    };
    //重新获取申请的状态
    refreshApplyStatusList = (e) => {
        var detailItem = this.props.detailItem;
        LeaveApplyDetailAction.getLeaveApplyStatusById({id: detailItem.id});
    };

    ShowCustomerUserListPanel = (data) => {
        this.setState({
            isShowCustomerUserListPanel: true,
            customerOfCurUser: data.customerObj
        });
    };
    getApplyStatusText = (obj) => {
        if (obj.status === 'pass') {
            return Intl.get('user.apply.pass', '已通过');
        } else if (obj.status === 'reject') {
            return Intl.get('user.apply.reject', '已驳回');
        } else if (obj.status === 'cancel'){
            return Intl.get('user.apply.backout', '已撤销');
        }else {
            if (this.state.replyStatusInfo.result === 'loading') {
                return (<Icon type="loading"/>);
            } else if (this.state.replyStatusInfo.errorMsg) {
                var message = (
                    <span>{this.state.replyStatusInfo.errorMsg}，<Icon type="reload"
                        onClick={this.refreshApplyStatusList}
                        title={Intl.get('common.get.again', '重新获取')}/></span>);
                return (<Alert message={message} type="error" showIcon={true}/> );
            } else if (_.isArray(this.state.replyStatusInfo.list)) {
                //状态可能会有多个
                var tipMsg = Intl.get('leave.apply.detail.wait', '待') + this.state.replyStatusInfo.list.join(',');
                if (!this.state.replyStatusInfo.list.length || _.indexOf(this.state.replyStatusInfo.list,APPLY_STATUS.READY_APPLY) > -1){
                    tipMsg += Intl.get('contract.10', '审核');
                }
                return (
                    <span>{tipMsg}</span>
                );
            }
        }
    };
    renderDetailApplyBlock(detailInfo) {
        var detail = detailInfo.detail || {};
        var begin_time = moment(detail.begin_time).format(oplateConsts.DATE_TIME_WITHOUT_SECOND_FORMAT);
        var end_time = moment(detail.end_time).format(oplateConsts.DATE_TIME_WITHOUT_SECOND_FORMAT);
        var targetObj = _.find(LEAVE_TYPE, (item) => {
            return item.value === detail.leave_type;
        });
        var leaveType = '';
        if (targetObj) {
            leaveType = targetObj.name;
        }
        var showApplyInfo = [
            {
                label: Intl.get('leave.apply.leave.time', '请假时间'),
                text: begin_time + ' - ' + end_time
            }, {
                label: Intl.get('leave.apply.leave.type', '请假类型'),
                text: leaveType
            }, {
                label: Intl.get('leave.apply.leave.reason', '请假原因'),
                text: detail.reason
            }, {
                label: Intl.get('leave.apply.leave.person', '请假人'),
                text: _.get(detailInfo, 'applicant.nick_name')
            }];
        return (
            <ApplyDetailInfo
                iconClass='icon-leave-apply'
                showApplyInfo={showApplyInfo}
            />
        );
    }



    renderBusinessCustomerDetail(detailInfo) {
        var detail = detailInfo.detail || {};
        var customersArr = _.get(detailInfo, 'detail.customers');
        var _this = this;
        var columns = [
            {
                title: Intl.get('call.record.customer', '客户'),
                dataIndex: 'name',
                className: 'apply-customer-name',
                render: function(text, record, index) {
                    return (
                        <a href="javascript:void(0)"
                            onClick={_this.showCustomerDetail.bind(this, record.id)}
                            data-tracename="查看客户详情"
                            title={Intl.get('call.record.customer.title', '点击可查看客户详情')}
                        >
                            {text}
                        </a>
                    );
                }
            }, {
                title: Intl.get('common.remark', '备注'),
                dataIndex: 'remarks',
                className: 'apply-remarks'
            }];
        return (
            <ApplyDetailCustomer
                columns={columns}
                data={customersArr}
            />
        );
    }


    //添加一条回复
    addReply = (e) => {
        Trace.traceEvent(e, '点击回复按钮');
        //如果ajax没有执行完，则不提交
        if (this.state.replyFormInfo.result === 'loading') {
            return;
        }
        //构造提交数据
        var submitData = {
            id: this.props.detailItem.id,
            comment: _.trim(this.state.replyFormInfo.comment),
        };
        if (!submitData.comment) {
            LeaveApplyDetailAction.showReplyCommentEmptyError();
            return;
        }
        //提交数据
        LeaveApplyDetailAction.addLeaveApplyComments(submitData);
    };
    //备注 输入框改变时候触发
    commentInputChange = (event) => {
        //如果添加回复的ajax没有执行完，则不提交
        if (this.state.replyFormInfo.result === 'loading') {
            return;
        }
        var val = _.trim(event.target.value);
        LeaveApplyDetailAction.setApplyFormDataComment(val);
        if (val) {
            LeaveApplyDetailAction.hideReplyCommentEmptyError();
        }
    };

    viewApprovalResult = (e) => {
        Trace.traceEvent(e, '查看审批结果');
        this.getBusinessApplyDetailData(this.props.detailItem);
        //设置这条审批不再展示通过和驳回的按钮
        LeaveApplyDetailAction.hideApprovalBtns();
    };

    //重新发送
    reSendApproval = (e) => {
        Trace.traceEvent(e, '点击重试按钮');
        this.submitApprovalForm();
    };

    //取消发送
    cancelSendApproval = (e) => {
        Trace.traceEvent(e, '点击取消按钮');
        LeaveApplyDetailAction.cancelSendApproval();
    };

    submitApprovalForm = (approval) => {
        if (approval === 'pass') {
            Trace.traceEvent($(ReactDOM.findDOMNode(this)).find('.btn-primary-sure'), '点击通过按钮');
        } else if (approval === 'reject') {
            Trace.traceEvent($(ReactDOM.findDOMNode(this)).find('.btn-primary-sure'), '点击驳回按钮');
        }
        var detailInfoObj = this.state.detailInfoObj.info;
        LeaveApplyDetailAction.approveLeaveApplyPassOrReject({
            id: detailInfoObj.id,
            agree: approval
        });
    };
    //渲染详情底部区域
    renderDetailBottom() {
        var detailInfoObj = this.state.detailInfoObj.info;
        //是否审批
        let isConsumed = detailInfoObj.status === 'pass' || detailInfoObj.status === 'reject';
        var userName = _.last(_.get(detailInfoObj, 'approve_details')) ? _.last(_.get(detailInfoObj, 'approve_details')).nick_name ? _.last(_.get(detailInfoObj, 'approve_details')).nick_name : '' : '';
        var approvalDes = getApplyResultDscr(detailInfoObj);
        let showCancelBtn = detailInfoObj.showCancelBtn;
        var renderAssigenedContext = null;
        if(hasPrivilege('GET_MY_WORKFLOW_LIST') && showCancelBtn ){
            // 在没有通过申请前，可以撤销自己的申请
            renderAssigenedContext = this.renderCancelApplyApproveBtn;
        }
        return (
            <ApplyDetailBottom
                create_time={detailInfoObj.create_time}
                applicantText={_.get(detailInfoObj, 'applicant.nick_name','') + Intl.get('crm.109', '申请')}
                isConsumed={isConsumed}
                update_time={detailInfoObj.update_time}
                approvalText={userName + approvalDes}
                showApproveBtn={detailInfoObj.showApproveBtn || showCancelBtn}
                submitApprovalForm={this.submitApprovalForm}
                renderAssigenedContext={renderAssigenedContext}
            />);
    }
    renderApplyApproveSteps =() => {
        var stepStatus = '';
        //已经结束的用approve_detail里的列表 没有结束的，用comment里面取数据
        var applicantList = _.get(this.state, 'detailInfoObj.info');
        var replyList = [];
        if ((applicantList.status === 'pass' || applicantList.status === 'reject' || applicantList.status === 'cancel') && _.isArray(_.get(this.state, 'detailInfoObj.info.approve_details'))){
            replyList = _.get(this.state, 'detailInfoObj.info.approve_details');
        }else{
            replyList = _.get(this,'state.replyListInfo.list');
            replyList = _.filter(replyList,(item) => {return !item.comment;});
            replyList = _.sortBy( _.cloneDeep(replyList), [(item) => { return item.comment_time; }]);
        }
        var applicateName = _.get(applicantList, 'applicant.nick_name') || '';
        var applicateTime = moment(_.get(applicantList, 'create_time')).format(oplateConsts.DATE_TIME_FORMAT);
        var stepArr = [{
            title: Intl.get('user.apply.submit.list', '提交申请'),
            description: applicateName + ' ' + applicateTime
        }];
        var currentLength = 0;
        //过滤掉手动添加的回复
        currentLength = replyList.length;
        if (currentLength) {
            _.forEach(replyList, (replyItem, index) => {
                var descrpt = getApplyStatusTimeLineDesc(replyItem.status);
                if (replyItem.status === 'reject'){
                    stepStatus = 'error';
                    currentLength--;
                }
                stepArr.push({
                    title: descrpt,
                    description: (replyItem.nick_name || userData.getUserData().nick_name || '') + ' ' + moment(replyItem.comment_time).format(oplateConsts.DATE_TIME_FORMAT)
                });
            });
        }
        //如果下一个节点是直接主管审核
        if (applicantList.status === 'ongoing') {
            stepArr.push({
                title: Intl.get('user.apply.false', '待审批'),
                description: ''
            });
        }
        return (
            <Steps current={currentLength + 1} status={stepStatus}>
                {_.map(stepArr, (stepItem) => {
                    return (
                        <Step title={stepItem.title} description={stepItem.description}/>
                    );
                })}
            </Steps>
        );
    };
 renderCancelApplyApproveBtn = () => {
     return (
         <div className="pull-right">
             {this.state.backApplyResult.loading ?
                 <Icon type="loading"/> :
                 <Button type="primary" className="btn-primary-sure" size="small"
                     onClick={this.saleConfirmBackoutApply}>
                     {Intl.get('user.apply.detail.backout', '撤销申请')}
                 </Button>}
         </div>
     );
 };
    renderCancelApplyApprove = () => {
        if (this.state.showBackoutConfirm){
            return (
                <ModalDialog
                    modalShow={this.state.showBackoutConfirm}
                    container={this}
                    hideModalDialog={this.hideBackoutModal}
                    modalContent={Intl.get('user.apply.detail.modal.content', '是否撤销此申请？')}
                    delete={this.cancelApplyApprove}
                    showResultLoading={this.state.backApplyResult.loading}
                    okText={Intl.get('user.apply.detail.modal.ok', '撤销')}
                    delayClose={true}
                />
            );
        }else{
            return null;
        }
    };
    //渲染申请单详情
    renderApplyDetailInfo() {
        var detailInfo = this.state.detailInfoObj.info;
        //如果没有详情数据，不渲染
        if (this.state.detailInfoObj.loadingResult || _.isEmpty(this.state.detailInfoObj)) {
            return;
        }
        //详情高度
        let applyDetailHeight = this.getApplyListDivHeight();
        return (
            <div>
                <div className="apply-detail-title">
                    <span className="apply-type-tip">
                        {getApplyTopicText(detailInfo)}
                    </span>
                </div>
                <div className="apply-detail-content" style={{height: applyDetailHeight}} ref="geminiWrap">
                    <GeminiScrollbar ref="gemini">
                        {this.renderDetailApplyBlock(detailInfo)}
                        {/*渲染客户详情*/}
                        {_.isArray(_.get(detailInfo, 'detail.customers')) ? this.renderBusinessCustomerDetail(detailInfo) : null}
                        {this.renderApplyStatus(detailInfo)}
                        {/*流程步骤图*/}
                        <ApplyDetailBlock
                            iconclass='icon-apply-message-tip'
                            renderApplyInfoContent={this.renderApplyApproveSteps}
                        />
                        <ApplyDetailRemarks
                            detailInfo={detailInfo}
                            replyListInfo={this.state.replyListInfo}
                            replyFormInfo={this.state.replyFormInfo}
                            refreshReplyList={this.refreshReplyList}
                            addReply={this.addReply}
                            commentInputChange={this.commentInputChange}
                        />
                    </GeminiScrollbar>

                </div>
                {this.renderDetailBottom()}
                {this.renderCancelApplyApprove()}
            </div>
        );
    }

    render() {
        //如果获取左侧列表失败了，则显示空
        if (this.props.showNoData) {
            return null;
        }
        return (
            <div className='col-md-8 leave_manage_apply_detail_wrap' data-tracename="请假审批详情界面">
                <ApplyDetailStatus
                    showLoading={this.state.detailInfoObj.loadingResult === 'loading'}
                    showErrTip={this.state.detailInfoObj.loadingResult === 'error'}
                    errMsg={this.state.detailInfoObj.errorMsg}
                    retryFetchDetail={this.retryFetchDetail}
                    showNoData={this.props.showNoData}
                />
                {this.renderApplyDetailInfo()}
                <ApplyApproveStatus
                    showLoading={this.state.applyResult.submitResult === 'loading'}
                    approveSuccess={this.state.applyResult.submitResult === 'success'}
                    viewApprovalResult={this.viewApprovalResult}
                    approveError={this.state.applyResult.submitResult === 'error'}
                    applyResultErrorMsg={this.state.applyResult.errorMsg}
                    reSendApproval={this.reSendApproval}
                    cancelSendApproval={this.cancelSendApproval}
                    container={this}
                />
                {/*该客户下的用户列表*/}
                {
                    this.state.isShowCustomerUserListPanel ?
                        <RightPanel
                            className="customer-user-list-panel"
                            showFlag={this.state.isShowCustomerUserListPanel}
                        >
                            <AppUserManage
                                customer_id={customerOfCurUser.id}
                                hideCustomerUserList={this.closeCustomerUserListPanel}
                                customer_name={customerOfCurUser.name}
                            />
                        </RightPanel> : null
                }

            </div>

        );
    }
}
ApplyViewDetail.defaultProps = {
    detailItem: {},
    showNoData: false,

};
ApplyViewDetail.propTypes = {
    detailItem: PropTypes.string,
    showNoData: PropTypes.boolean
};
module.exports = ApplyViewDetail;