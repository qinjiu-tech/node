/**
 * 客户分析
 * Created by wangliping on 2016/11/24.
 */
var GeminiScrollbar = require("../../../../components/react-gemini-scrollbar");
var hasPrivilege = require('../../../../components/privilege/checker').hasPrivilege;
var OplateCustomerAnalysisAction = require("../../../oplate_customer_analysis/public/action/oplate-customer-analysis.action");
var OplateCustomerAnalysisStore = require("../../../oplate_customer_analysis/public/store/oplate-customer-analysis.store");
var CompositeLine = require("../../../oplate_customer_analysis/public/views/composite-line");
var BarChart = require("../../../oplate_customer_analysis/public/views/bar");
var ReverseBarChart = require("../../../oplate_customer_analysis/public/views/reverse_bar");
var SingleLineChart = require("../../../oplate_customer_analysis/public/views/single_line");
var FunnelChart = require("../../../oplate_customer_analysis/public/views/funnel");
var emitter = require("../../../oplate_customer_analysis/public/utils/emitter");
let userData = require("../../../../public/sources/user-data");
var DATE_FORMAT = oplateConsts.DATE_FORMAT;
var legend = [{name: Intl.get("sales.home.new.add", "新增"), key: "total"}];
var constantUtil = require("../util/constant");
//这个时间是比动画执行时间稍长一点的时间，在动画执行完成后再渲染滚动条组件
var delayConstant = constantUtil.DELAY.TIMERANG;
//客户分析
var CustomerAnalysis = React.createClass({
    getStateData: function () {
        let stateData = OplateCustomerAnalysisStore.getState();
        return {
            ...stateData,
            timeType: this.props.timeType,
            startTime: this.props.startTime,
            endTime: this.props.endTime,
            originSalesTeamTree: this.props.originSalesTeamTree,
            updateScrollBar:false
        };
    },
    onStateChange: function () {
        this.setState(this.getStateData());
    },
    getInitialState: function () {
        let stateData = this.getStateData();
        return stateData;
    },
    componentWillReceiveProps: function (nextProps) {
        let timeObj = {
            timeType: nextProps.timeType,
            startTime: nextProps.startTime,
            endTime: nextProps.endTime,
            originSalesTeamTree: nextProps.originSalesTeamTree
        };
        this.setState(timeObj);
        if (nextProps.updateScrollBar){
            this.setState({
                updateScrollBar:true
            },()=>{
                setTimeout(()=>{
                  this.setState({
                      updateScrollBar:false
                  })
                },delayConstant)
            })
        }
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
    getChartData: function () {
        const queryParams = {
            starttime: this.state.startTime,
            endtime: this.state.endTime,
            urltype: 'v2',
            dataType: this.getDataType()
        };
        //客户属性，对应各具体统计图，如行业、地域等
        let customerPropertys = ["zone", "industry", "stage"];
        if (this.props.currShowSalesman) {
            //查看当前选择销售的统计数据
            queryParams.member_id = this.props.currShowSalesman.userId;
        } else if (this.props.currShowSalesTeam) {
            //查看当前选择销售团队内所有下级团队/成员的统计数据
            queryParams.team_id = this.props.currShowSalesTeam.group_id;
            //团队统计
            customerPropertys.push("team");
        } else if (!userData.hasRole(userData.ROLE_CONSTANS.SALES)) {//普通销售不展示团队信息
            //首次进来时，如果不是销售就获取下级团队/团队成员的统计数据
            customerPropertys.push("team");
        }
        //选择天时，不展示趋势图
        if (this.state.timeType != "day") {
            customerPropertys.unshift("trend");
        }
        //获取各统计图数据
        customerPropertys.forEach(customerProperty => {
            let customerType = 'added';
            //销售阶段展示总数
            if (customerProperty == "stage") {
                customerType = "total";
            }
            const reqData = _.extend({}, queryParams, {
                customerType: customerType,
                customerProperty: customerProperty
            });
            setTimeout(()=>{
                OplateCustomerAnalysisAction.getAnalysisData(reqData);
            })
        });
    },
    //缩放延时，避免页面卡顿
    resizeTimeout: null,
    //窗口缩放时候的处理函数
    windowResize: function () {
        clearTimeout(this.resizeTimeout);
        //窗口缩放的时候，调用setState，重新走render逻辑渲染
        this.resizeTimeout = setTimeout(() => this.setState(this.getStateData()), 300);
    },
    componentDidMount: function () {
        OplateCustomerAnalysisStore.listen(this.onStateChange);
        OplateCustomerAnalysisAction.getSalesStageList();
        this.getChartData();
        //绑定window的resize，进行缩放处理
        $(window).on('resize', this.windowResize);
        $(".statistic-data-analysis .thumb").hide();
    },
    componentWillUnmount: function () {
        OplateCustomerAnalysisStore.unlisten(this.onStateChange);
        //$('body').css('overflow', 'visible');
        //组件销毁时，清除缩放的延时
        clearTimeout(this.resizeTimeout);
        //解除window上绑定的resize函数
        $(window).off('resize', this.windowResize);
    },
    //趋势统计
    getCustomerChart: function () {
        if (this.state.isComposite) {
            //所有应用的新增趋势统计
            var list = _.isArray(this.state.trendAnalysis.data) ?
                this.state.trendAnalysis.data : [];
            return (
                <CompositeLine
                    width={this.chartWidth}
                    list={list}
                    title={Intl.get("customer.analysis.add.customer", "新增客户")}
                    height={214}
                    resultType={this.state.trendAnalysis.resultType}
                />
            );
        } else {
            //某个应用下的新增趋势统计
            return (
                <SingleLineChart
                    width={this.chartWidth}
                    list={this.state.trendAnalysis.data}
                    title={Intl.get("customer.analysis.add.customer", "新增客户")}
                    legend={[{
                        name: Intl.get("user.analysis.formal", "正式"),
                        key: "formal"
                    }, {name: Intl.get("common.trial", "试用"), key: "trial"}]}
                    resultType={this.state.trendAnalysis.resultType}
                />
            );
        }
    },
    getStartDateText: function () {
        if (this.state.startTime) {
            return moment(new Date(+this.state.startTime)).format(DATE_FORMAT);
        } else {
            return "";
        }
    },
    //获取结束日期文字
    getEndDateText: function () {
        if (!this.state.endTime) {
            return moment().format(DATE_FORMAT);
        }
        return moment(new Date(+this.state.endTime)).format(DATE_FORMAT);
    },
    //地域统计
    getZoneChart: function () {
        var startDate = this.getStartDateText();
        var endDate = this.getEndDateText();
        return (
            <BarChart
                width={this.chartWidth}
                list={this.state.zoneAnalysis.data}
                title={Intl.get("user.analysis.address", "地域统计")}
                legend={legend}
                startDate={startDate}
                endDate={endDate}
                showLabel={true}
                resultType={this.state.zoneAnalysis.resultType}
            />
        );
    },
    //获取通过点击统计图中的柱子跳转到用户列表时需传的参数
    getJumpProps: function () {
        let analysis_filter_field = "sales_id", currShowSalesTeam = this.props.currShowSalesTeam;
        //当前展示的是下级团队还是团队内所有成员
        if (currShowSalesTeam) {
            if (_.isArray(currShowSalesTeam.child_groups) && currShowSalesTeam.child_groups.length) {
                //查看当前选择销售团队内所有下级团队新增用户的统计数据
                analysis_filter_field = "team_ids";
            }
        } else if (!userData.hasRole(userData.ROLE_CONSTANS.SALES)) {
            let originSalesTeamTree = this.state.originSalesTeamTree;
            if (_.isArray(originSalesTeamTree.child_groups) && originSalesTeamTree.child_groups.length) {
                //首次进来时，如果不是销售就获取下级团队新增用户的统计数据
                analysis_filter_field = "team_ids";
            }
        }
        return {
            url: "/crm",
            query: {
                app_id: "",
                analysis_filter_field: analysis_filter_field
            }
        };
    },
    //团队统计
    getTeamChart: function () {
        var startDate = this.getStartDateText();
        var endDate = this.getEndDateText();
        let list = this.state.teamAnalysis.data;
        let resultType = this.state.teamAnalysis.resultType;
        //getJumpProps={this.getJumpProps}
        //getSaleIdByName={this.props.getSaleIdByName}
        return (
            <BarChart
                width={this.chartWidth}
                list={list}
                title={Intl.get("user.analysis.team", "团队统计")}
                legend={legend}
                startDate={startDate}
                endDate={endDate}
                showLabel={true}
                resultType={resultType}
            />
        );
    },
    //活跃客户数的统计
    getActiveCustomerChart: function () {
        var startDate = this.getStartDateText();
        var endDate = this.getEndDateText();
        var legend = [{name: Intl.get("sales.home.new.add", "新增"), key: "count"}];
        return (
            <BarChart
                width={this.chartWidth}
                list={this.state.activeCustomerAnalysis.data}
                title={Intl.get("user.analysis.active.customer", "活跃客户")}
                legend={legend}
                startDate={startDate}
                endDate={endDate}
                getJumpProps={this.getJumpProps}
                getSaleIdByName={this.props.getSaleIdByName}
                showLabel={true}
                resultType={this.state.activeCustomerAnalysis.resultType}
            />
        );
    },

    getIndustryChart: function () {
        var startDate = this.getStartDateText();
        var endDate = this.getEndDateText();
        return (
            <ReverseBarChart
                list={this.state.industryAnalysis.data}
                title={Intl.get("user.analysis.industry", "行业统计")}
                width={this.chartWidth}
                height={214}
                startDate={startDate}
                endDate={endDate}
                legend={legend}
                showLabel={true}
                resultType={this.state.industryAnalysis.resultType}
            />
        );
    },
    getStageChart: function () {
        let stageData = this.state.stageAnalysis.data;
        _.map(stageData, stage => stage.value = stage.total);

        //获取销售阶段列表
        const stageList = this.state.salesStageList;
        if (stageList.length) {
            let sortedStageData = [];

            //将统计数据按销售阶段列表顺序排序
            _.each(stageList, stage => {
                const stageDataItem = _.find(stageData, item => item.name === stage.name);
                if (stageDataItem) {
                    const prevItem = sortedStageData[0];
                    if (!prevItem) {
                        sortedStageData.unshift(stageDataItem);
                        return;
                    }

                    if (stageDataItem.value) {
                        //如果下一阶段的值比上一阶段的值大，则将下一阶段的值变得比上一阶段的值小，以便能正确排序
                        if (prevItem.value <= stageDataItem.value) {
                            stageDataItem.value = prevItem.value * 0.8;
                        } else if (prevItem.value / stageDataItem.value > 10 && sortedStageData.length === 1) {
                            //第一阶段的值比第二阶段的值大很多的时候，把第一阶段的值变小一些，以防漏斗图边角过尖
                            sortedStageData[0].value = stageDataItem.value * 1.5;
                        }
                    }

                    sortedStageData.unshift(stageDataItem);
                }
            });

            //将维护阶段的统计数据加到排序后的数组的开头
            let maintainStage = _.find(stageData, stage => stage.name === Intl.get("customer.analysis.maintain", "维护阶段"));
            if (maintainStage) sortedStageData.unshift(maintainStage);

            //将原统计数据替换为排序后数据
            stageData = sortedStageData;
        }
        const max = _.max(_.pluck(stageData, "value"));

        return (
            <FunnelChart
                list={stageData}
                width={this.chartWidth}
                height={260}
                max={max}
                minSize="5%"
                resultType={this.state.stageAnalysis.resultType}
            />
        );
    },
    changeCurrentTab: function (tabName, event) {
        OplateCustomerAnalysisAction.changeCurrentTab(tabName);
        this.getChartData();
    },
    renderChartContent:function(){
      //销售不展示团队的数据统计
      let hideTeamChart = userData.hasRole(userData.ROLE_CONSTANS.SALES) || this.props.currShowSalesman;
      return (
          <div className="chart_list">
              {this.state.timeType != "day" ? (
                  <div className="analysis_chart col-md-6 col-sm-12"
                       data-title={Intl.get("customer.analysis.add.trend", "新增趋势")}>
                      <div className="chart-holder" ref="chartWidthDom" data-tracename="新增趋势统计">
                          <div className="title"><ReactIntl.FormattedMessage
                              id="customer.analysis.add.trend" defaultMessage="新增趋势"/></div>
                          {this.getCustomerChart()}
                      </div>
                  </div>) : null}
              <div className="analysis_chart col-md-6 col-sm-12"
                   data-title={Intl.get("oplate_customer_analysis.11", "销售阶段统计")}>
                  <div className="chart-holder" data-tracename="销售阶段统计">
                      <div className="title"><ReactIntl.FormattedMessage id="oplate_customer_analysis.11"
                                                                         defaultMessage="销售阶段统计"/></div>
                      {this.getStageChart()}
                  </div>
              </div>
              <div className="analysis_chart col-md-6 col-sm-12"
                   data-title={Intl.get("user.analysis.location.add", "地域-新增")}>
                  <div className="chart-holder">
                      <div className="title"><ReactIntl.FormattedMessage id="user.analysis.location.add"
                                                                         defaultMessage="地域-新增"/></div>
                      {this.getZoneChart()}
                  </div>
              </div>
              <div className="analysis_chart col-md-6 col-sm-12"
                   data-title={Intl.get("user.analysis.industry.add", "行业-新增")}>
                  <div className="chart-holder" data-tracename="行业-新增统计">
                      <div className="title"><ReactIntl.FormattedMessage id="user.analysis.industry.add"
                                                                         defaultMessage="行业-新增"/></div>
                      {this.getIndustryChart()}
                  </div>
              </div>
              {hideTeamChart ? null : (
                  <div className="analysis_chart col-md-6 col-sm-12"
                       data-title={Intl.get("user.analysis.team.add", "团队-新增")}>
                      <div className="chart-holder" data-tracename="团队-新增统计">
                          <div className="title"><ReactIntl.FormattedMessage id="user.analysis.team.add"
                                                                             defaultMessage="团队-新增"/>
                          </div>
                          {this.getTeamChart()}
                      </div>
                  </div>
              )}
              {
                  //hideTeamChart ? null : (
                  //<div className="analysis_chart col-md-6 col-sm-12"
                  //     data-title={Intl.get("user.analysis.active.customer","活跃客户")+"-"+Intl.get("sales.home.new.add", "新增")}>
                  //    <div className="chart-holder">
                  //        <div
                  //            className="title">{Intl.get("user.analysis.active.customer", "活跃客户") + "-" + Intl.get("sales.home.new.add", "新增")}</div>
                  //        {this.getActiveCustomerChart()}
                  //    </div>
                  //</div>)
              }
          </div>
      )
    },
    renderContent:function () {

        if(this.state.updateScrollBar){
            return (
                <div>
                    {this.renderChartContent()}
                </div>
            )
        }else{
            return (
                <GeminiScrollbar enabled={this.props.scrollbarEnabled} ref="scrollbar">
                    {this.renderChartContent()}
                </GeminiScrollbar>
            )
        }
    },
    render: function () {
        let layoutParams = this.props.getChartLayoutParams();
        this.chartWidth = layoutParams.chartWidth;
        //销售不展示团队的数据统计
        let hideTeamChart = userData.hasRole(userData.ROLE_CONSTANS.SALES) || this.props.currShowSalesman;
        return (
            <div className="oplate_customer_analysis">
                <div ref="chart_list" style={{height: layoutParams.chartListHeight}}>
                    {this.renderContent()}
                </div>
            </div>
        );
    }
});
//返回react对象
module.exports = CustomerAnalysis;
