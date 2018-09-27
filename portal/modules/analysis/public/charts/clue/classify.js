/**
 * 分类统计
 */

import { initialTime } from '../../consts';
import { processClueStatisticsData } from '../../utils';

export function getClassifyChart() {
    return {
        title: Intl.get('clue.analysis.classify.chart', '分类统计'),
        chartType: 'pie',
        url: '/rest/customer/v2/clue/:data_type/statistical/clue_classify/1000/1',
        reqType: 'post',
        conditions: [{
            type: 'data',
            rangeParamName: 'name',
            value: 'source_time',
        }, {
            type: 'data',
            rangeParamName: 'type',
            value: 'time',
        }, {
            name: 'starttime',
            value: initialTime.start,
            type: 'data',
            rangeParamName: 'from',
        }, {
            name: 'endtime',
            value: initialTime.end,
            type: 'data',
            rangeParamName: 'to',
        }],
        dataField: 'result',
        processData: processClueStatisticsData.bind(this, false),
        option: {
            legend: {
                orient: 'horizontal',
                type: 'scroll',
                x: 'left',
                pageIconSize: 10,
            }
        },
        noExportCsv: true,
    };
}
