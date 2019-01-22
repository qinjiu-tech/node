var React = require('react');
var createReactClass = require('create-react-class');
const Validation = require('rc-form-validation-for-react16');
const Validator = Validation.Validator;
/**
 * 计划回款信息添加表单
 */

import { Form, Input, Select, Button, Icon } from 'antd';
const FormItem = Form.Item;
const Option = Select.Option;
import ValidateMixin from '../../../mixins/ValidateMixin';
import {numberAddNoMoreThan,getNumberValidateRule} from 'PUB_DIR/sources/utils/validate-util';
const AddRepayment = createReactClass({
    displayName: 'AddRepayment',
    mixins: [ValidateMixin],
    propTypes: {
        rightPanel: PropTypes.element,
        updateScrollBar: PropTypes.updateScrollBar
    },
    getInitialFormData: function() {
        return {
            type: 'repay_plan',
            unit: 'days',
        };
    },

    getInitialState: function() {
        return {
            repayments: [],
            formData: this.getInitialFormData(),
        };
    },

    addRepayment: function() {
        this.refs.validation.validate(valid => {
            if (!valid) {
                return;
            } else {
                const state = this.state;
                delete state.formData.unit;
                state.repayments.push(_.clone(state.formData));
                state.formData = this.getInitialFormData();
                this.setState(state, () => {
                    this.props.updateScrollBar();
                });
            }
        });
    },

    deleteRepayment: function(index) {
        const state = this.state;
        state.repayments.splice(index, 1);

        this.setState(state);
    },

    onNumChange: function(e) {
        const num = e.target.value;
        const state = this.state;
        state.formData.num = num;

        if (!isNaN(num)) {
            const count = parseInt(num);
            const signDate = this.props.rightPanel.refs.addBasic.state.formData.date;
            state.formData.date = moment(signDate).add(count, state.formData.unit).valueOf();
        }

        this.setState(state);
    },

    onUnitChange: function(value) {
        const state = this.state;
        state.formData.unit = value;

        const num = state.formData.num;

        if (!isNaN(num)) {
            const signDate = this.props.rightPanel.refs.addBasic.state.formData.date;
            const count = parseInt(num);
            state.formData.date = moment(signDate).add(count, value).valueOf();
        }

        this.setState(state);
    },

    render: function() {
        //合同额
        const contractAmount = _.get(this, 'props.parent.refs.addBasic.state.formData.contract_amount');
        //已添加的回款总额
        let repaymentsAmount = 0;
        const repayments = this.state.repayments;

        if (repayments.length) {
            repaymentsAmount = _.reduce(repayments, (memo, repayment) => {
                const num = parseFloat(repayment.amount);
                return memo + num;
            }, 0);
        }

        return (
            <div className="add-repayments">
                {this.state.repayments.length ? (
                    <div className="finance-list">
                        <ul>
                            {this.state.repayments.map((repayment, index) => { return (
                                <li key={index}>                                    
                                    {moment(repayment.date).format(oplateConsts.DATE_FORMAT)}前 {Intl.get('contract.94', '应收金额')}{repayment.amount}{Intl.get('contract.155', '元')}
                                    <span className="btn-bar"
                                        title={Intl.get('common.delete', '删除')}
                                        onClick={this.deleteRepayment.bind(this, index)}>
                                        <Icon type="close" theme="outlined" />
                                    </span>
                                </li>
                            );})}
                        </ul>
                    </div>
                ) : null}
                <div className="add-finance new-add-repayment-container">
                    <Validation ref="validation" onValidate={this.handleValidate}>
                        <ReactIntl.FormattedMessage id="contract.78" defaultMessage="从签订日起" />
                        <FormItem 
                            validateStatus={this.getValidateStatus('num')}
                            help={this.getHelpMessage('num')}
                        >
                            <Validator rules={[{required: true, message: Intl.get('contract.44', '不能为空')}, {pattern: /^\d+$/, message: Intl.get('contract.45', '请填写数字')}]}>
                                <Input
                                    name="num"
                                    value={this.state.formData.num}
                                    onChange={this.onNumChange}
                                />
                            </Validator>
                        </FormItem>
                        <Select 
                            value={this.state.formData.unit}
                            onChange={this.onUnitChange}
                        >
                            <Option key="days" value="days"><ReactIntl.FormattedMessage id="contract.79" defaultMessage="日" /></Option>
                            <Option key="weeks" value="weeks"><ReactIntl.FormattedMessage id="common.time.unit.week" defaultMessage="周" /></Option>
                            <Option key="months" value="months"><ReactIntl.FormattedMessage id="common.time.unit.month" defaultMessage="月" /></Option>
                        </Select>
                    内，应收回款
                        <FormItem 
                            validateStatus={this.getValidateStatus('amount')}
                            help={this.getHelpMessage('amount')}
                        >
                            <Validator rules={[{required: true, message: Intl.get('contract.44', '不能为空')}, getNumberValidateRule(), numberAddNoMoreThan.bind(this, contractAmount, repaymentsAmount, Intl.get('contract.161', '已超合同额'))]}>
                                <Input
                                    name="amount"
                                    value={this.state.formData.amount}
                                    onChange={this.setField.bind(this, 'amount')}
                                />
                            </Validator>
                        </FormItem>
                        <ReactIntl.FormattedMessage id="contract.155" defaultMessage="元" />
                        <Button
                            className="btn-primary-sure"
                            onClick={this.addRepayment}
                        >
                            <ReactIntl.FormattedMessage id="common.add" defaultMessage="添加" />
                        </Button>
                    </Validation>
                </div>

                
            </div>
        );
    },
});
module.exports = AddRepayment;


