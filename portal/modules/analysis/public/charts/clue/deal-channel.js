/**
 * 成交数渠道统计
 */

import { initialTime } from '../../consts';

export function getClueDealChannelChart() {
    return {
        title: Intl.get('analysis.transaction.channel.statistics', '成交渠道统计'),
        chartType: 'bar_pie',
        url: '/rest/analysis/customer/v2/clue/:data_type/statistical/field/access_channel',
        conditions: [{
            name: 'customer_label',
            value: Intl.get('common.official', '签约'),
        }],
        dataField: 'result',
        processData: data => {
            return _.map(data, dataItem => {
                let processedItem = {};
                _.each(dataItem, (value, key) => {
                    processedItem.name = key || Intl.get('common.unknown', '未知');
                    processedItem.value = value;
                });

                return processedItem;
            });
        },
        option: {
            yAxis: [{
                //设置成1保证坐标轴分割刻度显示成整数
                minInterval: 1,
            }]
        }
    };
}
