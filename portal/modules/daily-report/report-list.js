/**
 * 报告列表
 */

import { AntcAnalysis } from 'antc';
import { teamTreeEmitter, dateSelectorEmitter } from 'PUB_DIR/sources/utils/emitters';
import { showReportPanel } from './utils';

class ReportList extends React.Component {
    //获取查询条件
    getConditions = () => {
        return [
            {
                name: 'team_ids',
                value: '',
            },
            {
                name: 'member_ids',
                value: '',
            },
            {
                name: 'start_time',
                value: moment().startOf('day').valueOf(),
            },
            {
                name: 'end_time',
                value: moment().valueOf(),
            },
        ];
    };

    //获取事件触发器
    getEmitters = () => {
        return [
            {
                emitter: dateSelectorEmitter,
                event: dateSelectorEmitter.SELECT_DATE,
                callbackArgs: [{
                    name: 'start_time',
                }, {
                    name: 'end_time',
                }],
            },
            {
                emitter: teamTreeEmitter,
                event: teamTreeEmitter.SELECT_TEAM,
                callbackArgs: [{
                    name: 'team_ids',
                    exclusive: 'member_ids',
                }],
            },
            {
                emitter: teamTreeEmitter,
                event: teamTreeEmitter.SELECT_MEMBER,
                callbackArgs: [{
                    name: 'member_ids',
                    exclusive: 'team_ids',
                }],
            }
        ];
    };

    //获取图表列表
    getCharts = () => {
        return [
            {
                title: '销售经理日报',
                chartType: 'table',
                layout: {sm: 24},
                height: 'auto',
                cardContainer: {
                    props: {
                        isShowExportBtnWhenMouseEnter: false
                    },
                },
                url: '/rest/customer/v3/dailyreport/report',
                dataField: 'daily_reports',
                processData: data => {
                    _.each(data, item => {
                        _.each(item.item_values, obj => {
                            const { name, value, value_str } = obj;

                            item[name] = value_str || value;
                        });
                    });

                    return data;
                },
                processOption: (option, chart) => {
                    const firstDataItem = _.first(chart.data);

                    if (firstDataItem) {
                        const { nickname, item_values } = firstDataItem;
                        const { columns } = option;

                        if (nickname) {
                            columns.push({
                                title: '销售',
                                dataIndex: 'nickname',
                                width: 80,
                            });
                        }

                        _.each(firstDataItem.item_values, obj => {
                            const { name } = obj;

                            let column = {
                                title: name,
                                dataIndex: name,
                                width: 130,
                                align: 'right',
                                render: (value, record) => {
                                    return (
                                        <span
                                            onClick={e => {
                                                e.stopPropagation();
                                                showReportPanel({
                                                    currentView: VIEW_TYPE.REPORT_FORM,
                                                    //clickedTpl: tpl
                                                });
                                            }}
                                        >
                                            {value}
                                        </span>
                                    );
                                }
                            };

                            if (name === '其他') {
                                column.isSetCsvValueBlank = true;
                                column.align = 'left';
                            }

                            columns.push(column);
                        });
                    }
                },
                option: {
                    columns: [
                        {
                            title: '团队',
                            dataIndex: 'sales_team',
                            width: 80,
                        },
                    ],
                    onRowClick: (record, index, event) => {
                        console.log(record);
                        showReportPanel({
                            currentView: VIEW_TYPE.REPORT_FORM,
                            //clickedTpl: tpl
                        });
                    }
                },
            },
        ];
    };

    render() {
        return (
            <div className="report-list">
                <AntcAnalysis
                    charts={this.getCharts()}
                    conditions={this.getConditions()}
                    emitterConfigList={this.getEmitters()}
                    isGetDataOnMount={true}
                    forceUpdate={true}
                    isUseScrollBar={true}
                    style={{marginRight: 0}}
                />
            </div>
        );
    }
}

export default ReportList;
