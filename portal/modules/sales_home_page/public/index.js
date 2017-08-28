require("./scss/index.scss");
import {Table,Icon,Select} from "antd";
import Trace from "LIB_DIR/trace";
const Option = Select.Option;
var RightContent = require("../../../components/privilege/right-content");
var SalesHomeStore = require("./store/sales-home-store");
var SalesHomeAction = require("./action/sales-home-actions");
var TableUtil = require("../../../components/antd-table-pagination");
var TopNav = require("../../../components/top-nav");
import DatePicker from "../../../components/datepicker";
import {hasPrivilege} from "CMP_DIR/privilege/checker";
var insertStyle = require("../../../components/insert-style");
var StatisticTotal = require("./views/statistic-total");
var CrmRightList = require("./views/crm-right-list");
var CustomerAnalysis = require("./views/customer-analysis");
var UserAnalysis = require("./views/user-analysis");
var constantUtil = require("./util/constant");
var viewConstant = constantUtil.VIEW_CONSTANT;//视图常量
var layoutConstant = constantUtil.LAYOUTS;//布局常量
var dynamicStyle;
var scrollTimeout = null;
// 通话类型的常量
const CALL_TYPE_OPTION = {
    ALL: 'all',
    PHONE: 'phone',
    APP: 'app'
};
var SalesHomePage = React.createClass({
    getInitialState: function () {
        let stateData = SalesHomeStore.getState();
        return {
            ...stateData,
            scrollbarEnabled: false, //是否需要滚动条
            callType: CALL_TYPE_OPTION.ALL, // 通话类型
        }
    },
    onChange: function () {
        this.setState(SalesHomeStore.getState());
    },
    getDataType: function () {
        if (hasPrivilege("GET_TEAM_LIST_ALL")) {
            return "all";
        } else if (hasPrivilege("GET_TEAM_LIST_MYTEAM_WITH_SUBTEAMS")) {
            return "self";
        } else {
            return "";
        }
    },
    componentDidMount: function () {
        SalesHomeStore.listen(this.onChange);
        let type = this.getDataType();
        SalesHomeAction.getSalesTeamList(type);
        this.refreshSalesListData();
        if (this.state.activeView == viewConstant.PHONE) {
            TableUtil.zoomInSortArea(this.refs.phoneList);
            TableUtil.alignTheadTbody(this.refs.phoneList);
        }
        this.resizeLayout();
        $(window).resize(()=>this.resizeLayout());
        $(".statistic-data-analysis").mousewheel(function () {
            $(".statistic-data-analysis .thumb").show();
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(()=>$(".statistic-data-analysis .thumb").hide(), 300);
        });
    },
    componentDidUpdate: function () {
        if (this.state.activeView == viewConstant.PHONE) {
            TableUtil.zoomInSortArea(this.refs.phoneList);
            TableUtil.alignTheadTbody(this.refs.phoneList);
        }
    },
    resizeLayout: function () {
        //宽屏不出现滚动条
        if ($(window).width() < Oplate.layout['screen-md']) {
            $('body').css({
                'overflow-x': 'visible',
                'overflow-y': 'visible'
            });
            //窄屏出现滚动条
            this.state.scrollbarEnabled = false;
        } else {
            $('body').css({
                'overflow-x': 'hidden',
                'overflow-y': 'hidden'
            });
            this.state.scrollbarEnabled = true;
        }
        this.setState({
            scrollbarEnabled: this.state.scrollbarEnabled
        });
        if (this.state.activeView == viewConstant.PHONE) {
            this.setPhoneListHeight();
        }
    },
    setPhoneListHeight: function () {
        let phoneListHeight = "auto";
        if (this.state.scrollbarEnabled) {
            phoneListHeight = $(window).height() - layoutConstant.TOP - $(".statistic-total-data").height() - layoutConstant.BOTTOM - layoutConstant.THEAD;
        }
        if (dynamicStyle) {
            dynamicStyle.destroy();
        }
        dynamicStyle = insertStyle('.sales-phone-table .ant-table-body {height:' + phoneListHeight + 'px;overflow:auto}');
    },
    componentWillUnmount: function () {
        SalesHomeStore.unlisten(this.onChange);
    },
    //获取查询参数
    getQueryParams: function () {
        let queryParams = {
            urltype: 'v2',
            starttime: this.state.start_time,
            endtime: this.state.end_time
        };
        if (this.state.currShowSalesman) {
            //查看当前选择销售的统计数据
            queryParams.member_id = this.state.currShowSalesman.userId;
        } else if (this.state.currShowSalesTeam) {
            //查看当前选择销售团队内所有成员的统计数据
            queryParams.team_id = this.state.currShowSalesTeam.group_id;
        }
        return queryParams;
    },
    //刷新数据
    refreshSalesListData: function () {
        let queryParams = this.getQueryParams();
        let dataType = this.getDataType();
        queryParams.dataType = dataType;
        SalesHomeAction.getCustomerTotal(queryParams);
        SalesHomeAction.getUserTotal(queryParams);
        //获取销售(团队)-电话列表
        SalesHomeAction.setListIsLoading(viewConstant.PHONE);
        //电话统计取“全部”时，开始时间传0，结束时间传当前时间
        SalesHomeAction.getSalesPhoneList({
            start_time: queryParams.starttime || 0,
            end_time: queryParams.endtime || moment().toDate().getTime(),
            type: this.state.callType
        }, dataType);
    },
    //获取销售列的标题
    getSalesColumnTitle: function () {
        var userType = this.state.userType;
        var label = Intl.get("sales.home.sales", "销售");
        if (userType == "senior_leader") {
            label = Intl.get("user.sales.team", "销售团队");
        }
        return label;
    },

    getPhoneListColumn: function () {
        let columns = [{
            title: this.getSalesColumnTitle(),
            dataIndex: 'salesName',
            key: 'sales_Name'
        }, {
            title: Intl.get("sales.home.total.duration", "总时长"),
            dataIndex: 'totalTimeDescr',
            key: 'total_time',
            sorter: function (a, b) {
                return a.totalTime - b.totalTime;
            },
            className: 'has-filter table-data-align-right'
        }, {
            title: Intl.get("sales.home.total.connected", "总接通数"),
            dataIndex: 'calloutSuccess',
            key: 'callout_success',
            sorter: function (a, b) {
                return a.calloutSuccess - b.calloutSuccess;
            },
            className: 'has-filter table-data-align-right'
        }, {
            title: Intl.get("sales.home.average.duration", "日均时长"),
            dataIndex: 'averageTimeDescr',
            key: 'average_time',
            sorter: function (a, b) {
                return a.averageTime - b.averageTime;
            },
            className: 'has-filter table-data-align-right'
        }, {
            title: Intl.get("sales.home.average.connected", "日均接通数"),
            dataIndex: 'averageAnswer',
            key: 'average_answer',
            sorter: function (a, b) {
                return a.averageAnswer - b.averageAnswer;
            },
            className: 'has-filter table-data-align-right'
        }, {
            title: Intl.get("sales.home.phone.callin", "呼入次数"),
            dataIndex: 'callinCount',
            key: 'callin_count',
            sorter: function (a, b) {
                return a.callinCount - b.callinCount;
            },
            className: 'has-filter table-data-align-right'
        }, {
            title: Intl.get("sales.home.phone.callin.success", "成功呼入"),
            dataIndex: 'callinSuccess',
            key: 'callin_success',
            sorter: function (a, b) {
                return a.callinSuccess - b.callinSuccess;
            },
            className: 'has-filter table-data-align-right'
        }, {
            title: Intl.get("sales.home.phone.callin.rate", "呼入接通率"),
            dataIndex: 'callinRate',
            key: 'callin_rate',
            sorter: function (a, b) {
                return a.callinRate - b.callinRate;
            },
            className: 'has-filter table-data-align-right'
        }, {
            title: Intl.get("sales.home.phone.callout", "呼出次数"),
            dataIndex: 'calloutCount',
            key: 'callout_count',
            sorter: function (a, b) {
                return a.calloutCount - b.calloutCount;
            },
            className: 'has-filter table-data-align-right'
        }, {
            title: Intl.get("sales.home.phone.callout.rate", "呼出接通率"),
            dataIndex: 'calloutRate',
            key: 'callout_rate',
            sorter: function (a, b) {
                return a.calloutRate - b.calloutRate;
            },
            className: 'has-filter table-data-align-right'
        }];
        //当前展示的是客套类型的通话记录时，展示计费时长
        if (this.state.callType == CALL_TYPE_OPTION.APP) {
            columns.push({
                title: Intl.get("sales.home.phone.billing.time", "计费时长(分钟)"),
                dataIndex: 'billingTime',
                key: 'filling_time',
                width: '10%',
                sorter: function (a, b) {
                    return a.billingTime - b.billingTime;
                },
                className: 'has-filter table-data-align-right'
            });
        }
        return columns;
    },

    //获取分析图表展示区所需的布局参数
    getChartLayoutParams: function () {
        let chartWidth = 0;
        let chartListHeight = $(window).height() - $(".statistic-total-data").height() - layoutConstant.TOP - layoutConstant.BOTTOM;
        let windowWidth = $(window).width();
        let chartListContainerW = $(".statistic-data-analysis").width() - layoutConstant.CHART_PADDING;
        if (windowWidth >= Oplate.layout['screen-md']) {
            chartWidth = Math.floor(( chartListContainerW - layoutConstant.CHART_PADDING * 4) / 2);
        } else {
            chartWidth = Math.floor(chartListContainerW - layoutConstant.CHART_PADDING * 2);
        }
        return {chartWidth: chartWidth, chartListHeight: chartListHeight}
    },
    //通过销售名称获取对应的Id
    getSaleIdByName: function (name) {
        let teamMemberList = this.state.salesTeamMembersObj.data;
        if (_.isArray(teamMemberList) && teamMemberList.length) {
            let sales = _.find(teamMemberList, member=>member.nickName == name);
            return sales ? sales.userId : "";
        } else {
            return "";
        }
    },

    getChangeCallTypeData: function () {
        let queryParams = {
            start_time: this.state.start_time || 0,
            end_time: this.state.end_time || moment().toDate().getTime(),
            type: this.state.callType || CALL_TYPE_OPTION.ALL
        };
        if (this.state.currShowSalesman) {
            //查看当前选择销售的统计数据
            queryParams.member_id = this.state.currShowSalesman.userId;
        } else if (this.state.currShowSalesTeam) {
            //查看当前选择销售团队内所有成员的统计数据
            queryParams.team_id = this.state.currShowSalesTeam.group_id;
        }
        let type = this.getDataType();
        SalesHomeAction.getSalesPhoneList(queryParams, type);
    },

    // 选择通话类型的值
    selectCallTypeValue(value){
        if (value == CALL_TYPE_OPTION.PHONE) {
            this.state.callType = CALL_TYPE_OPTION.PHONE;
        } else if (value == CALL_TYPE_OPTION.APP) {
            this.state.callType = CALL_TYPE_OPTION.APP;
        } else if (value == CALL_TYPE_OPTION.ALL) {
            this.state.callType = CALL_TYPE_OPTION.ALL;
        }
        this.setState({
            callType: value
        });
        this.getChangeCallTypeData();
        //发送点击事件
        Trace.traceEvent("销售首页", "选择" + value + "类型");
    },

    // 通话类型的筛选框
    filterCallTypeSelect(){
        return (
            <div className="call-type-select">
                <Select
                    showSearch
                    value={this.state.callType}
                    onChange={this.selectCallTypeValue}
                >
                    <Option value={CALL_TYPE_OPTION.ALL}>
                        <span>{Intl.get("user.online.all.type", "全部类型")}</span>
                    </Option>
                    <Option value={CALL_TYPE_OPTION.PHONE}>
                        <span>{Intl.get("call.record.call.center", "呼叫中心")}</span>
                    </Option>
                    <Option value={CALL_TYPE_OPTION.APP}>
                        <span>{Intl.get("common.ketao.app", "客套APP")}</span>
                    </Option>
                </Select>
            </div>
        );
    },

    //渲染数据分析视图
    renderAnalysisView: function () {
        if (this.state.activeView == viewConstant.CUSTOMER) {
            return (<CustomerAnalysis ref="customerView" startTime={this.state.start_time} endTime={this.state.end_time}
                                      timeType={this.state.timeType}
                                      scrollbarEnabled={this.state.scrollbarEnabled}
                                      currShowSalesTeam={this.state.currShowSalesTeam}
                                      currShowSalesman={this.state.currShowSalesman}
                                      originSalesTeamTree={this.state.originSalesTeamTree}
                                      getSaleIdByName={this.getSaleIdByName}
                                      getChartLayoutParams={this.getChartLayoutParams}/>);
        } else if (this.state.activeView == viewConstant.USER) {
            return (<UserAnalysis ref="userView" startTime={this.state.start_time} endTime={this.state.end_time}
                                  timeType={this.state.timeType}
                                  scrollbarEnabled={this.state.scrollbarEnabled}
                                  currShowSalesTeam={this.state.currShowSalesTeam}
                                  currShowSalesman={this.state.currShowSalesman}
                                  originSalesTeamTree={this.state.originSalesTeamTree}
                                  getSaleIdByName={this.getSaleIdByName}
                                  getChartLayoutParams={this.getChartLayoutParams}/>);
        } else if (this.state.activeView == viewConstant.PHONE) {
            this.setPhoneListHeight();
            return (<div className="sales-table-container sales-phone-table" ref="phoneList">
                {this.filterCallTypeSelect()}
                <Table dataSource={this.state.salesPhoneList} columns={this.getPhoneListColumn()}
                       loading={this.state.isLoadingPhoneList}
                       pagination={false} bordered/>
            </div>);
        }
    },
    //时间的设置
    onSelectDate: function (startTime, endTime, timeType) {
        let timeObj = {startTime: startTime, endTime: endTime, timeType: timeType};
        SalesHomeAction.changeSearchTime(timeObj);
        setTimeout(()=> {
            //刷新统计数据
            this.refreshSalesListData();
            if (this.state.activeView == viewConstant.CUSTOMER) {
                //刷新客户分析数据
                this.refs.customerView.getChartData();
            } else if (this.state.activeView == viewConstant.USER) {
                //刷新用户分析数据
                this.refs.userView.getChartData();
            }
        });
    },
    //切换销售团队、销售时，刷新数据
    refreshDataByChangeSales: function () {
        //刷新统计数据
        this.refreshSalesListData();
        if (this.state.activeView == viewConstant.CUSTOMER) {
            //刷新客户分析数据
            this.refs.customerView.getChartData();
        } else if (this.state.activeView == viewConstant.USER) {
            //刷新用户分析数据
            this.refs.userView.getChartData();
        }
    },
    //获取右侧销售团队列表的高度
    getSalesListHeight: function () {
        let salesListHeight = "auto";
        if (this.state.scrollbarEnabled) {
            salesListHeight = $(window).height() - layoutConstant.TOP - layoutConstant.TITLE_HEIGHT - 2 * layoutConstant.BOTTOM;
        }
        return salesListHeight;
    },
    //渲染客户关系首页
    render: function () {

        return (<RightContent>
            <div className="sales_home_content" data-tracename="销售首页">

                <TopNav>
                    <div className="date-range-wrap">
                        <DatePicker
                            disableDateAfterToday={true}
                            range="week"
                            onSelect={this.onSelectDate}>
                            <DatePicker.Option value="all">{Intl.get("user.time.all", "全部时间")}</DatePicker.Option>
                            <DatePicker.Option value="day">{Intl.get("common.time.unit.day", "天")}</DatePicker.Option>
                            <DatePicker.Option value="week">{Intl.get("common.time.unit.week", "周")}</DatePicker.Option>
                            <DatePicker.Option
                                value="month">{Intl.get("common.time.unit.month", "月")}</DatePicker.Option>
                            <DatePicker.Option
                                value="quarter">{Intl.get("common.time.unit.quarter", "季度")}</DatePicker.Option>
                            <DatePicker.Option value="year">{Intl.get("common.time.unit.year", "年")}</DatePicker.Option>
                            <DatePicker.Option value="custom">{Intl.get("user.time.custom", "自定义")}</DatePicker.Option>
                        </DatePicker>
                    </div>
                    {
                        //<div className="crm-home-add-btn">
                        //    <span className="iconfont icon-add-btn"/>
                        //</div>
                    }
                </TopNav>
                <div className="crm-home-container">
                    <div className="crm-home-data-zone">
                        <StatisticTotal
                            customerTotalObj={this.state.customerTotalObj}
                            userTotalObj={this.state.userTotalObj}
                            phoneTotalObj={this.state.phoneTotalObj}
                            activeView={this.state.activeView}
                        />
                        <div className="statistic-data-analysis">
                            {this.renderAnalysisView()}
                        </div>
                    </div>
                    <CrmRightList currShowType={this.state.currShowType} salesTeamListObj={this.state.salesTeamListObj}
                                  originSalesTeamTree={this.state.originSalesTeamTree}
                                  scrollbarEnabled={this.state.scrollbarEnabled}
                                  currShowSalesTeam={this.state.currShowSalesTeam}
                                  currShowSalesman={this.state.currShowSalesman}
                                  getSalesListHeight={this.getSalesListHeight}
                                  refreshDataByChangeSales={this.refreshDataByChangeSales}
                                  salesTeamMembersObj={this.state.salesTeamMembersObj}
                                  expireUserLists={this.state.expireUserLists}
                                  isLoadingExpireUserList={this.state.isLoadingExpireUserList}
                                  errMsg={this.state.errMsg}
                    />
                </div>
            </div>
        </RightContent>);
    }
});

module.exports = SalesHomePage;