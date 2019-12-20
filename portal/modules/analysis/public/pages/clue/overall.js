/**
 * 总体分析
 */

import clueChart from '../../charts/clue';
import {CLUE_MENUS} from '../../consts';
import {isOpenCash} from 'PUB_DIR/sources/utils/common-method-util';
import analysisPrivilegeConst from 'MOD_DIR/analysis/public/privilege-const';

module.exports = {
    title: CLUE_MENUS.OVERALL.name,
    key: CLUE_MENUS.OVERALL.key,
    privileges: [
        analysisPrivilegeConst.CURTAO_CRM_ANALYSIS_LEAD_ALL,
        analysisPrivilegeConst.CURTAO_CRM_ANALYSIS_LEAD_SELF,
    ],
    charts: getCharts()
};

function getCharts() {
    let charts = [
        //漏斗统计
        clueChart.getStageChart(),
        //阶段统计
        clueChart.getCurrentStageChart(),
        //渠道统计
        clueChart.getClueSituationChart({title: '渠道统计', field: 'access_channel'}),
        //来源统计
        clueChart.getClueSituationChart({title: '来源统计', field: 'clue_source'}),
        //分类统计
        clueChart.getClueSituationChart({title: '分类统计', field: 'clue_classify'}),
    ];

    if(isOpenCash()) {
        charts.push(
            //成交额及成交数统计
            clueChart.getClueDealChart(),
            //成交数渠道统计
            clueChart.getClueDealChannelChart(),
            //成交数分类统计
            clueChart.getClueDealClassifyChart(),
        );
    }

    charts.push(
        //历史同期数量统计对比
        clueChart.getClueHistoricalPeriodComparisionChart(),
        //市场线索分配统计
        clueChart.getClueDistributionChart(),
        //销售提取线索统计
        clueChart.getClueRetrievalChart(),
    );

    return charts;
}
