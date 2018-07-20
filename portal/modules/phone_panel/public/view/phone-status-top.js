/**
 * Copyright (c) 2015-2018 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2015-2018 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by zhangshujuan on 2018/5/23.
 */
import {Button, Tag, Select} from 'antd';
const Option = Select.Option;
const TAG_COLOR = '#2196f3';
import Trace from 'LIB_DIR/trace';
var phoneAlertAction = require('../action/phone-alert-action');
var phoneAlertStore = require('../store/phone-alert-store');
var CrmAction = require('MOD_DIR/crm/public/action/crm-actions');
var AlertTimer = require('CMP_DIR/alert-timer');
import {PHONERINGSTATUS, commonPhoneDesArray} from '../consts';
class phoneStatusTop extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedCustomerId: '',//跟进记录要绑定的客户
            addTraceItemId: '',//添加某条跟进记录的id
            isConnected: false,//电话是否接通
            detailCustomerId: this.props.detailCustomerId,//客户详情中打电话时，客户的id
            phonemsgObj: this.props.phonemsgObj,
            customerInfoArr: phoneAlertStore.getState().customerInfoArr,
            isEdittingTrace: phoneAlertStore.getState().isEdittingTrace,
            submittingTraceMsg: phoneAlertStore.getState().submittingTraceMsg,
            inputContent: phoneAlertStore.getState().inputContent,
            showAddFeedback: false,//是否展示反馈
            isAddingMoreProdctInfo: this.props.isAddingMoreProdctInfo
        };
    }

    componentDidMount() {
        phoneAlertStore.listen(this.onStoreChange);
    }

    onStoreChange = () => {
        this.setState(phoneAlertStore.getState());
    };

    componentWillUnmount() {
        this.setInitialData();
        phoneAlertStore.unlisten(this.onStoreChange);
    }

    componentWillReceiveProps(nextProps) {
        var phonemsgObj = nextProps.phonemsgObj;
        this.setState({
            detailCustomerId: nextProps.detailCustomerId,
            phonemsgObj: phonemsgObj,
            isAddingMoreProdctInfo: nextProps.isAddingMoreProdctInfo
        });
        //如果接听后，把状态isConnected 改为true
        if (phonemsgObj.type === PHONERINGSTATUS.ANSWERED) {
            this.setState({
                isConnected: true
            });
        }
        var $modal = $('#phone-status-content');
        if ($modal && $modal.length > 0 && phonemsgObj.type === PHONERINGSTATUS.ALERT) {
            this.setInitialData(phonemsgObj);
        }
    }

    setInitialData() {
        this.setState({
            isConnected: false,
            // addTraceItemId: "",
            selectedCustomerId: '',
            showAddFeedback: false,//是否展示反馈
        });
    }

    handleEditContent = () => {
        Trace.traceEvent($(ReactDOM.findDOMNode(this)).find('.icon-update'), '点击编辑跟进记录按钮');
        phoneAlertAction.setEditStatus({isEdittingTrace: true, submittingTraceMsg: ''});
    };
    //获取添加跟进记录的客户id
    getSaveTraceCustomerId() {
        let customerInfoArr = this.state.customerInfoArr;
        //默认保存到获取的客户列表中的第一个客户上
        let customer_id = _.isArray(customerInfoArr) && customerInfoArr[0] ? customerInfoArr[0].id : '';
        //从客户详情中打电话时，跟进记录直接加到当前详情中展示的客户上
        if (this.state.detailCustomerId) {
            customer_id = this.state.detailCustomerId;
        } else if (this.state.selectedCustomerId) {//该电话对应多个客户时，将跟进记录加到选择的客户上
            customer_id = this.state.selectedCustomerId;
        }
        return customer_id;
    }

    //提交跟进记录
    handleTraceSubmit = () => {
        let customer_id = this.getSaveTraceCustomerId();
        //跟进记录的id，只有当通话结束后(type=phone时)，推送过来的数据中才会有id
        let trace_id = this.state.phonemsgObj && this.state.phonemsgObj.id;
        if (!customer_id) return;
        if (!trace_id) {
            phoneAlertAction.setSubmitErrMsg(Intl.get('phone.delay.save', '通话记录正在同步，请稍等再保存！'));
            return;
        }
        const submitObj = {
            id: trace_id,
            customer_id: customer_id,
            last_callrecord: 'true',
            remark: this.state.inputContent
        };
        phoneAlertAction.updateCustomerTrace(submitObj, () => {
            let updateData = {customer_id: customer_id, remark: this.state.inputContent};
            if (this.state.isConnected) {
                //如果电话已经接通
                updateData.last_contact_time = new Date().getTime();
            }
            CrmAction.updateCurrentCustomerRemark(updateData);
            this.setState({
                selectedCustomerId: '',
                isConnected: false,
                showAddFeedback: true
            });
        });
    };
    //将输入框中的文字放在state上
    handleInputChange = (value) => {
        phoneAlertAction.setContent(value);
    };
    handleSelectCustomer = (customerId) => {
        this.setState({
            selectedCustomerId: customerId
        });
    };

    renderTraceItem(phonemsgObj) {
        var onHide = function() {
            phoneAlertAction.setSubmitErrMsg('');
        };
        const options = this.state.customerInfoArr.map((item) => (
            <Option value={item.id} key={item.id}>{item.name}</Option>
        ));
        //通话记录的编辑状态
        if (this.state.isEdittingTrace) {
            return (
                <div>
                    <div className="input-item">
                        <Select combobox
                            searchPlaceholder={Intl.get('phone.status.record.content', '请填写本次跟进内容')}
                            onChange={this.handleInputChange}
                            value={this.state.inputContent}
                            getPopupContainer={() => document.getElementById('phone-alert-modal-inner')}
                        >
                            {
                                _.isArray(commonPhoneDesArray) ?
                                    commonPhoneDesArray.map((Des, idx) => {
                                    //如果电话已经接通，不需要展示 “未接通这个提示”
                                        if (phonemsgObj.billsec > 0 && idx === 0){
                                            return;
                                        }
                                        return (<Option key={idx} value={Des}>{Des}</Option>);
                                    }) : null
                            }
                        </Select>
                    </div>
                    <div className="modal-submit-tip">
                        {this.state.submittingTraceMsg ? (
                            <AlertTimer time={3000}
                                message={this.state.submittingTraceMsg}
                                type="error" showIcon
                                onHide={onHide}
                            />
                        ) : null}
                    </div>
                    <div className="btn-select-container">
                        {/*如果获取到的客户不止一个，要手动选择要关联的客户*/}
                        {this.state.customerInfoArr.length > 1 ?
                            <div className="select-add-trace-customer">
                                {Intl.get('phone.alert.select.customer', '请选择要跟进的客户')}：
                                <Select
                                    defaultValue={this.state.customerInfoArr[0].id}
                                    dropdownMatchSelectWidth={false}
                                    onChange={this.handleSelectCustomer}
                                >
                                    {options}
                                </Select>

                            </div> : null}
                        <Button className="modal-submit-btn" onClick={this.handleTraceSubmit}
                            data-tracename="保存跟进记录">
                            {this.state.submittingTrace ? (Intl.get('retry.is.submitting', '提交中...')) : (Intl.get('common.save', '保存'))}
                        </Button>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="trace-content">
                    <span>{this.state.inputContent}</span>
                    <i className="iconfont icon-update" onClick={this.handleEditContent}></i>
                </div>
            );
        }
    }

    //获取页面上的描述
    getPhoneTipMsg(phonemsgObj) {
        //拨号的描述
        //如果是系统内拨号，展示联系人和电话，如果是从座机拨号，只展示所拨打的电话
        var phoneNum = this.props.contactNameObj && this.props.contactNameObj.contact ? this.props.contactNameObj.contact + '-' : '';
        if (phonemsgObj.call_type === 'IN') {
            phoneNum += phonemsgObj.extId;
            if (phonemsgObj.type === PHONERINGSTATUS.phone || phonemsgObj.type === PHONERINGSTATUS.call_back) {
                phoneNum += phonemsgObj.dst;
            }
        } else {
            phoneNum += phonemsgObj.to || phonemsgObj.dst;
        }
        var desTipObj = {
            phoneNum: phoneNum,
            tip: ''
        };
        if (phonemsgObj.type === PHONERINGSTATUS.ALERT) {
            if (phonemsgObj.call_type === 'IN') {
                desTipObj.tip = `${Intl.get('call.record.call.in.pick.phone', '有电话打入，请拿起话机')}`;
            } else {
                desTipObj.tip = `${Intl.get('call.record.phone.alerting', '已振铃，等待对方接听')}`;
            }
        } else if (phonemsgObj.type === PHONERINGSTATUS.ANSWERED) {
            desTipObj.tip = `${Intl.get('call.record.phone.answered', '正在通话中')}`;
        } else if (phonemsgObj.type === PHONERINGSTATUS.phone || phonemsgObj.type === PHONERINGSTATUS.call_back) {
            desTipObj.tip = `${Intl.get('call.record.phone.unknown', '结束通话')}`;
        }
        return desTipObj;
    }

    //点击添加产品反馈
    handleAddProductFeedback = () => {
        this.props.handleAddProductFeedback();
    };

    render() {
        var iconFontCls = 'modal-icon iconfont';
        var phonemsgObj = this.state.phonemsgObj;
        if (phonemsgObj.type === PHONERINGSTATUS.ALERT) {
            if (phonemsgObj.call_type === 'OU') {
                iconFontCls += ' icon-callrecord-out';
            } else if (phonemsgObj.call_type === 'IN') {
                iconFontCls += ' icon-callrecord-in';
            }
        } else if (phonemsgObj.type === PHONERINGSTATUS.ANSWERED) {
            iconFontCls += ' icon-phone-answering';
        } else if (phonemsgObj.type === PHONERINGSTATUS.phone || phonemsgObj.type === PHONERINGSTATUS.call_back) {
            iconFontCls += ' icon-phone-bye';
        }
        //获取页面描述
        var phoneDes = this.getPhoneTipMsg(phonemsgObj);
        return (
            <div className={this.props.phoneAlertModalTitleCls}>
                <div id="iconfont-tip">
                    <i className={iconFontCls}></i>
                </div>
                <div className="phone-status-tip">
                    <div className="contact-phone-title">
                        {phoneDes.phoneNum}
                    </div>
                    <div className="status-tip-title">
                        {phoneDes.tip}
                    </div>
                </div>
                <div className="trace-content-container">
                    { //通话结束后，并且该电话有对应的客户可以添加跟进记录时，展示添加跟进记录界面
                        (phonemsgObj.type === PHONERINGSTATUS.phone || phonemsgObj.type === PHONERINGSTATUS.call_back) && this.getSaveTraceCustomerId() ? this.renderTraceItem(phonemsgObj) : null
                    }
                </div>
                {!this.state.isAddingMoreProdctInfo && this.state.showAddFeedback ? (
                    <div className="add-more-info-container">
                        <Tag color={TAG_COLOR} onClick={this.handleAddProductFeedback}>
                            + {Intl.get('call.record.product.feedback', '产品反馈')}</Tag>
                    </div>
                ) : null}
            </div>
        );
    }
}
phoneStatusTop.defaultProps = {
    addMoreInfoCls: '',
    phoneAlertModalTitleCls: '',
    phonemsgObj: {},
    addTraceItemId: '',
    detailCustomerId: '',
    isAddingMoreProdctInfo: false,
    contactNameObj: {},
    handleAddProductFeedback: function() {}
};
phoneStatusTop.propTypes = {
    addMoreInfoCls: React.PropTypes.string,
    phoneAlertModalTitleCls: React.PropTypes.string,
    phonemsgObj: React.PropTypes.object,
    addTraceItemId: React.PropTypes.string,
    detailCustomerId: React.PropTypes.string,
    isAddingMoreProdctInfo: React.PropTypes.boolean,
    contactNameObj: React.PropTypes.object,
    handleAddProductFeedback: React.PropTypes.func,
};
export default phoneStatusTop;