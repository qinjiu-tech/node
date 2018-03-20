/**
 * Copyright (c) 2016-2017 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2016-2017 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by zhangshujuan on 2018/3/15.
 */
require("../css/schedule-item.less");
import SalesHomePageAction from "../action/sales-home-actions";
import {Button, message} from "antd";
import userData from "PUB_DIR/sources/user-data";
import ContactItem from "./contact-item";
import CrmRightPanel from 'MOD_DIR/crm/public/views/crm-right-panel';
import AppUserManage from "MOD_DIR/app_user_manage/public";
import {RightPanel}  from "CMP_DIR/rightPanel";
var user_id = userData.getUserData().user_id;
class ScheduleItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            scheduleItemDetail: this.props.scheduleItemDetail,
            handleStatusLoading: false,//正在提交修改日程的状态
            isEdittingItemId: "",//正在修改状态的那条日程的id
            curShowCustomerId: "",//展示客户详情的客户id
            curShowUserId: "",//展示用户详情的用户id
            isShowCustomerUserListPanel: false,//是否展示客户下的用户列表
            CustomerInfoOfCurrUser: {}//当前展示用户所属客户的详情
        }
    };

    componentWillReceiveProps(nextProps) {
        if (nextProps.scheduleItemDetail.id && nextProps.scheduleItemDetail.id !== this.state.scheduleItemDetail.id) {
            this.setState({
                scheduleItemDetail: nextProps.scheduleItemDetail
            })
        }
    };

    closeCustomerUserListPanel = () => {
        this.setState({
            isShowCustomerUserListPanel: false
        })
    };
    closeRightCustomerPanel = () => {
        this.setState({curShowCustomerId: ""});
    };
    ShowCustomerUserListPanel = (data) => {
        this.setState({
            isShowCustomerUserListPanel: true,
            CustomerInfoOfCurrUser: data.customerObj
        });

    };
    openCustomerDetail = (customer_id) => {
        if (this.state.curShowUserId) {
            this.closeRightUserPanel();
        }
        this.setState({curShowCustomerId: customer_id});
    };

    handleFinishedSchedule(scheduleId) {
        //点击日程列表中的标记为完成
        const reqData = {
            id: scheduleId,
            status: "handle",
        };
        this.setState({
            handleStatusLoading: true,
            isEdittingItemId: scheduleId
        });
        SalesHomePageAction.handleScheduleStatus(reqData, (resData) => {
            this.setState({
                handleStatusLoading: false,
                isEdittingItemId: ""
            });
            if (_.isBoolean(resData) && resData) {
                //标记为完成后，把样式改成标记完成的样式
                SalesHomePageAction.afterHandleStatus({
                    type: this.props.scheduleType,
                    id: scheduleId
                });
            } else {
                message.error(resData || Intl.get("crm.failed.alert.todo.list", "修改待办事项状态失败"));
            }
        });
    };

    render() {
        var schedule = this.state.scheduleItemDetail;
        //联系人的相关信息
        var contacts = schedule.contacts ? schedule.contacts : [];
        var contactTime = moment(schedule.start_time).format(oplateConsts.DATE_TIME_WITHOUT_SECOND_FORMAT) + "-" + moment(schedule.end_time).format(oplateConsts.TIME_FORMAT_WITHOUT_SECOND_FORMAT);
        return (
            <div className="schedule-item-container">
                {this.props.isShowTopTitle ? <div className="schedule-top-panel">
                    {Intl.get("sales.fromtpage.set.contact.time", "原定于{initialtime}联系", {initialtime: contactTime})}
                </div> : null}
                <div className="schedule-content-panel">
                    <div className="schedule-title">
                        <a className="customer-name" onClick={this.openCustomerDetail.bind(this, schedule.customer_id)}>
                            {schedule.topic || schedule.customer_name}
                        </a>
                        {user_id == schedule.member_id && schedule.status !== "handle" ?
                            <Button type="primary" data-tracename="点击标记完成了按钮" size="small"
                                    onClick={this.handleFinishedSchedule.bind(this, schedule.id)}>{Intl.get("sales.frontpage.schedule.has.finished", "完成了")}</Button> : null}

                    </div>
                    <div className="schedule-content">
                        {this.props.isShowScheduleTimerange ? <span className="time-range">
                             [{moment(schedule.start_time).format(oplateConsts.TIME_FORMAT_WITHOUT_SECOND_FORMAT)}-{
                            moment(schedule.end_time).format(oplateConsts.TIME_FORMAT_WITHOUT_SECOND_FORMAT)
                        }]
                        </span> : null}
                        {schedule.content}
                    </div>
                    <ContactItem
                        contacts={contacts}
                    />
                </div>
                {
                    this.state.curShowCustomerId ? <CrmRightPanel
                        currentId={this.state.curShowCustomerId}
                        showFlag={true}
                        hideRightPanel={this.closeRightCustomerPanel}
                        ShowCustomerUserListPanel={this.ShowCustomerUserListPanel}
                        refreshCustomerList={function () {
                        }}
                    /> : null
                }
                {/*该客户下的用户列表*/}
                <RightPanel
                    className="customer-user-list-panel"
                    showFlag={this.state.isShowCustomerUserListPanel}
                >
                    { this.state.isShowCustomerUserListPanel ?
                        <AppUserManage
                            customer_id={this.state.CustomerInfoOfCurrUser.id}
                            hideCustomerUserList={this.closeCustomerUserListPanel}
                            customer_name={this.state.CustomerInfoOfCurrUser.name}
                        /> : null
                    }
                </RightPanel>
            </div>
        )
    }
}
;
ScheduleItem.defaultProps = {
    scheduleItemDetail: {},//日程详细信息
    isShowTopTitle: true, //是否展示顶部时间样式
    isShowScheduleTimerange: true,//是否展示日程的时间范围

};
export default ScheduleItem;