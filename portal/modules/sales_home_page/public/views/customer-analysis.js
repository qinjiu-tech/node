/**
 * 客户分析
 * Created by wangliping on 2016/11/24.
 */
import { AntcAnalysis } from 'antc';
let history = require('PUB_DIR/sources/history');
var GeminiScrollbar = require('../../../../components/react-gemini-scrollbar');
var hasPrivilege = require('../../../../components/privilege/checker').hasPrivilege;
var getDataAuthType = require('../../../../components/privilege/checker').getDataAuthType;
var OplateCustomerAnalysisAction = require('../../../oplate_customer_analysis/public/action/oplate-customer-analysis.action');
var OplateCustomerAnalysisStore = require('../../../oplate_customer_analysis/public/store/oplate-customer-analysis.store');
var FunnelChart = require('../../../oplate_customer_analysis/public/views/funnel');
var emitter = require('../../../oplate_customer_analysis/public/utils/emitter');
let userData = require('../../../../public/sources/user-data');
var DATE_FORMAT = oplateConsts.DATE_FORMAT;
var legend = [{ name: Intl.get('sales.home.new.add', '新增'), key: 'total' }];
var constantUtil = require('../util/constant');
//这个时间是比动画执行时间稍长一点的时间，在动画执行完成后再渲染滚动条组件
var delayConstant = constantUtil.DELAY.TIMERANG;
import Analysis from 'CMP_DIR/analysis';
import { processCustomerStageData, processOrderStageData } from 'PUB_DIR/sources/utils/analysis-util';
import { AntcHorizontalStageChart, AntcTable } from 'antc';
import { Button, Spin, Alert } from 'antd';
const Spinner = require('CMP_DIR/spinner');
var NoMoreDataTip = require('CMP_DIR/no_more_data_tip');
import CustomerStageTable from './customer-stage-table';
const DEFAULT_TABLE_PAGESIZE = 10;
const Emitters = require('PUB_DIR/sources/utils/emitters');
const teamTreeEmitter = Emitters.teamTreeEmitter;
const phoneMsgEmitter = Emitters.phoneMsgEmitter;
import rightPanelUtil from 'CMP_DIR/rightPanel';
const RightPanel = rightPanelUtil.RightPanel;
const RightPanelClose = rightPanelUtil.RightPanelClose;
const CrmList = require('MOD_DIR/crm/public/crm-list');
var AppUserManage = require('MOD_DIR/app_user_manage/public');
var CrmAction = require('MOD_DIR/crm/public/action/crm-actions');
const showTypeConstant = constantUtil.SHOW_TYPE_CONSTANT;

//客户分析
var CustomerAnalysis = React.createClass({
    getStateData: function() {
        let stateData = OplateCustomerAnalysisStore.getState();
        return {
            ...stateData,
            timeType: this.props.timeType,
            startTime: this.props.startTime,
            endTime: this.props.endTime,
            originSalesTeamTree: this.props.originSalesTeamTree,
            updateScrollBar: false
        };
    },
    onStateChange: function() {
        this.setState(this.getStateData());
    },
    getInitialState: function() {
        let stateData = this.getStateData();
        return stateData;
    },
    componentWillMount() {
        teamTreeEmitter.on(teamTreeEmitter.SELECT_TEAM, this.onTeamChange);
        teamTreeEmitter.on(teamTreeEmitter.SELECT_MEMBER, this.onMemberChange);
    },    
    componentWillReceiveProps: function(nextProps) {
        let timeObj = {
            timeType: nextProps.timeType,
            startTime: nextProps.startTime,
            endTime: nextProps.endTime,
            originSalesTeamTree: nextProps.originSalesTeamTree
        };
        const timeChanged = (this.props.startTime !== nextProps.startTime) || (this.props.endTime !== nextProps.endTime);
        this.setState(timeObj, () => {
            if (timeChanged) {
                setTimeout(() => {
                    this.getTransferCustomers({ isFirst: true });
                    this.getStageChangeCustomers();
                });
            }
        });
        if (nextProps.updateScrollBar) {
            this.setState({
                updateScrollBar: true
            }, () => {
                setTimeout(() => {
                    this.setState({
                        updateScrollBar: false
                    });
                }, delayConstant);
            });
        }
    },
    onTeamChange(team_id, allSubTeamIds) {
        let teamId = team_id;
        if (allSubTeamIds && allSubTeamIds.length > 0) {
            teamId = allSubTeamIds.join(',');
        }        
        OplateCustomerAnalysisAction.teamChange(teamId);
    },
    onMemberChange(member_id) {
        OplateCustomerAnalysisAction.memberChange(member_id);
    },
    getDataType: function() {
        if (hasPrivilege('GET_TEAM_LIST_ALL')) {
            return 'all';
        } else if (hasPrivilege('GET_TEAM_LIST_MYTEAM_WITH_SUBTEAMS')) {
            return 'self';
        } else {
            return '';
        }
    },
    getStageChangeCustomerList: function(data) {
        const { isFirst } = data;
        const paramObj = {
            params: {
                sort_field: this.state.stageChangedCustomerList.sorter.field,
                order: this.state.stageChangedCustomerList.sorter.order,
                page_size: DEFAULT_TABLE_PAGESIZE,
            },
            ...data
        };
        const lastId = this.state.stageChangedCustomerList.lastId;
        if (lastId && !isFirst) {
            paramObj.queryObj = {
                id: lastId
            };
        }
        if (isFirst) {
            this.state.stageChangedCustomerList.lastId = '';
            this.state.stageChangedCustomerList.listenScrollBottom = true;
            this.setState({ stageChangedCustomerList: this.state.stageChangedCustomerList }, () => {
                OplateCustomerAnalysisAction.getStageChangeCustomerList(paramObj);
            });
        } else {
            OplateCustomerAnalysisAction.getStageChangeCustomerList(paramObj);
        }
    },
    //获取不同阶段客户数
    getCustomerStageAnalysis: function(params) {
        let teamId = this.state.currentTeamId;
        if (teamId && teamId.includes(',')) {
            teamId = teamId.split(',')[0];//此接口需要的teamid为最上级的团队id
        }
        let paramsObj = {
            ...params,
            starttime: this.state.startTime,
            endtime: this.state.endTime,
            app_id: 'all',
            team_id: teamId
        };
        OplateCustomerAnalysisAction.getCustomerStageAnalysis(paramsObj);
    },
    //获取客户阶段变更数据
    getStageChangeCustomers: function() {
        let params = {
            rang_params: [
                {
                    'from': this.state.startTime,
                    'to': this.state.endTime,
                    'name': 'time',
                    'type': 'time'
                }
            ],
        };
        OplateCustomerAnalysisAction.getStageChangeCustomers(params);
    },
    getChartData: function() {
        const queryParams = {
            starttime: this.state.startTime,
            endtime: this.state.endTime,
            urltype: 'v2',
            dataType: this.getDataType()
        };
        //客户属性，对应各具体统计图，如行业、地域等
        let customerPropertys = ['zone', 'industry'];
        if (this.props.currShowSalesman) {
            //查看当前选择销售的统计数据
            queryParams.member_id = this.props.currShowSalesman.userId;
        } else if (this.props.currShowSalesTeam) {
            //查看当前选择销售团队内所有下级团队/成员的统计数据
            queryParams.team_id = this.props.currShowSalesTeam.group_id;
            //团队统计
            customerPropertys.push('team');
        } else if (!userData.hasRole(userData.ROLE_CONSTANS.SALES)) {//普通销售不展示团队信息
            //首次进来时，如果不是销售就获取下级团队/团队成员的统计数据
            customerPropertys.push('team');
        }
        //获取各统计图数据
        customerPropertys.forEach(customerProperty => {
            let customerType = 'added';
            const reqData = _.extend({}, queryParams, {
                customerType: customerType,
                customerProperty: customerProperty
            });
            setTimeout(() => {
                OplateCustomerAnalysisAction.getAnalysisData(reqData);
            });
        });
    },
    //缩放延时，避免页面卡顿
    resizeTimeout: null,
    //窗口缩放时候的处理函数
    windowResize: function() {
        clearTimeout(this.resizeTimeout);
        //窗口缩放的时候，调用setState，重新走render逻辑渲染
        this.resizeTimeout = setTimeout(() => this.setState(this.getStateData()), 300);
    },
    componentDidMount: function() {
        OplateCustomerAnalysisStore.listen(this.onStateChange);
        OplateCustomerAnalysisAction.getSalesStageList();
        this.getChartData();
        setTimeout(() => {
            this.getStageChangeCustomers();
            this.getTransferCustomers({ isFirst: true });
            this.getCustomerStageAnalysis();
        });

        //绑定window的resize，进行缩放处理
        $(window).on('resize', this.windowResize);
        $('.statistic-data-analysis .thumb').hide();
    },
    //切换展示客户阶段统计
    toggleCusStageMetic: function() {
        OplateCustomerAnalysisAction.toggleStageCustomerList();
    },
    componentWillUnmount: function() {
        OplateCustomerAnalysisStore.unlisten(this.onStateChange);
        //$('body').css('overflow', 'visible');
        //组件销毁时，清除缩放的延时
        clearTimeout(this.resizeTimeout);
        //解除window上绑定的resize函数
        $(window).off('resize', this.windowResize);
        teamTreeEmitter.removeListener(teamTreeEmitter.SELECT_TEAM, this.onTeamChange);
        teamTreeEmitter.removeListener(teamTreeEmitter.SELECT_MEMBER, this.onMemberChange);
    },
    /**
     * 参数说明，ant-design的table组件
     * @param pagination   分页参数，当前不需要使用分页
     * @param filters      过滤器参数，当前不需要使用过滤器
     * @param sorter       排序参数，当前需要使用sorter
     *                      {field : 'xxx' //排序字段 , order : 'descend'/'ascend' //排序顺序}
     */
    onTransferSortChange(pagination, filters, sorter) {
        this.state.transferCustomers.sorter = sorter;
        this.state.transferCustomers.lastId = '';
        this.setState({
            transferCustomers: this.state.transferCustomers
        }, () => {
            this.getTransferCustomers({ isFirst: true });
        });

    },
    //获取转出客户统计数据
    getTransferCustomers: function({ isFirst = false }) {
        let params = {
            isFirst,
            sort_field: this.state.transferCustomers.sorter.field,
            order: this.state.transferCustomers.sorter.order,
            page_size: DEFAULT_TABLE_PAGESIZE,
            query: {},
            rang_params: [
                {
                    'from': this.state.startTime,
                    'to': this.state.endTime,
                    'name': 'time',
                    'type': 'time'
                }
            ],
        };
        const lastId = this.state.transferCustomers.lastId;
        if (lastId && !isFirst) {
            params.query.id = lastId;
        }
        if (isFirst) {
            this.state.transferCustomers.lastId = '';
            this.state.transferCustomers.listenScrollBottom = true;
            this.setState({ transferCustomers: this.state.transferCustomers }, () => {
                OplateCustomerAnalysisAction.getTransferCustomers(params);
            });
        } else {
            OplateCustomerAnalysisAction.getTransferCustomers(params);
        }
    },
    getStartDateText: function() {
        if (this.state.startTime) {
            return moment(new Date(+this.state.startTime)).format(DATE_FORMAT);
        } else {
            return '';
        }
    },
    //获取结束日期文字
    getEndDateText: function() {
        if (!this.state.endTime) {
            return moment().format(DATE_FORMAT);
        }
        return moment(new Date(+this.state.endTime)).format(DATE_FORMAT);
    },
    //获取通过点击统计图中的柱子跳转到用户列表时需传的参数
    getJumpProps: function() {
        let analysis_filter_field = 'sales_id', currShowSalesTeam = this.props.currShowSalesTeam;
        //当前展示的是下级团队还是团队内所有成员
        if (currShowSalesTeam) {
            if (_.isArray(currShowSalesTeam.child_groups) && currShowSalesTeam.child_groups.length) {
                //查看当前选择销售团队内所有下级团队新增用户的统计数据
                analysis_filter_field = 'team_ids';
            }
        } else if (!userData.hasRole(userData.ROLE_CONSTANS.SALES)) {
            let originSalesTeamTree = this.state.originSalesTeamTree;
            if (_.isArray(originSalesTeamTree.child_groups) && originSalesTeamTree.child_groups.length) {
                //首次进来时，如果不是销售就获取下级团队新增用户的统计数据
                analysis_filter_field = 'team_ids';
            }
        }
        return {
            url: '/crm',
            query: {
                app_id: '',
                analysis_filter_field: analysis_filter_field
            }
        };
    },

    processOrderStageData: function(data) {
        return processOrderStageData(this.state.salesStageList, data);
    },
    //处理阶段点击的回调 
    handleStageNumClick: function(item, type) {
        this.setState({
            selectedCustomerStage: {
                type,
                time: item.time,
                nickname: item.memberName
            }
        });
        this.getStageChangeCustomerList({
            isFirst: true,
            query: {
                label: type,
                nickname: item.memberName
            },
            rang_params: [{
                'from': moment(item.time).startOf('day').valueOf(),
                'to': moment(item.time).endOf('day').valueOf(),
                'name': 'time',
                'type': 'time'
            }]
        });
        this.toggleCusStageMetic();
    },
    onStageSortChange(pagination, filters, sorter) {
        this.getStageChangeCustomers(sorter.order);
    },
    changeCurrentTab: function(tabName, event) {
        OplateCustomerAnalysisAction.changeCurrentTab(tabName);
        this.getChartData();
    },
    //客户详情面板相关方法
    ShowCustomerUserListPanel: function(data) {
        this.setState({
            isShowCustomerUserListPanel: true,
            CustomerInfoOfCurrUser: data.customerObj
        });
    },
    closeCustomerUserListPanel: function() {
        this.setState({
            isShowCustomerUserListPanel: false
        });
    },
    hideRightPanel: function() {
        this.setState({
            showRightPanel: false
        });
    },
    //数字转百分比
    numToPercent(num) {
        return (num * 100).toFixed(2) + '%';
    },
    //处理转出客户点击
    handleTransferedCustomerClick: function(item, index) {
        this.setState({
            showRightPanel: true,
            selectedCustomerId: item.customer_id,
            selectedCustomerIndex: index
        });
        //触发打开带拨打电话状态的客户详情面板
        phoneMsgEmitter.emit(phoneMsgEmitter.OPEN_PHONE_PANEL, {
            customer_params: {
                currentId: item.customer_id,
                ShowCustomerUserListPanel: this.ShowCustomerUserListPanel,
                hideRightPanel: this.hideRightPanel
            }
        });
    },
    //处理试用合格客户数统计数字点击事件
    handleTrialQualifiedNumClick(customerIds) {
        history.pushState({
            from: 'sales_home',
            trialQualifiedCustomerIds: customerIds
        }, '/crm', {});
    },
    //试用合格客户数统计数字渲染函数
    trialQualifiedNumRender(customerIdsField, text, record) {
        const customerIds = record[customerIdsField];

        if (customerIds) {
            return (
                <span onClick={this.handleTrialQualifiedNumClick.bind(this, customerIds)} style={{cursor: 'pointer'}}>
                    {text}
                </span>
            );
        } else {
            return (
                <span>
                    {text}
                </span>
            );
        }
    },
    //获取试用合格客户数统计图表
    getTrialQualifiedChart() {
        //统计列
        const statisticsColumns = [{
            dataIndex: 'last_month',
            title: '上月',
            width: '10%',
            render: this.trialQualifiedNumRender.bind(this, 'last_month_customer_ids'),
        }, {
            dataIndex: 'this_month',
            title: '本月',
            width: '10%',
            render: this.trialQualifiedNumRender.bind(this, 'this_month_customer_ids'),
        }, {
            dataIndex: 'this_month_new',
            title: '本月新增',
            width: '10%',
            render: this.trialQualifiedNumRender.bind(this, 'this_month_new_customer_ids'),
        }, {
            dataIndex: 'this_month_lose',
            title: '本月流失',
            width: '10%',
            render: this.trialQualifiedNumRender.bind(this, 'this_month_lose_customer_ids'),
        }, {
            dataIndex: 'this_month_back',
            title: '本月回流',
            width: '10%',
            render: this.trialQualifiedNumRender.bind(this, 'this_month_back_customer_ids'),
        }, {
            dataIndex: 'this_month_add',
            title: '本月比上月净增',
            width: '15%',
        }, {
            dataIndex: 'highest',
            title: '历史最高',
            width: '10%',
            render: (text, record) => {
                return <span title={record.highest_date}>{text}</span>;
            },
        }, {
            dataIndex: 'this_month_add_highest',
            title: '本月比历史最高净增',
            width: '20%',
        }];

        //表格列
        let columns = _.cloneDeep(statisticsColumns);
        columns.unshift({
            title: '团队',
            width: '10%',
            dataIndex: 'team_name',
        });

        let chart = {
            title: '试用合格客户数统计',
            url: '/rest/analysis/customer/v2/statistic/:data_type/customer/qualify',
            argCallback: (arg) => {
                let query = arg.query;

                if (query) {
                    if (query.starttime && query.endtime) {
                        query.start_time = query.starttime;
                        query.end_time = query.endtime;
                        delete query.starttime;
                        delete query.endtime;
                    }

                    if (query.member_id) {
                        query.member_ids = query.member_id;
                        delete query.member_id;
                    }
                }
            },
            layout: {sm: 24},
            processData: data => {
                data = data.list || [];
                _.each(data, dataItem => {
                    _.each(statisticsColumns, column => {
                        const key = column.dataIndex;
                        const customerIds = _.get(dataItem, [key, 'customer_ids']);

                        if (customerIds) {
                            dataItem[key + '_customer_ids'] = customerIds.join(',');
                        }

                        const highestDate = _.get(dataItem, [key, 'highest_date']);

                        if (highestDate) {
                            dataItem.highest_date = highestDate;
                        }

                        dataItem[key] = dataItem[key].total;
                    });
                });

                return data;
            },
        };

        if (this.props.currShowType === showTypeConstant.SALESMAN) {
            _.extend(chart, {
                chartType: 'bar',
                height: 220,
                processOption: (option, chartProps) => {
                    option.legend = {
                        data: [
                            '上月',
                            '本月',
                            '历史最高',
                        ],
                    };
                    _.set(option, 'xAxis[0].data', [
                        '上月',
                        '本月新增',
                        '本月回流',
                        '本月流失',
                        '本月比上月净增',
                        '本月',
                        '本月比历史最高净增',
                        '历史最高',
                    ]);

                    const serie = {
                        type: 'bar',
                        stack: 'num',
                        label: {
                            show: true,
                            position: 'top',
                        }
                    };

                    let data = _.get(chartProps, 'data[0]');
                    let lastMonthNum = _.get(data, 'last_month');
                    let thisMonthNum = _.get(data, 'this_month');
                    let thisMonthNewNum = _.get(data, 'this_month_new');
                    let thisMonthLoseNum = _.get(data, 'this_month_lose');
                    let thisMonthBackNum = _.get(data, 'this_month_back');
                    let thisMonthAddHighestNum = _.get(data, 'this_month_add_highest');
                    let thisMonthAddNum = _.get(data, 'this_month_add');
                    let highestNum = _.get(data, 'highest');

                    const dataArr = [lastMonthNum, thisMonthNewNum, thisMonthBackNum, thisMonthLoseNum, thisMonthAddNum, thisMonthNum, thisMonthAddHighestNum, highestNum];

                    let thisMonthNewNumAssist = lastMonthNum;

                    if (thisMonthNewNum < 0) {
                        thisMonthNewNumAssist = lastMonthNum + thisMonthNewNum;
                        thisMonthNewNum = Math.abs(thisMonthNewNum);
                    }

                    let thisMonthBackNumAssist = lastMonthNum + thisMonthNewNum;

                    let thisMonthLoseNumAssist = thisMonthLoseNumAssist - thisMonthBackNum;

                    let thisMonthAddNumAssist = lastMonthNum;

                    if (thisMonthAddNum < 0) {
                        thisMonthAddNumAssist = lastMonthNum + thisMonthAddNum;
                        thisMonthAddNum = Math.abs(thisMonthAddNum);
                    }

                    let thisMonthAddHighestNumAssist = highestNum;

                    if (thisMonthAddHighestNum < 0) {
                        thisMonthAddHighestNumAssist = highestNum + thisMonthAddHighestNum;
                        thisMonthAddHighestNum = Math.abs(thisMonthAddHighestNum);
                    }

                    let serieAssist = _.extend({}, serie, {

                        itemStyle: {
                            normal: {
                                barBorderColor: 'rgba(0,0,0,0)',
                                color: 'rgba(0,0,0,0)'
                            },
                            emphasis: {
                                barBorderColor: 'rgba(0,0,0,0)',
                                color: 'rgba(0,0,0,0)'
                            }
                        },
                        data: ['-', thisMonthNewNumAssist, thisMonthBackNumAssist, thisMonthLoseNumAssist, thisMonthAddNumAssist, '-', thisMonthAddHighestNumAssist, '-'],
                    });

                    let serieLastMonth = _.extend({}, serie, {
                        data: [lastMonthNum, '-', '-', '-', '-', '-', '-', '-'],
                    });

                    let serieThisMonth = _.extend({}, serie, {
                        data: ['-', thisMonthNewNum, thisMonthBackNum, thisMonthLoseNum, thisMonthAddNum, thisMonthNum, thisMonthAddHighestNum, '-'],
                        label: {
                            show: true,
                            position: 'top',
                            formatter: params => {
                                return dataArr[params.dataIndex];
                            },
                        },
                    });

                    let serieHistory = _.extend({}, serie, {
                        data: ['-', '-', '-', '-', '-', '-', '-', highestNum],
                    });

                    option.series = [
                        serieAssist,
                        serieLastMonth,
                        serieThisMonth,
                        serieHistory
                    ];
                },
            });
        } else {
            _.extend(chart, {
                chartType: 'table',
                height: 'auto',
                option: {
                    columns,
                },
                processOption: (option, chartProps) => {
                    //从返回数据里获取一下销售昵称
                    const nickName = _.get(chartProps, 'data[0].nick_name');

                    //若存在销售昵称，说明返回的是销售列表
                    if (nickName) {
                        //找到名称列
                        let nameColumn = _.find(option.columns, column => column.dataIndex === 'team_name');

                        if (nameColumn) {
                            //将名称列的数据索引改为指向昵称字段
                            nameColumn.dataIndex = 'nick_name';
                            //将名称列的标题改为销售
                            nameColumn.title = '销售';
                        }
                    }
                },
            });
        }

        return chart;
    },
    //获取图表列表
    getCharts: function() {
        //表格内容高度
        const TABLE_HIGHT = 175;

        //从 unknown 到 未知 的映射
        let unknownDataMap = {
            unknown: Intl.get('user.unknown', '未知') 
        };

        //销售不展示团队的数据统计
        const hideTeamChart = userData.hasRole(userData.ROLE_CONSTANS.SALES) || this.props.currShowSalesman;

        let charts = [{
            title: Intl.get('effective.customer.statistics', '有效客户统计'),
            url: '/rest/analysis/customer/v2/:data_type/customer/active_rate',
            argCallback: (arg) => {
                let query = arg.query;

                if (query && query.starttime && query.endtime) {
                    query.start_time = query.starttime;
                    query.end_time = query.endtime;
                    delete query.starttime;
                    delete query.endtime;
                }
            },
            conditions: [
                {
                    name: 'interval',
                    value: 'day',
                },
            ],
            chartType: 'table',
            dataField: 'list',
            option: {
                pagination: false,
                scroll: {y: 170},
                columns: [
                    {
                        title: Intl.get('common.definition', '名称'),
                        dataIndex: 'name',
                        width: 80,
                    },
                    {
                        title: Intl.get('effective.customer.number', '有效客户数'),
                        dataIndex: 'valid',
                    },
                    {
                        title: Intl.get('active.customer.number', '活跃客户数'),
                        dataIndex: 'active',
                    },
                    {
                        title: Intl.get('effective.customer.activity.rate', '有效客户活跃率'),
                        dataIndex: 'active_rate',
                        render: text => {
                            return <span>{this.numToPercent(text)}</span>;
                        }
                    },
                ],
            },
        }, {
            title: Intl.get('active.customer.trends.last.month', '近一月活跃客户趋势'),
            url: '/rest/analysis/customer/v2/:data_type/customer/active_rate',
            argCallback: (arg) => {
                let query = arg.query;

                if (query && query.starttime && query.endtime) {
                    query.start_time = moment().subtract(1, 'months').valueOf();
                    query.end_time = moment().valueOf();
                    delete query.starttime;
                    delete query.endtime;
                }
            },
            conditions: [
                {
                    name: 'interval',
                    value: 'day',
                },
            ],
            chartType: 'line',
            dataField: 'total',
            processData: data => {
                _.each(data, dataItem => {
                    if (dataItem.date_str) {
                        dataItem.name = dataItem.date_str.substr(5);
                        dataItem.value = dataItem.active;
                    }
                });

                return data;
            },
            option: {
                grid: {
                    right: 0,
                },
                tooltip: {
                    formatter: params => {
                        const dateStr = params[0].name;
                        const activeNum = params[0].value;
                        const activeRate = this.numToPercent(params[0].data.active_rate);
                        const effectiveNum = params[0].data.valid;

                        return `
                            ${dateStr}<br>
                            ${Intl.get('active.customer.number', '活跃客户数')}: ${activeNum}<br>
                            ${Intl.get('effective.customer.activity.rate', '有效客户活跃率')}: ${activeRate}<br>
                            ${Intl.get('effective.customer.number', '有效客户数')}: ${effectiveNum}
                        `;
                    },
                },
            },
        }, {
            title: Intl.get('customer.analysis.add.trend', '新增趋势'),
            url: (() => {
                let url = '/rest/analysis/customer/v2/:auth_type/added/trend';

                if (getDataAuthType().toLowerCase() === 'common') {
                    url = '/rest/analysis/customer/v2/added/trend';
                }

                return url;
            })(),
            chartType: 'line',
            dataField: '[0].data',
            noShowCondition: {
                callback: conditions => {
                    return this.state.timeType === 'day';
                },
            },
        }, {
            title: Intl.get('oplate_customer_analysis.customer.stage', '客户阶段统计'),
            url: '/rest/analysis/customer/stage/label/:auth_type/summary',
            argCallback: (arg) => {
                let query = arg.query;
                 
                if (query && query.starttime) {
                    query.starttime = 0;
                }
            },
            chartType: 'funnel',
            processData: processCustomerStageData,
            customOption: {
                valueField: 'showValue',
                minSize: '5%',
            },
        }, {
            title: Intl.get('oplate_customer_analysis.11', '订单阶段统计'),
            url: '/rest/analysis/customer/v2/:auth_type/total/stage',
            chartType: 'horizontalStage',
            processData: this.processOrderStageData,
        }, {
            title: Intl.get('user.analysis.location.add', '地域-新增'),
            chartType: 'bar',
            customOption: {
                showValue: true,
            },
            data: this.state.zoneAnalysis.data,
            nameValueMap: unknownDataMap,
            resultType: this.state.zoneAnalysis.resultType,
        }, {
            title: Intl.get('user.analysis.industry.add', '行业-新增'),
            chartType: 'bar',
            customOption: {
                reverse: true,
                showValue: true,
            },
            data: this.state.industryAnalysis.data,
            nameValueMap: unknownDataMap,
            resultType: this.state.industryAnalysis.resultType,
        }, {
            title: Intl.get('user.analysis.team.add', '团队-新增'),
            chartType: 'bar',
            customOption: {
                showValue: true,
            },
            noShowCondition: {
                callback: () => hideTeamChart,
            },
            data: this.state.teamAnalysis.data,
            nameValueMap: unknownDataMap,
            resultType: this.state.teamAnalysis.resultType,
        }, {
            title: Intl.get('crm.sales.newTrailCustomer', '新开客户数统计'),
            chartType: 'table',
            data: this.state.stageCustomerNum.data,
            resultType: this.state.stageCustomerNum.loading ? 'loading' : '',
            option: {
                pagination: false,
                scroll: {y: TABLE_HIGHT},
                columns: [
                    {
                        title: Intl.get('common.trial', '试用'),
                        dataIndex: 'trial',
                        key: 'trial',
                        render: (text, item, index) => {
                            return (
                                <span className="customer-stage-number"
                                    onClick={this.handleNewAddedCustomerNumClick.bind(this, text, '试用')}>{text}</span>
                            );
                        }
                    }, {
                        title: Intl.get('sales.stage.signed', '签约'),
                        dataIndex: 'signed',
                        key: 'signed',
                        render: (text, item, index) => {
                            return (
                                <span className="customer-stage-number"
                                    onClick={this.handleNewAddedCustomerNumClick.bind(this, text, '签约')}>{text}</span>
                            );
                        }
                    }
                ],
            },
        }, {
            title: Intl.get('user.analysis.moveoutCustomer', '转出客户统计'),
            chartType: 'table',
            layout: {
                sm: 24,
            },
            data: this.state.transferCustomers.data,
            resultType: this.state.transferCustomers.loading ? 'loading' : '',
            option: {
                pagination: false,
                scroll: {y: TABLE_HIGHT},
                columns: [
                    {
                        title: Intl.get('common.login.time', '时间'),
                        dataIndex: 'time',
                        key: 'time',
                        sorter: true,
                        width: 100,
                    }, {
                        title: Intl.get('crm.41', '客户名'),
                        dataIndex: 'customer_name',
                        key: 'customer_name',
                        className: 'customer-name',
                        sorter: true,
                        width: 300,
                        render: (text, item, index) => {
                            return (
                                <span className="transfer-customer-cell"
                                    onClick={this.handleTransferedCustomerClick.bind(this, item, index)}>{text}</span>
                            );
                        }
                    }, {
                        title: Intl.get('crm.customer.transfer.sales', '销售代表'),
                        dataIndex: 'old_member_nick_name',
                        key: 'old_member_nick_name',
                        sorter: true,
                        width: 100,
                    }, {
                        title: Intl.get('crm.customer.transfer.manager', '客户经理'),
                        dataIndex: 'new_member_nick_name',
                        key: 'new_member_nick_name',
                        sorter: true,
                        width: 100,
                    }, {
                        title: Intl.get('user.sales.team', '销售团队'),
                        dataIndex: 'sales_team',
                        key: 'sales_team',
                        width: 100,
                    }

                ],
            },
        }, {
            title: Intl.get('crm.sales.customerStage', '客户阶段变更统计'),
            chartType: 'table',
            layout: {
                sm: 24,
            },
            data: this.state.customerStage.data,
            processData: data => {
                _.each(data, dataItem => {
                    _.each(dataItem.map, (v, k) => {
                        //数字前显示加号
                        if (v && v > 0) {
                            v = '+' + v;
                        }

                        //将各阶段数据直接放到数据对象下，方便表格渲染时使用
                        dataItem[k] = v;
                    });
                });

                return data;
            },
            resultType: this.state.customerStage.loading ? 'loading' : '',
            option: {
                pagination: false,
                scroll: {y: TABLE_HIGHT},
                columns: [
                    {
                        title: Intl.get('crm.146', '日期'),
                        dataIndex: 'time',
                        key: 'time',
                        width: 100
                    }, {
                        title: Intl.get('sales.stage.message', '信息'),
                        dataIndex: '信息',
                        key: 'info',
                        render: (text, item, index) => {
                            return (
                                <span className="customer-stage-number"
                                    onClick={this.handleStageNumClick.bind(this, item, '信息')}>{text}</span>
                            );
                        }
                    }, {
                        title: Intl.get('sales.stage.intention', '意向'),
                        dataIndex: '意向',
                        key: 'intention',
                        render: (text, item, index) => {
                            return (
                                <span className="customer-stage-number"
                                    onClick={this.handleStageNumClick.bind(this, item, '意向')}>{text}</span>
                            );
                        }
                    }, {
                        title: Intl.get('common.trial', '试用'),
                        dataIndex: '试用',
                        key: 'trial',
                        render: (text, item, index) => {
                            return (
                                <span className="customer-stage-number"
                                    onClick={this.handleStageNumClick.bind(this, item, '试用')}>{text}</span>
                            );
                        }
                    }, {
                        title: Intl.get('common.trial.qualified', '试用合格'),
                        dataIndex: '试用合格',
                        key: 'trial.qualified',
                        render: (text, item, index) => {
                            return (
                                <span className="customer-stage-number"
                                    onClick={this.handleStageNumClick.bind(this, item, '试用合格')}>{text}</span>
                            );
                        }
                    }, {
                        title: Intl.get('common.trial.unqualified', '试用不合格'),
                        dataIndex: '试用不合格',
                        key: 'unqualified',
                        width: 100,
                        render: (text, item, index) => {
                            return (
                                <span className="customer-stage-number"
                                    onClick={this.handleStageNumClick.bind(this, item, '试用不合格')}>{text}</span>
                            );
                        }
                    }, {
                        title: Intl.get('sales.stage.signed', '签约'),
                        dataIndex: '签约',
                        key: 'signed',
                        render: (text, item, index) => {
                            return (
                                <span className="customer-stage-number"
                                    onClick={this.handleStageNumClick.bind(this, item, '签约')}>{text}</span>
                            );
                        }
                    }, {
                        title: Intl.get('sales.stage.lost', '流失'),
                        dataIndex: '流失',
                        key: '流失',
                        render: (text, item, index) => {
                            return (
                                <span className="customer-stage-number"
                                    onClick={this.handleStageNumClick.bind(this, item, '流失')}>{text}</span>
                            );
                        }
                    }, {
                        title: Intl.get('sales.home.sales', '销售'),
                        dataIndex: 'memberName',
                        key: 'memberName'
                    }, {
                        title: Intl.get('common.belong.team', '所属团队'),
                        dataIndex: 'salesTeam',
                        key: 'salesTeam',
                        width: 80
                    }
                ],
            },
        }];

        const trialQualifiedChart = this.getTrialQualifiedChart();
        charts.unshift(trialQualifiedChart);

        return charts;
    },
    renderChartContent: function() {
        return (
            <div className="chart_list">
                <AntcAnalysis
                    charts={this.getCharts()}
                    emitterConfigList={this.props.emitterConfigList}
                    conditions={this.props.conditions}
                    isGetDataOnMount={true}
                    style={{marginLeft: -10, marginRight: -5}}
                />
            </div>
        );
    },
    renderContent: function() {

        if (this.state.updateScrollBar) {
            return (
                <div>
                    {this.renderChartContent()}
                </div>
            );
        } else {
            return (
                <GeminiScrollbar enabled={this.props.scrollbarEnabled} ref="scrollbar">
                    {this.renderChartContent()}
                </GeminiScrollbar>
            );
        }
    },
    showCustomerTable(isShow) {
        this.setState({
            isShowCustomerTable: isShow
        });
    },
    //新开客户统计表格数字点击处理函数
    handleNewAddedCustomerNumClick(num, type) {
        //客户数为0时不打开客户列表面板
        if (!num || num === '0') {
            return;
        }
        this.setState({
            newAddedCustomerType: type,
            isShowCustomerTable: true
        });
    },

    render: function() {
        let layoutParams = this.props.getChartLayoutParams();
        this.chartWidth = layoutParams.chartWidth;

        const newAddedCustomerParams = {
            queryObj: {},
            rangParams: [{
                from: this.props.startTime,
                to: this.props.endTime,
                type: 'time',
                name: 'start_time'
            }],
            condition: {
                customer_label: this.state.newAddedCustomerType,
                term_fields: ['customer_label'],                
            }
        };

        if (this.state.currentTeamId) {
            newAddedCustomerParams.condition.sales_team_id = this.state.currentTeamId;
        }

        if (this.state.currentMemberId) {
            newAddedCustomerParams.queryObj.user_id = this.state.currentMemberId;
        }

        return (
            <div className="oplate_customer_analysis">
                <div ref="chart_list" style={{ height: layoutParams.chartListHeight }}>
                    {this.renderContent()}
                </div>
                <RightPanel
                    className="customer-stage-table-wrapper"
                    showFlag={this.state.isShowCustomerStageTable || this.state.isShowCustomerTable}
                >
                    {this.state.isShowCustomerStageTable ?
                        <CustomerStageTable
                            params={this.state.selectedCustomerStage}
                            result={this.state.stageChangedCustomerList}
                            onClose={this.toggleCusStageMetic}
                            handleScrollBottom={this.getStageChangeCustomerList.bind(this)}
                            showNoMoreData={!this.state.stageChangedCustomerList.loading &&
                                !this.state.stageChangedCustomerList.listenScrollBottom &&
                                this.state.stageChangedCustomerList.lastId &&
                                !this.state.stageChangedCustomerList.data.length >= DEFAULT_TABLE_PAGESIZE
                            }
                        /> : null}

                    {
                        this.state.isShowCustomerTable ?
                            <div className="customer-table-close topNav">
                                <RightPanelClose
                                    title={Intl.get('common.app.status.close', '关闭')}
                                    onClick={this.showCustomerTable.bind(this, false)}
                                />
                                <CrmList
                                    location={{ query: '' }}
                                    fromSalesHome={true}
                                    params={newAddedCustomerParams}
                                />
                            </div> : null
                    }
                </RightPanel>
            </div>
        );
    }
});
//返回react对象
module.exports = CustomerAnalysis;
