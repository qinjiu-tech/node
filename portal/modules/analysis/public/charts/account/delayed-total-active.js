/**
 * 出差统计详情
 */

import { MERIDIEM } from 'PUB_DIR/sources/utils/consts';

export function getDelayedTotalActiveChart() {
    return {
        title: Intl.get('analysis.business.trip.statistics', '出差统计详情'),
        chartType: 'table',
        url: '/rest/analysis/user/v3/:data_type/delay/user/team',
        option: {
            columns: [{
                title: Intl.get('user.user.team', '团队'),
                dataIndex: 'sales_team',
                width: 100,
            }, {
                title: Intl.get('sales.home.sales', '销售'),
                dataIndex: 'member_name',
                width: 100,
            }, {
                title: '延期总数',
                dataIndex: 'total',
                width: 100,
            }, {
                title: '活跃数',
                dataIndex: 'active',
                width: 100,
            }],
        }
    };
}
