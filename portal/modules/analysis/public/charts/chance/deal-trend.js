/**
 * 成交率趋势统计
 */

import { num as antUtilNum } from 'ant-utils';

export function getChanceDealTrendChart() {
    return {
        title: '成交率趋势统计',
        chartType: 'line',
        url: '/rest/analysis/customer/v2/sales_opportunity/:data_type/apply/opportunity/rate/trend',
        processData: data => {
            data = _.get(data, 'result.list');

            return _.map(data, dataItem => {
                dataItem.name = dataItem.date_str;
                dataItem.value = dataItem.deal_rate;

                return dataItem;
            });
        },
        option: {
            tooltip: {
                formatter: params => {
                    const param = _.get(params, '[0]', {});
                    const data = _.get(param, 'data', {});

                    return `
                        ${param.name}<br>
                        成交数: ${data.deal}<br>
                        成交率: ${antUtilNum.decimalToPercent(data.deal_rate)}
                    `;
                }
            },
            yAxis: [{
                axisLabel: {
                    //纵轴刻度值转为百分比
                    formatter: value => {
                        return antUtilNum.decimalToPercent(value);
                    }
                }
            }]
        }
    };
}
