/**
 * 拜访客户统计
 */

let conditionCache = null;
let levelOneChartCache = null;
let levelTwoChartCache = null;
let analysisInstanceCache = null;
let chartIndexCache = -1;

export function getVisitCustomerChart() {
    let chart = {
        title: '出差拜访频率统计',
        chartType: 'table',
        layout: { sm: 24 },
        height: 'auto',
        url: '/rest/analysis/callrecord/v1/customertrace/:data_type/sale/trace/statistics',
        argCallback: arg => {
            arg.query.result_type = 'user';

            conditionCache = arg.query;
        },
        processData: (data, chart, analysisInstance, chartIndex) => {
            analysisInstanceCache = analysisInstance;
            chartIndexCache = chartIndex;

            const list = _.get(data, 'list');
            return _.filter(list, item => item.visit > 0);
        },
        option: {
            columns: [{
                title: '日期',
                dataIndex: 'sales_team',
                width: '10%',
            }, {
                title: '出差人员',
                dataIndex: 'nick_name',
                width: '10%',
                render: (value, record) => {
                    return <span className="clickable" onClick={onSalesNameClick.bind(this, value, record)}>{value}</span>;
                }
            }]
        },
    };

    //销售人员名点击事件
    function onSalesNameClick(salesName, record) {
        let charts = analysisInstanceCache.state.charts;

        let chart = charts[chartIndexCache];
        levelOneChartCache = _.cloneDeep(chart);

        chart.title = salesName + '拜访客户频率统计';
        const subTitle = <span className="clickable" onClick={backToLevelOne}>返回</span>;
        _.set(chart, 'cardContainer.props.subTitle', subTitle);
        chart.url = '/rest/analysis/callrecord/v1/customertrace/sale/visit/statistics';

        conditionCache.member_id = record.user_id;

        chart.conditions = _.map(conditionCache, (value, key) => ({name: key, value}));

        chart.processData = data => data.list;

        chart.option.columns = [
            {
                title: '日期',
                dataIndex: 'customer_id',
                width: '10%'
            },
            {
                title: '拜访客户',
                dataIndex: 'customer_name',
                width: '10%',
                render: (value, record) => {
                    return <span className="clickable" onClick={onCustomerNameClick.bind(this, value, record)}>{value}</span>;
                }
            },
        ];

        analysisInstanceCache.getData(chartIndexCache);
    }

    //销售人员名点击事件
    function onCustomerNameClick(customerName, record) {
        let charts = analysisInstanceCache.state.charts;

        let chart = charts[chartIndexCache];
        levelTwoChartCache = _.cloneDeep(chart);

        chart.title = '拜访' + customerName + '的频率统计';
        const subTitle = <span className="clickable" onClick={backToLevelTwo}>返回</span>;
        _.set(chart, 'cardContainer.props.subTitle', subTitle);
        chart.url = '/rest/analysis/callrecord/v1/customertrace/sale/visit/statistics';

        conditionCache.member_id = record.user_id;

        chart.conditions = _.map(conditionCache, (value, key) => ({name: key, value}));

        chart.processData = data => data.list;

        chart.option.columns = [
            {
                title: '日期',
                dataIndex: 'apply_id',
                width: '10%'
            },
            {
                title: '销售',
                dataIndex: 'user_id',
                width: '10%',
            },
            {
                title: '拜访记录',
                dataIndex: 'trace_remark',
                width: '10%',
            },
        ];

        analysisInstanceCache.getData(chartIndexCache);
    }

    //返回第一层
    function backToLevelOne() {
        let charts = analysisInstanceCache.state.charts;
        charts[chartIndexCache] = levelOneChartCache;

        analysisInstanceCache.setState({charts});
    }

    //返回第二层
    function backToLevelTwo() {
        let charts = analysisInstanceCache.state.charts;
        charts[chartIndexCache] = levelTwoChartCache;

        analysisInstanceCache.setState({charts});
    }

    return chart;
}
