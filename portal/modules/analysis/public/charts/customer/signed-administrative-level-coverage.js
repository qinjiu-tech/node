/**
 * 签约客户行政级别市场占有率分析
 */

//判断是否在蚁坊域的方法
const isOrganizationEefung = require('PUB_DIR/sources/utils/common-method-util').isOrganizationEefung;

export function getSignedCustomerAdministrativeLevelCoverageChart(paramObj = {}) {
    return {
        title: '签约客户行政级别市场占有率分析',
        noShowCondition: {
            //在户登录的不是蚁坊域时不显示
            callback: () => !isOrganizationEefung()
        },
        chartType: 'table',
        url: '/rest/analysis/customer/label/:data_type/share/level',
        argCallback: paramObj.argCallback,
        processData: data => [data],
        option: {
            columns: [{
                title: '省级客户数',
                dataIndex: 'province_customer',
                width: '15%',
            }, {
                title: '省级占有率',
                dataIndex: 'province_percent',
                showAsPercent: true,
                width: '15%',
            }, {
                title: '市级客户数',
                dataIndex: 'city_customer',
                width: '15%',
            }, {
                title: '市级占有率',
                dataIndex: 'city_percent',
                showAsPercent: true,
                width: '15%',
            }, {
                title: '县级客户数',
                dataIndex: 'county_customer',
                width: '15%',
            }, {
                title: '县级占有率',
                dataIndex: 'county_percent',
                showAsPercent: true,
                width: '15%',
            }],
        },
    };
}
