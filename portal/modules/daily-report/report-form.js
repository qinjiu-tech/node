/**
 * 报告表单
 */

import { Form } from 'antd';
import { renderFormItemFunc } from 'antc/lib/utils/form-utils';
import { VIEW_TYPE } from './consts';
import { renderButtonZoneFunc, hideReportPanel, getTplValues } from './utils';

class ReportForm extends React.Component {
    componentDidMount() {
        getTplValues(result => {
            this.props.updateState({ tplValues: result });
        });
    }

    render() {
        const { updateState, clickedTpl, isPreview } = this.props;
        const renderFormItem = renderFormItemFunc.bind(this, {});
        const renderButtonZone = renderButtonZoneFunc.bind(this);

        return (
            <div>
                <Form>
                    {_.map(clickedTpl.items, item => {
                        let type = 'inputNumber';
                        return renderFormItem(item.name, item.id, { type });
                    })}

                    {renderButtonZone([{
                        hide: !isPreview,
                        name: '返回',
                        func: () => { this.props.updateState({ currentView: VIEW_TYPE.ADD_TPL }); },
                    }, {
                        hide: isPreview,
                        func: hideReportPanel,
                        name: '取消',
                    }, {
                        hide: isPreview,
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
                console.log(values);
                _.each(values, (value, key) => {
                    if (_.isUndefined(value)) delete values[key];
                });

                if (values.status === true) {
                    values.status = 'on';
                } else if (values.status === false) {
                    values.status = 'off';
                }

                const { reportList, selectedReport } = this.props;

                const reportData = _.find(reportList, report => report.id === selectedReport) || {};

                const postData = _.extend({}, reportData, values);

                console.log(postData);//return
                saveReport(postData, result => {});
                //hideReportPanel()
            }
        });
    }
}

export default Form.create()(ReportForm);
