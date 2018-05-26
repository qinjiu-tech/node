require('../css/crm-right-panel.less');

var Tabs = require("antd").Tabs;
var TabPane = Tabs.TabPane;
var rightPanelUtil = require("../../../../components/rightPanel/index");
var RightPanel = rightPanelUtil.RightPanel;
var RightPanelClose = rightPanelUtil.RightPanelClose;
var RightPanelReturn = rightPanelUtil.RightPanelReturn;
var Contacts = require("./contacts");
var Dynamic = require("./dynamic");
var CrmSchedule = require("./schedule");
var Order = require("./order");
var ApplyUserForm = require("./apply-user-form");
var CustomerRecord = require("./customer_record");
var crmAjax = require("../ajax");
import Trace from "LIB_DIR/trace";
import {tabNameList} from "../utils/crm-util";
import BasicInfo from "./basic_info";
import BasicOverview from "./basic-overview";
import CustomerUsers from "./users";
var CrmRightPanel = React.createClass({
    getInitialState: function() {
        return {
            activeKey: "1",//tab激活页的key
            applyUserShowFlag: false,//申请用户界面是否展示
            openAppShowFlag: false,//开通应用界面是否展示
            applyType: 2,//2：申请新增试用用户，3，申请新增正式用户
            apps: [],
            curOrder: {},
            curCustomer: this.props.curCustomer,
            tabsContainerHeight: "auto"
        };
    },

    componentWillMount: function() {
        if (!this.state.curCustomer) {
            if (this.props.currentId) {
                this.getCurCustomer(this.props.currentId);
            } else if (this.props.phoneNum) {
                this.getCurCustomerDetailByPhone(this.props.phoneNum);
            }
        }
    },
    componentDidMount: function() {
        this.setTabsContainerHeight();
        $(window).resize(e => {
            e.stopPropagation();
            this.setTabsContainerHeight();
        });
    },

    componentWillReceiveProps: function(nextProps) {
        if (nextProps.curCustomer && (nextProps.curCustomer.id !== this.state.curCustomer.id)) {
            this.state.applyUserShowFlag = false;
            this.state.openAppShowFlag = false;
            this.state.curCustomer = nextProps.curCustomer;
            this.setState(this.state);
        } else if (nextProps.currentId !== this.props.currentId) {
            this.state.applyUserShowFlag = false;
            this.state.openAppShowFlag = false;
            this.getCurCustomer(nextProps.currentId);
        }
    },

    setTabsContainerHeight: function() {
        let tabsContainerHeight = $("body").height() - $(".basic-info-contianer").outerHeight(true);
        this.setState({tabsContainerHeight: tabsContainerHeight});
    },
    getCurCustomerDetailByPhone: function(phoneNum) {
        this.state.curCustomer = this.props.clickCustomerData;
        this.setState(this.state);
    },

    getCurCustomer: function(id) {
        let condition = {id: id};
        crmAjax.queryCustomer(condition).then(resData => {
            if (resData && _.isArray(resData.result) && resData.result.length) {
                this.state.curCustomer = resData.result[0];
                this.setState(this.state);
            }
        }, () => {
            this.setState(this.state);
        });
    },

    //展示申请用户界面
    showApplyUserForm: function(type, curOrder, apps) {
        this.setState({
            applyType: type,
            apps: apps,
            curOrder: curOrder
        }, () => {
            this.setState({applyUserShowFlag: true});
        });
    },
    showOpenAppForm: function() {
        this.setState({openAppShowFlag: true});
    },
    returnInfoPanel: function() {
        //申请、开通应用后返回
        this.setState({
            applyUserShowFlag: false,
            openAppShowFlag: false
        });
    },

    hideRightPanel: function(e) {
        Trace.traceEvent(e, "关闭客户详情");
        this.props.hideRightPanel();
        this.setState({
            applyUserShowFlag: false,
            openAppShowFlag: false,
            activeKey: "1"
        });
    },
    //切换tab时的处理
    changeActiveKey: function(key) {
        Trace.traceEvent($(this.getDOMNode()).find(".ant-tabs-nav-wrap .ant-tabs-nav"), "查看" + tabNameList[key]);
        this.setState({
            activeKey: key
        });
    },
    render: function() {
        var className = "right-panel-content";
        if (this.state.applyUserShowFlag) {
            //展示form面板时，整体左移
            className += " crm-right-panel-content-slide";
        }
        return (
            <RightPanel showFlag={this.props.showFlag}
                className={this.state.applyUserShowFlag || this.state.openAppShowFlag ? "apply-user-form-panel  white-space-nowrap table-btn-fix" : "crm-right-panel  white-space-nowrap table-btn-fix"}
                data-tracename="客户详情">
                <span className="iconfont icon-close" onClick={(e) => {
                    this.hideRightPanel(e);
                }}/>
                <div className={className}>
                    <BasicInfo isRepeat={this.props.isRepeat}
                        curCustomer={this.state.curCustomer}
                        refreshCustomerList={this.props.refreshCustomerList}
                        editCustomerBasic={this.props.editCustomerBasic}
                        handleFocusCustomer={this.props.handleFocusCustomer}
                        setTabsContainerHeight={this.setTabsContainerHeight}
                        showRightPanel={this.props.showRightPanel}
                    />
                    <div className="crm-right-panel-content" style={{height: this.state.tabsContainerHeight}}>
                        {this.state.curCustomer ? (
                            <Tabs
                                defaultActiveKey="1"
                                activeKey={this.state.activeKey}
                                onChange={this.changeActiveKey}
                            >
                                <TabPane
                                    tab={Intl.get("crm.basic.overview", "概览")}
                                    key="1"
                                >
                                    {this.state.activeKey == "1" ? (
                                        <BasicOverview
                                            isRepeat={this.props.isRepeat}
                                            curCustomer={this.state.curCustomer}
                                            refreshCustomerList={this.props.refreshCustomerList}
                                            editCustomerBasic={this.props.editCustomerBasic}
                                            changeActiveKey={this.changeActiveKey}
                                        />
                                    ) : null}
                                </TabPane>
                                <TabPane
                                    tab={Intl.get("call.record.contacts", "联系人")}
                                    key="2"
                                >
                                    {this.state.activeKey == "2" ? (
                                        <Contacts
                                            updateCustomerDefContact={this.props.updateCustomerDefContact}
                                            refreshCustomerList={this.props.refreshCustomerList}
                                            curCustomer={this.state.curCustomer}
                                        />
                                    ) : null}
                                </TabPane>
                                <TabPane
                                    tab={Intl.get("menu.trace", "跟进记录")}
                                    key="3"
                                >
                                    {this.state.activeKey == "3" ? (
                                        <CustomerRecord
                                            curCustomer={this.state.curCustomer}
                                            refreshCustomerList={this.props.refreshCustomerList}
                                        />
                                    ) : null}
                                </TabPane>
                                <TabPane
                                    tab={Intl.get("crm.detail.user", "用户")}
                                    key="4"
                                >
                                    {this.state.activeKey == "4" ? (
                                        <CustomerUsers
                                            curCustomer={this.state.curCustomer}
                                            refreshCustomerList={this.props.refreshCustomerList}
                                            ShowCustomerUserListPanel={this.props.ShowCustomerUserListPanel}
                                            userViewShowCustomerUserListPanel={this.props.userViewShowCustomerUserListPanel}
                                            showOpenAppForm={this.showOpenAppForm}
                                            closeOpenAppPanel={this.returnInfoPanel}
                                        />
                                    ) : null}
                                </TabPane>
                                <TabPane
                                    tab={Intl.get("user.apply.detail.order", "订单")}
                                    key="5"
                                >
                                    {this.state.activeKey == "5" ? (
                                        <Order
                                            closeRightPanel={this.props.hideRightPanel}
                                            curCustomer={this.state.curCustomer}
                                            refreshCustomerList={this.props.refreshCustomerList}
                                            showApplyUserForm={this.showApplyUserForm}
                                        />
                                    ) : null}
                                </TabPane>
                                <TabPane
                                    tab={Intl.get("crm.39", "动态")}
                                    key="6"

                                >
                                    {this.state.activeKey == "6" ? (
                                        <Dynamic
                                            currentId={this.state.curCustomer.id}
                                        />
                                    ) : null}
                                </TabPane>
                                <TabPane
                                    tab={Intl.get("crm.right.schedule", "联系计划")}
                                    key="7"
                                >
                                    {this.state.activeKey == "7" ? (
                                        <CrmSchedule
                                            curCustomer={this.state.curCustomer}
                                        />
                                    ) : null}
                                </TabPane>
                            </Tabs>
                        ) : null}
                    </div>
                </div>
                {this.state.curOrder.id ? (
                    <div className={className}>
                        <RightPanelReturn onClick={this.returnInfoPanel}/>
                        <RightPanelClose onClick={this.hideRightPanel}/>
                        <div className="crm-right-panel-content">
                            <ApplyUserForm
                                applyType={this.state.applyType}
                                apps={this.state.apps}
                                order={this.state.curOrder}
                                customerName={this.state.curCustomer.name}
                                cancelApply={this.returnInfoPanel}
                            />
                        </div>
                    </div>
                ) : null}
            </RightPanel>
        );
    }
});

module.exports = CrmRightPanel;

