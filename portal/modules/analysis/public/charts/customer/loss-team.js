/**
 * 流失客户团队分析
 */

export function getLossCustomerTeamChart() {
    return {
        title: '流失客户团队分析',
        chartType: 'bar',
        url: '/rest/analysis/customer/label/:data_type/churn/team',
    };
}
