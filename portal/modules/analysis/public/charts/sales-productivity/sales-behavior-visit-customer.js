/**
 * 销售行为统计
 */

import {listPanelEmitter} from 'PUB_DIR/sources/utils/emitters';
import { argCallbackMemberIdToMemberIds } from '../../utils';
let conditionCache = {};

export function getSalesBehaviorVisitCustomerChart(paramObj = {}) {
    let chart = {
        title: Intl.get('common.sales.behavior.statistics', '销售行为统计'),
        chartType: 'table',
        url: '/rest/analysis/callrecord/v1/customertrace/:data_type/sale/trace/statistics',
        argCallback: arg => {
            argCallbackMemberIdToMemberIds(arg);
            if (arg.query.member_ids) {
                arg.query.result_type = 'user';
            }

            conditionCache = arg.query;
        },
        processData: data => {
            const list = _.get(data, 'list');
            return _.map(list, item => {
                ['visit', 'phone_all', 'phone_answer'].forEach(field => {
                    if (isNaN(item[field])) item[field] = 0;
                });

                item.phone_no_answer = item.phone_all - item.phone_answer;

                return item;
            });
        },
        option: {
            columns: [{
                title: Intl.get('common.definition', '名称'),
                dataIndex: 'name',
                width: '20%',
            }, {
                title: Intl.get('common.number.of.customers.visited', '拜访客户数'),
                dataIndex: 'visit',
                width: '20%',
                render: value => {
                    return <span style={{cursor: 'pointer'}} onClick={visitedCustomerNumClickHandler}>{value}</span>;
                }
            }, {
                title: Intl.get('common.number.of.customers.contacted', '联系客户数'),
                dataIndex: 'phone_all',
                width: '20%',
            }, {
                title: Intl.get('common.number.of.calls.made', '接通数'),
                dataIndex: 'phone_answer',
                width: '20%',
            }, {
                title: Intl.get('common.number.of.calls.not.connected', '未接通数'),
                dataIndex: 'phone_no_answer',
                width: '20%',
            }]
        },
    };

    if (paramObj.chartProps) {
        chart = {...chart, ...paramObj.chartProps};
    }

    //销售行为统计拜访客户数点击处理函数
    function visitedCustomerNumClickHandler(e) {
        Trace.traceEvent(e, '点击销售个人报告页面上的销售行为统计拜访客户数查看详细列表');

        const paramObj = {
            listType: 'customer',
            url: '/rest/analysis/callrecord/v1/customertrace/sale/visit/statistics',
            conditions: _.map(conditionCache, (value, key) => ({name: key, value})),
            columns: [
                {
                    title: Intl.get('crm.41', '客户名'),
                    dataIndex: 'name',
                    width: '20%'
                },
                {
                    title: Intl.get('common.visit.start.time', '拜访开始时间'),
                    dataIndex: 'start_time',
                    width: '15%'
                },
                {
                    title: Intl.get('common.visit.end.time', '拜访结束时间'),
                    dataIndex: 'end_time',
                    width: '15%'
                },
                {
                    title: Intl.get('common.customer.visit.record', '客户拜访记录'),
                    dataIndex: 'remark',
                    width: '50%'
                }
            ],
            onRowClick: record => {
                phoneMsgEmitter.emit(phoneMsgEmitter.OPEN_PHONE_PANEL, {
                    customer_params: {
                        currentId: record.id 
                    }
                });
            }
        };

        listPanelEmitter.emit(listPanelEmitter.SHOW, paramObj);
    }

    return chart;
}
