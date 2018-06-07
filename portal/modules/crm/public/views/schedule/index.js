require('../../css/schedule.less');
var ScheduleStore = require('../../store/schedule-store');
var ScheduleAction = require('../../action/schedule-action');
var CrmScheduleForm = require('./form');
import {Icon, message, Button, Alert, Popover} from 'antd';
var GeminiScrollbar = require('../../../../../components/react-gemini-scrollbar');
var TimeLine = require('CMP_DIR/time-line-new');
import Trace from 'LIB_DIR/trace';
const DATE_TIME_WITHOUT_SECOND_FORMAT = oplateConsts.DATE_TIME_WITHOUT_SECOND_FORMAT;
import userData from 'PUB_DIR/sources/user-data';
var user_id = userData.getUserData().user_id;
import Spinner from 'CMP_DIR/spinner';
import classNames from 'classnames';
import DetailCard from 'CMP_DIR/detail-card';
import {DetailEditBtn} from 'CMP_DIR/rightPanel';
import ScheduleItem from './schedule-item';
import RightPanelScrollBar from '../components/rightPanelScrollBar';
import NoDataTip from '../components/no-data-tip';
import ErrorDataTip from '../components/error-data-tip';
var CrmSchedule = React.createClass({
    getInitialState: function() {
        return {
            customerId: this.props.curCustomer.id || '',
            ...ScheduleStore.getState()
        };
    },
    onStoreChange: function() {
        this.setState(ScheduleStore.getState());
    },
    componentDidMount: function() {
        ScheduleStore.listen(this.onStoreChange);
        //获取日程管理列表
        this.getScheduleList();
    },
    componentWillReceiveProps: function(nextProps) {
        var nextCustomerId = nextProps.curCustomer.id || '';
        var oldCustomerId = this.props.curCustomer.id || '';
        if (nextCustomerId !== oldCustomerId) {
            setTimeout(() => {
                this.setState({
                    customerId: nextCustomerId
                }, () => {
                    ScheduleAction.resetState();
                    this.getScheduleList();
                });
            });
        }
    },
    componentWillUnmount: function() {
        ScheduleStore.unlisten(this.onStoreChange);
        setTimeout(() => {
            ScheduleAction.resetState();
        });
    },
    getScheduleList: function() {
        let queryObj = {
            customer_id: this.state.customerId || '',
            page_size: this.state.pageSize || 20,
        };
        if (this.state.lastScheduleId) {
            queryObj.id = this.state.lastScheduleId;
        }
        ScheduleAction.getScheduleList(queryObj);
    },
    addSchedule: function() {
        const newSchedule = {
            customer_id: this.props.curCustomer.id,
            customer_name: this.props.curCustomer.name,
            start_time: '',
            end_time: '',
            alert_time: '',
            topic: '',
            edit: true
        };
        ScheduleAction.showAddForm(newSchedule);
        //滚动条滚动到顶端以显示添加表单
        GeminiScrollbar.scrollTo(this.refs.alertWrap, 0);
    },
    editSchedule: function(alert) {
        Trace.traceEvent(this.getDOMNode(), '编辑联系计划');
        ScheduleAction.showEditForm(alert);
    },
    //修改状态
    handleItemStatus: function(item) {
        //只能修改自己创建的日程的状态
        if (user_id != item.member_id) {
            return;
        }
        const reqData = {
            id: item.id,
            status: item.status == 'false' ? 'handle' : 'false',
        };
        var status = item.status == 'false' ? '完成' : '未完成';
        Trace.traceEvent($(this.getDOMNode()).find('.item-wrapper .ant-btn'), '修改联系计划的状态为' + status);
        ScheduleAction.handleScheduleStatus(reqData, (resData) => {
            if (_.isBoolean(resData) && resData) {
                var newStatusObj = {
                    'id': item.id,
                    'status': reqData.status
                };
                ScheduleAction.afterHandleStatus(newStatusObj);
            } else {
                message.error(resData || Intl.get('crm.failed.alert.todo.list', '修改待办事项状态失败'));
            }
        });
    },
    deleteSchedule: function(id) {
        const reqData = {id: id};
        Trace.traceEvent($(this.getDOMNode()).find('.item-wrapper .anticon-delete'), '删除联系计划');
        ScheduleAction.deleteSchedule(reqData, (resData) => {
            if (_.isBoolean(resData) && resData) {
                ScheduleAction.afterDelSchedule(id);
                this.setState({
                    scheduleList: this.state.scheduleList
                });
            } else {
                message.error(Intl.get('crm.139', '删除失败'));
            }
        });
    },
    //下拉加载
    handleScrollBarBottom: function() {
        var currListLength = _.isArray(this.state.scheduleList) ? this.state.scheduleList.length : 0;
        // 判断加载的条件
        if (currListLength < this.state.total) {
            this.getScheduleList();
        }
    },
    updateScheduleList: function(newItem, type) {
        //如果是新增一个提醒
        if (type == 'add') {
            newItem.edit = false;
            this.state.scheduleList.unshift(newItem);
        } else if (type == 'delete') {
            this.state.scheduleList = _.filter(this.state.scheduleList, (list) => {
                return list.id !== newItem.id;
            });
        }
        this.setState({
            scheduleList: this.state.scheduleList
        });
    },


    toggleScheduleContact(item, flag){
        let curSchedule = _.find(this.state.scheduleList, schedule => schedule.id == item.id);
        curSchedule.isShowContactPhone = flag;
        this.setState({scheduleList: this.state.scheduleList});
    },

    renderTimeLineItem(item, hasSplitLine){
        if (item.edit) {
            return (
                <div className="form-wrapper">
                    <CrmScheduleForm
                        getScheduleList={this.getScheduleList}
                        currentSchedule={item}
                        curCustomer={this.props.curCustomer}
                    />
                </div>
            );
        } else {
            return (
                <ScheduleItem item={item}
                    hasSplitLine={hasSplitLine}
                    isMerge={this.props.isMerge}
                    toggleScheduleContact={this.toggleScheduleContact}
                    deleteSchedule={this.deleteSchedule}
                    handleItemStatus={this.handleItemStatus}
                />);
        }
    },

    renderScheduleContent(){
        return (
            <div className="schedule-list" data-tracename="联系计划页面">
                {this.state.isLoadingScheduleList && !this.state.lastScheduleId ? <Spinner />
                    : this.state.getScheduleListErrmsg ? (
                        <ErrorDataTip errorMsg={this.state.getScheduleListErrmsg} isRetry={true}
                            retryFunc={this.getScheduleList}/>)
                        : this.renderScheduleLists()
                }
            </div>);
    },
    //联系计划列表区域
    renderScheduleLists: function() {
        if (_.isArray(this.state.scheduleList) && this.state.scheduleList.length) {
            return (
                <TimeLine
                    list={this.state.scheduleList}
                    groupByDay={true}
                    groupByYear={true}
                    timeField="start_time"
                    renderTimeLineItem={this.renderTimeLineItem}
                    relativeDate={false}
                />);
        } else {
            //加载完成，没有数据的情况
            return (<NoDataTip tipContent={Intl.get('common.no.data', '暂无数据')}/>);
        }
    },
    renderScheduleTitle(){
        return (
            <div className="schedule-title">
                <span>{Intl.get('crm.right.schedule', '联系计划')}:</span>
                {this.props.isMerge ? null : (
                    <span className="iconfont icon-add schedule-add-btn"
                        title={Intl.get('crm.214', '添加联系计划')}
                        onClick={this.addSchedule}/>)
                }
            </div>);
    },
    render(){
        return (
            <RightPanelScrollBar handleScrollBottom={this.handleScrollBarBottom}
                listenScrollBottom={this.state.listenScrollBottom}>
                <DetailCard title={this.renderScheduleTitle()}
                    content={this.renderScheduleContent()}
                    className="schedule-contianer"/>
            </RightPanelScrollBar>
        );
    }
});

module.exports = CrmSchedule;
