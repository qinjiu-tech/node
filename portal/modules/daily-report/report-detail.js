/**
 * 报告详情
 */

import { Form } from 'antd';
import { renderFormItemFunc } from 'antc/lib/utils/form-utils';
import { VIEW_TYPE } from './consts';
import { renderButtonZoneFunc, hideReportPanel, getReportList, saveReport, saveReportConfig } from './utils';
import DetailCard from 'CMP_DIR/detail-card';

class ReportDetail extends React.Component {
    state = {
        reportDetail: this.props.reportDetail || {},
    }

    componentDidMount() {
        if (_.isEmpty(this.state.reportDetail)) {
            getReportList(list => {
                const reportDetail = _.first(list) || {};
                this.setState({ reportDetail });
            });
        }
    }

    render() {
        const renderFormItem = renderFormItemFunc.bind(this, {});
        const renderButtonZone = renderButtonZoneFunc.bind(this);

        const { updateState, reportConfig, isPreviewReport, isConfigReport, isOpenReport } = this.props;
        const { reportDetail } = this.state;

        let items;

        if (isOpenReport || isConfigReport) {
            ({ items } = reportConfig);
        } else {
            items = reportDetail.item_values;
        }

        const editableFields = ['其他'];
        const editableItems = _.filter(items, item => _.includes(editableFields, item.name));
        const unEditableItems = _.filter(items, item => !_.includes(editableFields, item.name));

        return (
            <div>
                <Form>
                    <DetailCard
                        title="日常工作"
                        content={(
                            <div>
                                {_.map(unEditableItems, item => {
                                    return <div>{item.name}: {item.value || 0}</div>;
                                })}
                            </div>
                        )}
                    />

                    <DetailCard
                        title="其他工作"
                        content={(
                            <div>
                                {_.map(editableItems, item => {
                                    return renderFormItem('', item.name, {
                                        type: isPreviewReport ? 'text' : 'textarea',
                                        initialValue: item.value_str,
                                        fieldDecoratorOption: { initialValue: item.value_str },
                                        formItemLayout: {
                                            labelCol: { span: 0 },
                                            wrapperCol: { span: 24 },
                                        }
                                    });
                                })}
                            </div>
                        )}
                    />

                    {renderButtonZone([{
                        hide: !isOpenReport,
                        name: '开启',
                        type: 'primary',
                        func: () => {
                            updateState({ currentView: VIEW_TYPE.SET_RULE });
                        }
                    }, {
                        hide: !isOpenReport,
                        name: '取消',
                        func: () => { this.props.updateState({ currentView: VIEW_TYPE.OPEN_REPORT }); },
                    }, {
                        hide: isPreviewReport || isOpenReport || isConfigReport,
                        func: hideReportPanel,
                        name: '取消',
                    }, {
                        hide: isPreviewReport || isOpenReport || isConfigReport,
                        func: this.save.bind(this),
                        name: '保存',
                    }])}
                </Form>
            </div>
        );
    }

    save() {
        this.props.form.validateFields((err, values) => {
            if (!err) {
                let { reportDetail } = this.state;
                let itemValues = _.get(reportDetail, 'item_values');

                _.each(values, (value, key) => {
                    if (_.isUndefined(value)) {
                        delete values[key];
                    } else {
                        let field = _.find(itemValues, item => item.name === key);

                        if (field) field.value_str = value;
                    }
                });

                saveReport(reportDetail, result => {});
            }
        });
    }
}

export default Form.create()(ReportDetail);
