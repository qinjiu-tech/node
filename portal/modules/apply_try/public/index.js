import RightPanelModal from 'CMP_DIR/right-panel-modal';
import {Input,Button,Form,Radio, InputNumber} from 'antd';
import AlertTimer from 'CMP_DIR/alert-timer';
import applyTryAjax from './ajax/applyTryAjax';
import {userScales} from './util/apply_try_const';
import OperateSuccessTip from 'CMP_DIR/operate-success-tip';
import { validatorNameRuleRegex} from 'PUB_DIR/sources/utils/validate-util';
const Spinner = require('CMP_DIR/spinner');
require('./css/index.less');

const USER_SCALES_COUNT = 100000;

class Index extends React.Component {
    state={
        successFlag: false,
        userScales: '',
        saveResult: '',
        showLoading: false,
    }

    static propTypes = {
        title: PropTypes.string,
        hideApply: PropTypes.func,
        versionKind: PropTypes.string,
        form: PropTypes.object,
        isShowModal: PropTypes.bool,
        versionKindName: PropTypes.string
    }

    onUserScalesChange = (e) => {
        if(_.isEmpty(_.get(e, 'target.value'))) {//值为空或者undefined时
            this.props.form.setFieldsValue({userScales: 1});
        }
    };

    userScalesValidate = (rule, value, callback) => {
        if(_.gt(value, USER_SCALES_COUNT)) {//使用人数不能超过10万人
            callback(new Error(Intl.get('payment.apply.trial.user.scales.count.limit', '使用人数不能超过{count}人', {count: USER_SCALES_COUNT})));
        }else {
            callback();
        }
    };

    handleApplyClick = () => {
        this.props.form.validateFields((err,values) => {
            if(err) return;
            if(this.state.showLoading) return;
            this.setState({
                showLoading: true
            });
            (this.props.versionKind && values.company) &&
            applyTryAjax.postApplyTry({
                company: values.company,
                user_scales: `${values.userScales}${Intl.get('versions.personal.number', '人')}`,
                version_kind: this.props.versionKind,
                version_kind_name: this.props.versionKindName,
                applicant_name: values.name,
            },() => {
                this.setState({
                    successFlag: true,
                    showLoading: false
                });
            },() => {
                this.setState({
                    saveResult: 'error',
                    showLoading: false
                });
            });
        });
    }

    handleClose = () => {
        this.props.hideApply();
    }
    hideErrorMsg = () => {
        this.setState({
            saveResult: ''
        });
    }

    renderApplyTryContent(){
        const { getFieldDecorator } = this.props.form;
        const saveResult = this.state.saveResult;
        const formLayout = {
            labelCol: {
                sm: {span: 4},
            },
            wrapperCol: {
                sm: {span: 20},
            },
        };
        const companyName = Intl.get('register.company.nickname','公司名称');
        const userName = Intl.get('common.name','姓名');
        return <div className='apply-try-content'>
            {this.state.successFlag ? this.renderApplyResult() : (
                <div className='apply-try-content-wrapper'>
                    <div className='apply-try-content-title'>{this.props.title || Intl.get('personal.apply.trial.enterprise.edition','申请试用企业版')}</div>
                    <Form>
                        <Form.Item
                            label={companyName}
                            className='apply-try-content-componey'
                            {...formLayout}
                            require
                        >
                            {getFieldDecorator('company', {
                                rules: [validatorNameRuleRegex(25, companyName)],
                            })(<Input className='apply-try-content-componey-input'/>)}
                        </Form.Item>
                        <Form.Item
                            label={userName}
                            className='apply-try-content-componey'
                            {...formLayout}
                        >
                            {getFieldDecorator('name', {
                                rules: [validatorNameRuleRegex(30, userName)],
                            })(<Input className='apply-try-content-componey-input'/>)}
                        </Form.Item> 
                        <Form.Item label={Intl.get('common.apply.try.user.scales','使用人数')} {...formLayout} require className="user-scales-container">
                            {getFieldDecorator('userScales', {
                                initialValue: 5,
                                rules: [{validator: this.userScalesValidate}]
                            })(
                                <InputNumber
                                    min={1}
                                    precision={0}
                                    onBlur={this.onUserScalesChange}
                                />
                            )}
                            <span className="user-personal">{Intl.get('versions.personal.number', '人')}</span>
                        </Form.Item>                       
                        <div className='apply-try-content-apply-btn-wrapper'>
                            <Button className='apply-try-content-apply-btn' 
                                type="primary" 
                                data-tracename='申请试用'
                                loading={this.state.showLoading}
                                onClick={this.handleApplyClick}>{Intl.get('home.page.apply.type','申请')}</Button>
                        </div>
                    </Form>
                    {
                        saveResult ? 
                            <AlertTimer time={3000}
                                message={Intl.get('common.apply.failed','申请失败')}
                                type={saveResult} showIcon
                                onHide={saveResult === 'error' && this.hideErrorMsg}/> : null
                    }
                </div>
            )}
        </div>;
    }
    renderApplyResult(){
        return <OperateSuccessTip
            isShowBtn={false}
            title={Intl.get('user.apply.success','申请成功')}
            tip={Intl.get('common.apply.try.success.tip','稍后会有客户经理专门为您服务')}
        />;
    }
    renderApplyTry(){
        return<RightPanelModal
            content={this.renderApplyTryContent()}
            width='300'
            onClosePanel={this.handleClose}
            dataTracename='申请试用界面'
            isShowMadal={this.props.isShowModal}
            isShowCloseBtn={true}/>;
    }
    render() {
        return <div className='apply-try-wrapper'>
            {this.renderApplyTry()}
        </div>;
    }
}
Index.defaultProps = {
    title: Intl.get('personal.apply.trial.enterprise.edition','申请试用企业版'),
    isShowModal: true,
    versionKindName: Intl.get('versions.enterprise','企业版'),
    versionKind: 'enterprise',
    hideApply: function(){}
};
export default Form.create()(Index);