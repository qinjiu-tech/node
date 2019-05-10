/**
 * 流失现金趋势
 */

export function getLossCashTrendChart(paramObj = {}) {
    return {
        title: '流失现金趋势',
        chartType: 'line',
        url: '/rest/analysis/customer/label/:data_type/churn/gross/trend',
        argCallback: paramObj.argCallback,
        valueField: 'churn_gross_profit',
    };
}
