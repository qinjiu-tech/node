/**
 * 电话行业统计
 */

export function getCallIndustryChart(paramObj = {}) {
    return {
        title: '电话行业统计',
        chartType: 'bar',
        layout: {sm: 24},
        url: '/rest/analysis/callrecord/v1/callrecord/statistics/distribution/industry',
        argCallback: arg => {
            const deviceType = _.get(arg, 'query.device_type', '');
            
            //通话记录模块里的通话分析页面上的呼叫中心的选项值为 'phone,curtao_phone' ，电话行业统计接口只支持 'phone'，所以需要转换一下
            if (deviceType.includes('phone')) {
                arg.query.device_type = 'phone';
            }
        },
        dataField: 'industry_sum',
    };
}
