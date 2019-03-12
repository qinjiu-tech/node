var React = require('react');
var createReactClass = require('create-react-class');
const Validation = require('rc-form-validation-for-react16');
const Validator = Validation.Validator;
/**
 * 应付款信息添加表单
 */

import { Form, Input, Select, Button, Icon } from 'antd';
const FormItem = Form.Item;
const Option = Select.Option;
import './css/common-contract-amount.less';
import ValidateMixin from '../../../mixins/ValidateMixin';
import {getNumberValidateRule,numberAddNoMoreThan} from 'PUB_DIR/sources/utils/validate-util';

const AddBuyPayment = createReactClass({
    displayName: 'AddBuyPayment',
    mixins: [ValidateMixin],
    propTypes: {
        rightPanel: PropTypes.element,
        updateScrollBar: PropTypes.updateScrollBar
    },
    getInitialFormData: function() {
        return {
            unit: 'days',
        };
    },

    getInitialState: function() {
        return {
            payments: [],
            formData: this.getInitialFormData(),
        };
    },

    addPayment: function() {
        this.refs.validation.validate(valid => {
            if (!valid) {
                return;
            } else {
                let {formData,payments} = this.state;
                payments.push(_.clone(this.state.formData));
                formData = this.getInitialFormData();
                this.refs.validation.reset();
                this.setState({
                    payments,
                    formData
                }, () => {
                    this.props.updateScrollBar();
                });
            }
        });
    },

    deletePayment: function(index) {
        this.state.payments.splice(index, 1);

        this.setState(this.state);
    },

    onNumChange: function(e) {
        const num = e.target.value;
        let {formData} = this.state;
        formData.num = num;

        if (!isNaN(num)) {
            const count = parseInt(num);
            const signDate = this.props.rightPanel.refs.addBuyBasic.state.formData.date;
            formData.date = moment(signDate).add(count, this.state.formData.unit).valueOf();
        }

        this.setState({formData});
    },

    onUnitChange: function(value) {
        let {formData} = this.state;
        formData.unit = value;

        const num = this.state.formData.num;

        if (!isNaN(num)) {
            const signDate = this.props.rightPanel.refs.addBuyBasic.state.formData.date;
            const count = parseInt(num);
            formData.date = moment(signDate).add(count, value).valueOf();
        }

        this.setState({formData});
    },

    render: function() {
        //合同额
        const contractAmount = _.get(this, 'props.rightPanel.refs.addBuyBasic.state.formData.contract_amount');
        //已添加的回款总额
        let paymentsAmount = 0;
        const payments = this.state.payments;

        if (payments.length) {
            paymentsAmount = _.reduce(payments, (memo, payment) => {
                const num = parseFloat(payment.amount);
                return memo + num;
            }, 0);
        }
        return (
            <div className="add-repayments" data-tracename='添加合同>付款信息'>
                {this.state.payments.length ? (
                    <div className="finance-list">
                        <ul>
                            {this.state.payments.map((payment, index) => {
                                return (
                                    <li key={index}>
                                        {Intl.get('contract.83', '至')}{moment(payment.date).format(oplateConsts.DATE_FORMAT)} <i className='iconfont icon-huikuan'></i> {Intl.get('contract.84', '应付金额{num}元',{num: this.parseAmount(payment.amount)})}
                                        <span className="btn-bar"
                                            title={Intl.get('common.delete', '删除')}
                                            onClick={this.deletePayment.bind(this, index)}>
                                            <Icon type="close" theme="outlined" />
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ) : null}

                <div className="add-finance new-add-form-container">
                    <Form layout='horizontal'>
                        <Validation ref="validation" onValidate={this.handleValidate}>
                            <ReactIntl.FormattedMessage id="contract.78" defaultMessage="从签订日起" />
                            <FormItem
                                validateStatus={this.getValidateStatus('num')}
                                help={this.getHelpMessage('num')}
                            >
                                <Validator rules={[{ required: true, message: Intl.get('contract.44', '不能为空') }, getNumberValidateRule()]}>
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
                            {Intl.get('contract.80', '内')}，
                            {Intl.get('contract.81', '应付款')}
                            <FormItem
                                validateStatus={this.getValidateStatus('amount')}
                                help={this.getHelpMessage('amount')}
                            >
                                <Validator rules={[{ required: true, message: Intl.get('contract.44', '不能为空') }, getNumberValidateRule(), numberAddNoMoreThan.bind(this, contractAmount, paymentsAmount, Intl.get('contract.161', '已超合同额'))]}>
                                    <Input
                                        name="amount"
                                        value={this.parseAmount(this.state.formData.amount)}
                                        onChange={this.setField.bind(this, 'amount')}
                                    />
                                </Validator>
                            </FormItem>
                            <ReactIntl.FormattedMessage id="contract.155" defaultMessage="元" />
                            <Button
                                className="btn-primary-sure"
                                onClick={this.addPayment}
                            >
                                <ReactIntl.FormattedMessage id="sales.team.add.sales.team" defaultMessage={Intl.get('common.add', '添加')} />
                            </Button>
                        </Validation>
                    </Form>
                </div>
            </div>

        );
    },
});

module.exports = AddBuyPayment;


