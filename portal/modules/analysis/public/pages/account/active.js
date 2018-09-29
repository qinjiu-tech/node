/**
 * 活跃分析
 */

import accountChart from '../../charts/account';

module.exports = {
    title: '活跃分析',
    menuIndex: 2,
    privileges: [
        'USER_ANALYSIS_COMMON',
        'USER_ANALYSIS_MANAGER',
    ],
    charts: getCharts()
};

function getCharts() {
    return [
        //活跃度
        accountChart.getActivityChart(),
        //活跃时间段
        accountChart.getActiveTimeIntervalChart(),
        //在线时长统计
        accountChart.getLoginLongChart(),
        //用户访问次数
        accountChart.getLoginCountsChart(),
        //活跃用户地域统计
        accountChart.getActiveAreaChart(),
        //用户访问天数
        accountChart.getLoginDaysChart(),
        //用户在线时间
        accountChart.getLoginTimesChart(),
        //平均在线时长
        accountChart.getAverageOnlineTimeChart(),
    ];
}
