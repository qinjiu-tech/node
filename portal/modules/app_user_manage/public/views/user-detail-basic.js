/**
 * Oplate.hideSomeItem 用来判断西语的运行环境
 * */
var React = require('react');
import { Alert, Icon } from 'antd';
import { Button as BootstrapButton, Modal as BootstrapModal } from 'react-bootstrap';
import UserStatusSwitch from './user-status-switch';
var AppUserDetailStore = require('../store/app-user-detail-store');
var AppUserStore = require('../store/app-user-store');
var AppUserDetailAction = require('../action/app-user-detail-actions');
var AppUserPanelSwitchActions = require('../action/app-user-panelswitch-actions');
var Spinner = require('CMP_DIR/spinner');
var DefaultUserLogoTitle = require('CMP_DIR/default-user-logo-title');
var PrivilegeChecker = require('CMP_DIR/privilege/checker').PrivilegeChecker;
var hasPrivilege = require('CMP_DIR/privilege/checker').hasPrivilege;
var AlertTimer = require('CMP_DIR/alert-timer');
var UserDetailEditField = require('CMP_DIR/basic-edit-field/input');
var AppUserUtil = require('../util/app-user-util');
var LAYOUT_CONSTANTS = AppUserUtil.LAYOUT_CONSTANTS;//右侧面板常量
var GeminiScrollbar = require('CMP_DIR/react-gemini-scrollbar');
var measureText = require('PUB_DIR/sources/utils/measure-text');
var Organization = require('./v2/organization');
import UserCustomer from 'CMP_DIR/user_manage_components/user-customer';
import { getPassStrenth, passwordRegex } from 'CMP_DIR/password-strength-bar';
var UserDetailFieldSwitch = require('./user-detail-field-switch');
var language = require('PUB_DIR/language/getLanguage');
var AppUserAjax = require('../ajax/app-user-ajax');
import DetailCard from 'CMP_DIR/detail-card';
import { DetailEditBtn } from 'CMP_DIR/rightPanel';
import CustomerSuggest from 'MOD_DIR/app_user_manage/public/views/customer_suggest/customer_suggest';
import UserBasicCard from './user-basic/user-basic-card';
import OrgCard from './user-basic/org-card';
import ContactCard from './user-basic/contact-card';
import { secondsToHourMinuteSecond } from '../../../../public/sources/utils/time-format-util';
import StatusWrapper from 'CMP_DIR/status-wrapper';
const FORMAT = oplateConsts.DATE_FORMAT;

var UserDetailBasic = React.createClass({
    getDefaultProps: function() {
        return {
            userId: '1'
        };
    },
    getInitialState: function() {
        return this.getStateData();
    },
    onStateChange: function() {
        this.setState(this.getStateData());
    },
    getStateData: function() {
        return AppUserDetailStore.getState();
    },
    componentDidMount: function() {
        AppUserDetailStore.listen(this.onStateChange);
        if (!this.props.userId) return;
        AppUserDetailAction.getUserDetail(this.props.userId);
        if (this.props.getBasicInfo) {
            const userInfo = {
                data: null,
                loading: true,
                errorMsg: ''
            };
            this.props.getBasicInfo(userInfo);
        }
    },
    componentDidUpdate: function(prevProps, prevState) {
        var newUserId = this.props.userId;
        if (prevProps.userId !== newUserId && newUserId) {
            setTimeout(function() {
                AppUserDetailAction.dismiss();
                AppUserDetailAction.getUserDetail(newUserId);
            }, 0);
        }
        const statusChanged = prevState.isLoading !== this.state.isLoading;
        if (this.props.getBasicInfo && statusChanged) {
            const userInfo = {
                data: this.state.initialUser.user,
                loading: this.state.isLoading,
                errorMsg: this.state.getDetailErrorMsg
            };
            this.props.getBasicInfo(userInfo);
        }
    },
    retryGetDetail: function() {
        var userId = this.props.userId;
        if (!userId) return;
        setTimeout(function() {
            AppUserDetailAction.dismiss();
            AppUserDetailAction.getUserDetail(userId);
        }, 0);
    },
    componentWillUnmount: function() {
        AppUserDetailStore.unlisten(this.onStateChange);
        setTimeout(() => {
            AppUserDetailAction.dismiss();
        });
    },
    checkPhone: function(rule, value, callback) {
        if ((/^1[3|4|5|7|8][0-9]\d{8}$/.test(value)) ||
            (/^\d{3,4}\-\d{7,8}$/.test(value)) ||
            (/^400\-?\d{3}\-?\d{4}$/.test(value))) {
            callback();
        } else {
            callback(new Error(Intl.get('common.input.correct.phone', '请输入正确的电话号码')));
        }
    },
    showDisableAllAppsModal: function(e) {
        Trace.traceEvent(e,'全部停用');
        AppUserDetailAction.showDisableAllAppsModal();
        return e.stopPropagation();
    },
    cancelAllAppsModal: function(e) {
        Trace.traceEvent(e,'点击取消全部停用的按钮');
        AppUserDetailAction.cancelAllAppsModal();
        return e.stopPropagation();
    },
    submitDisableAllApps: function(e) {
        Trace.traceEvent(e,'点击确定全部停用的按钮');
        AppUserDetailAction.cancelAllAppsModal();
        AppUserDetailAction.submitDisableAllApps({
            user_id: this.props.userId,
        }, (user_id) => {
            //发送更新用户列表的事件，将某一个用户的全部应用设置为禁用
            AppUserUtil.emitter.emit(AppUserUtil.EMITTER_CONSTANTS.UPDATE_DISABLE_ALL_APPS, {
                user_id: user_id
            });
        });
        return e.stopPropagation();
    },
    getDisableAllAppsBlock: function() {
        if (this.state.modalStatus.disable_all.loading) {
            return (
                <Icon type="loading" />
            );
        }
        if (this.state.modalStatus.disable_all.success) {
            var hide = AppUserDetailAction.hideDisableSuccessMsg;
            return (
                <AlertTimer
                    message={Intl.get('user.all.stop.success', '全部停用成功')}
                    type="success"
                    showIcon
                    time={3000}
                    onHide={hide}
                />
            );
        }
        if (this.state.modalStatus.disable_all.errorMsg) {
            var retry = (
                <span>{this.state.modalStatus.disable_all.errorMsg}，<a href="javascript:void(0)"
                    onClick={this.showDisableAllAppsModal}><ReactIntl.FormattedMessage
                        id="common.retry" defaultMessage="重试" /></a></span>
            );
            return (
                <Alert
                    message={retry}
                    type="error"
                    showIcon={true}
                />
            );
        }
        return (
            <PrivilegeChecker
                check="USER_BATCH_OPERATE"
                tagName="a"
                className="a_button"
                href="javascript:void(0)"
                onClick={this.showDisableAllAppsModal}
                title={Intl.get('user.app.all.stop', '停用该用户的全部应用')}
            >
                <ReactIntl.FormattedMessage id="user.all.stop" defaultMessage="全部停用" />
            </PrivilegeChecker>
        );
    },
    //显示app的面板
    showAddAppPanel: function(e) {
        Trace.traceEvent(e,'添加应用');
        AppUserPanelSwitchActions.switchToAddAppPanel();
        //向左滑动面板
        AppUserUtil.emitter.emit(AppUserUtil.EMITTER_CONSTANTS.PANEL_SWITCH_LEFT);
    },
    editSingleApp: function(app, e) {
        Trace.traceEvent(e,'修改应用的配置信息');
        AppUserPanelSwitchActions.switchToEditAppPanel(app);
        //向左滑动面板
        AppUserUtil.emitter.emit(AppUserUtil.EMITTER_CONSTANTS.PANEL_SWITCH_LEFT);
    },
    //获取用户类型文本
    getUserTypeText: function(app) {
        var user_type_value = app.user_type;
        var user_type_text = AppUserUtil.getUserTypeText(user_type_value);
        return user_type_text;
    },
    //修改单个字段成功
    onFieldChangeSuccess: function(result) {
        AppUserUtil.emitter.emit(AppUserUtil.EMITTER_CONSTANTS.UPDATE_APP_FIELD, result);
        AppUserDetailAction.changeAppFieldSuccess(result);
    },
    renderMultiLogin: function(app, readOnly) {
        var multilogin = /^[10]$/.test((app.multilogin + '')) ? app.multilogin + '' : '';
        if (!hasPrivilege('APP_USER_EDIT')) {
            return multilogin ? (multilogin === '1' ? Intl.get('common.app.status.open', '开启') : Intl.get('common.app.status.close', '关闭')) : multilogin;
        }
        if (!multilogin) {
            return multilogin;
        } else if (readOnly) {
            return multilogin === '1' ?
                Intl.get('user.open.code', '开') : Intl.get('user.close.code', '关');
        }
        return <UserDetailFieldSwitch
            userId={this.props.userId}
            appId={app.app_id}
            originValue={multilogin}
            checkedValue="1"
            unCheckedValue="0"
            checkedSubmitValue="1"
            unCheckedSubmitValue="0"
            checkedChildren={Intl.get('user.open.code', '开')}
            unCheckedChildren={Intl.get('user.close.code', '关')}
            field="mutilogin"
            onSubmitSuccess={this.onFieldChangeSuccess}
        />;
    },
    renderIsTwoFactor: function(app, readOnly) {
        var is_two_factor = /^[10]$/.test((app.is_two_factor + '')) ? app.is_two_factor + '' : '';
        if (!hasPrivilege('APP_USER_EDIT')) {
            return is_two_factor ? (is_two_factor === '1' ? Intl.get('common.app.status.open', '开启') : Intl.get('common.app.status.close', '关闭')) : is_two_factor;
        }
        if (!is_two_factor) {
            return is_two_factor;
        } else if (readOnly) {
            return is_two_factor === '1' ? Intl.get('user.open.code', '开') : Intl.get('user.close.code', '关');
        }
        return <UserDetailFieldSwitch
            userId={this.props.userId}
            appId={app.app_id}
            originValue={is_two_factor}
            checkedValue="1"
            unCheckedValue="0"
            checkedSubmitValue="1"
            unCheckedSubmitValue="0"
            checkedChildren={Intl.get('user.open.code', '开')}
            unCheckedChildren={Intl.get('user.close.code', '关')}
            field="is_two_factor"
            onSubmitSuccess={this.onFieldChangeSuccess}
        />;
    },
    renderOverDraft: function(app) {
        var over_draft = /^[210]$/.test((app.over_draft + '')) ? app.over_draft + '' : '1';
        if (over_draft === '0') {
            return Intl.get('user.status.immutability', '不变');
        } else if (over_draft === '1') {
            return Intl.get('user.status.stop', '停用');
        } else if (over_draft === '2') {
            return Intl.get('user.status.degrade', '降级');
        }

    },
    renderStatus: function(app) {
        var is_disabled = app.is_disabled;
        if (typeof is_disabled === 'boolean') {
            is_disabled = is_disabled.toString();
        }
        if (!hasPrivilege('APP_USER_EDIT')) {
            return is_disabled ? (is_disabled === 'true' ? Intl.get('common.app.status.close', '关闭') : Intl.get('common.app.status.open', '开启')) : is_disabled;
        }
        if (!is_disabled) {
            return '';
        }
        return <UserDetailFieldSwitch
            userId={this.props.userId}
            appId={app.app_id}
            originValue={is_disabled}
            checkedValue="false"
            unCheckedValue="true"
            checkedSubmitValue="1"
            unCheckedSubmitValue="0"
            checkedChildren={Intl.get('common.enabled', '启用')}
            unCheckedChildren={Intl.get('user.status.stop', '停用')}
            field="status"
            onSubmitSuccess={this.onFieldChangeSuccess}
        />;
    },
    renderAppInfo: function(app) {
        var start_time = moment(new Date(+app.start_time)).format(FORMAT);
        var end_time = moment(new Date(+app.end_time)).format(FORMAT);
        var establish_time = moment(new Date(+app.create_time)).format(FORMAT);
        var displayStartTime = '', displayEndTime = '', displayEstablishTime = '';
        if (app.start_time === '0') {
            displayStartTime = Intl.get('user.nothing', '无');
        } else if (start_time === 'Invalid date') {
            displayStartTime = Intl.get('common.unknown', '未知');
        } else {
            displayStartTime = start_time;
        }
        if (app.end_time === '0') {
            displayEndTime = Intl.get('user.nothing', '无');
        } else if (end_time === 'Invalid date') {
            displayEndTime = Intl.get('common.unknown', '未知');
        } else {
            displayEndTime = end_time;
        }
        if (app.create_time === '0') {
            displayEstablishTime = Intl.get('user.nothing', '无');
        } else if (establish_time === 'Invalid date') {
            displayEstablishTime = Intl.get('common.unknown', '未知');
        } else {
            displayEstablishTime = establish_time;
        }
        return (
            <div className="rows-3">
                <div className={(!app.showDetail && app.is_disabled === 'true') ? 'hide' : 'app-prop-list'}>
                    <span><ReactIntl.FormattedMessage id="user.time.start"
                        defaultMessage="开通时间" />：{displayEstablishTime}</span>
                    {!Oplate.hideSomeItem && <span><ReactIntl.FormattedMessage id="user.user.type"
                        defaultMessage="用户类型" />：{this.getUserTypeText(app)}</span>}
                    <span><ReactIntl.FormattedMessage id="user.start.time"
                        defaultMessage="启用时间" />：{displayStartTime}</span>
                    <span><ReactIntl.FormattedMessage id="user.expire.status"
                        defaultMessage="到期状态" />：{this.renderOverDraft(app)}</span>
                    <span><ReactIntl.FormattedMessage id="user.time.end" defaultMessage="到期时间" />：{displayEndTime}</span>
                    {!Oplate.hideSomeItem && <span><ReactIntl.FormattedMessage id="user.multi.login"
                        defaultMessage="多人登录" />：{this.renderMultiLogin(app, true)}</span>}
                    {/* <span><ReactIntl.FormattedMessage id="common.app.status"
                        defaultMessage="开通状态" />：{this.renderStatus(app)}</span> */}
                    {!Oplate.hideSomeItem && <span><ReactIntl.FormattedMessage id="user.two.step.certification"
                        defaultMessage="二步认证" />：{this.renderIsTwoFactor(app, true)}</span>}
                </div>
            </div>
        );
    },
    showAppDetail: function(params) {
        AppUserDetailAction.showAppDetail(params);
    },
    //获取应用列表段
    getAppsBlock: function() {
        var _this = this;
        var maxWidthApp = _.maxBy(this.state.initialUser.apps, function(app) {
            return measureText.measureTextWidth(app.app_name, 12);
        });
        var maxWidth = 0;
        if (maxWidthApp) {
            maxWidth = measureText.measureTextWidth(maxWidthApp.app_name, 12);
            //padding 5
            maxWidth += 10;
            //padding 5 img 52
            if (maxWidth < (52 + 10)) {
                maxWidth = 62;
            }
        }
        if (maxWidth > 160) {
            maxWidth = 160;
        }
        var LAYOUTS = {
            ITEM_WIDTH: 588,
            MARGIN_LEFT: 25
        };
        var despWidth = '';
        var className = 'logo';
        if (language.lan() === 'es' || language.lan() === 'en') {
            despWidth = '89%';
        } else if (language.lan() === 'zh') {
            className += ' pull-left';
            despWidth = LAYOUTS.ITEM_WIDTH - LAYOUTS.MARGIN_LEFT - maxWidth - 5;
        }
        let selectApp = this.props.selectApp;
        return (
            <ul className="app_list">
                {this.state.initialUser.apps.map(app => {
                    const hideDetail = !app.showDetail && app.is_disabled === 'true';
                    return (
                        <li className={hideDetail ? 'clearfix list-unstyled hide-detail' : 'clearfix list-unstyled'} key={app.app_id}>
                            <div className="title-container">
                                <span className="logo-container" title={app.app_name}>
                                    <DefaultUserLogoTitle
                                        nickName={app.app_name}
                                        userLogo={app.app_logo}
                                    />
                                </span>
                                <p title={app.app_name}>{app.app_name}</p>
                                <span className="icon-suffix">

                                </span>
                                <span className="btn-bar">
                                    {
                                        app.is_disabled === 'true' ?
                                            <span className="collapse-btn">
                                                {
                                                    app.showDetail ?
                                                        <span onClick={() => this.showAppDetail({ app, isShow: false })}>{Intl.get('user.detail.tip.collapse', '收起停用前设置')}</span> :
                                                        <span onClick={() => this.showAppDetail({ app, isShow: true })}>{Intl.get('user.detail.tip.expand', '展开停用前设置')}</span>
                                                }
                                            </span> :
                                            null
                                    }
                                    {this.renderStatus(app)}
                                </span>
                            </div>
                            <div className="desp pull-left">
                                {
                                    _this.renderAppInfo(app)
                                }
                            </div>

                            {
                                !hideDetail ?
                                    <PrivilegeChecker
                                        check="APP_USER_EDIT"
                                        tagName="div"
                                        className="operate"
                                    >
                                        <a href="javascript:void(0)"
                                            onClick={_this.editSingleApp.bind(_this, app)}
                                            title={Intl.get('user.app.change', '变更应用')}>
                                            <span className="iconfont icon-guanli"></span>
                                        </a>
                                    </PrivilegeChecker> : null
                            }
                        </li>
                    );
                })}
            </ul>
        );
    },
    renderAddAppBtn: function() {
        //所有应用列表
        var allApps = AppUserStore.getState().appList || [];
        //已经添加的应用
        var existApps = this.state.initialUser.apps || [];
        //已经添加的应用id数组
        var existAppIds = _.map(existApps, 'app_id');
        //剩余没有添加的应用
        var leftApps = _.filter(allApps, (app) => {
            return existAppIds.indexOf(app.app_id) < 0;
        });
        return (
            leftApps.length ? (
                <PrivilegeChecker
                    check="APP_USER_ADD"
                    tagName="a"
                    className="a_button"
                    href="javascript:void(0)"
                    onClick={this.showAddAppPanel}>
                    <ReactIntl.FormattedMessage id="common.add.app" defaultMessage="添加应用" />
                </PrivilegeChecker>
            ) : null
        );
    },
    userBelongChange: function({ tag, customer_id, customer_name, sales_id, sales_name, sales_team_id, sales_team_name }) {
        //更改用户所属
        AppUserDetailAction.changeUserBelong({
            tag,
            customer_id,
            customer_name,
            sales_id,
            sales_name,
            sales_team_id,
            sales_team_name
        });
        //不更新用户列表，只是更新客户信息
        var user_id = this.props.userId;
        AppUserUtil.emitter.emit(AppUserUtil.EMITTER_CONSTANTS.UPDATE_CUSTOMER_INFO, {
            tag,
            customer_id,
            customer_name,
            user_id,
            sales_id,
            sales_name
        });
    },
    //修改单个字段成功
    changeUserFieldSuccess: function(userObj) {
        AppUserDetailAction.changeUserFieldSuccess(userObj);
        //更新用户基本信息
        AppUserUtil.emitter.emit(AppUserUtil.EMITTER_CONSTANTS.UPDATE_USER_INFO, userObj);
    },
    //修改组织成功
    organizationChangeSuccess: function({ organization_id, organization_name }) {
        AppUserDetailAction.changeUserOrganization({
            group_id: organization_id,
            group_name: organization_name
        });
    },
    userCustomerChangeSuccess: function(customerObj) {
        AppUserDetailAction.changeCustomer(customerObj);
        //更新用户客户信息
        AppUserUtil.emitter.emit(AppUserUtil.EMITTER_CONSTANTS.UPDATE_CUSTOMER_INFO, customerObj);
    },
    onPasswordDisplayTypeChange: function(type) {
        if (type === 'edit') {
            this.setState({ isConfirmPasswordShow: true });
        } else {
            this.setState({ isConfirmPasswordShow: false });
        }
    },
    onPasswordValueChange: function() {
        const confirmPassword = this.refs.confirmPassword;
        if (confirmPassword && confirmPassword.state.formData.input) {
            confirmPassword.refs.validation.forceValidate();
        }
    },
    onConfirmPasswordDisplayTypeChange: () => {
        this.setState({ isConfirmPasswordShow: false });
        this.refs.password.setState({ displayType: 'text' });
    },

    //对密码 进行校验
    checkPass(rule, value, callback) {
        if (value && value.match(passwordRegex)) {
            let passStrength = getPassStrenth(value);
            this.refs.password.setState({ passStrength: passStrength });
            callback();
        } else {
            this.refs.password.setState({
                passStrength: {
                    passBarShow: false,
                    passStrength: 'L'
                }
            });
            callback(Intl.get('common.password.validate.rule', '请输入6-18位数字、字母、符号组成的密码'));
        }
    },
    //对确认密码 进行校验
    checkRePass(rule, value, callback) {
        if (value && value === this.refs.password.state.formData.input) {
            callback();
        } else {
            callback(Intl.get('common.password.unequal', '两次输入密码不一致！'));
        }
    },

    renderUserStatus: function(user, useIcon = false) {
        let userStatus = user && user.status;
        if (!hasPrivilege('APP_USER_EDIT')) {
            return userStatus === '1' ? Intl.get('common.enabled', '启用') : Intl.get('common.stop', '停用');
        }
        return (<UserStatusSwitch useIcon={useIcon} userId={_.get(user, 'user_id')} status={userStatus === '1' ? true : false} />);
    },
    render: function() {
        var LoadingBlock = this.state.isLoading ? (
            <Spinner />
        ) : null;
        var _this = this;
        var ErrorBlock = (function() {
            if (_this.state.getDetailErrorMsg) {
                var retry = (
                    <span>{_this.state.getDetailErrorMsg}，<a href="javascript:void(0)"
                        onClick={_this.retryGetDetail}><ReactIntl.FormattedMessage
                            id="common.retry" defaultMessage="重试" /></a></span>
                );
                return (
                    <div className="get_detail_error_tip">
                        <Alert
                            message={retry}
                            type="error"
                            showIcon={true}
                        />
                    </div>
                );
            }
            return null;
        })();
        let userInfo = this.state.initialUser.user;
        var DetailBlock = !this.state.isLoading && !this.state.getDetailErrorMsg ? (
            <div className='user-detail-baisc-v3'>
                <UserBasicCard
                    customer_id={this.state.customer_id}
                    customer_name={this.state.customer_name}
                    sales_id={this.state.initialUser.sales.sales_id}
                    sales_name={this.state.initialUser.sales.sales_name}
                    sales_team_id={this.state.initialUser.sales_team.sales_team_id}
                    sales_team_name={this.state.initialUser.sales_team.sales_team_name}
                    onChangeSuccess={this.userCustomerChangeSuccess}
                    user_id={userInfo.user_id}
                />
                <ContactCard
                    id={userInfo.user_id}
                    userInfo={this.state.initialUser.user}
                    phone={{
                        value: userInfo.phone,
                        field: 'phone',
                        type: 'text',
                        disabled: hasPrivilege('APP_USER_EDIT') ? false : true,
                        validators: [{ validator: this.checkPhone }],
                        placeholder: Intl.get('user.input.phone', '请输入手机号'),
                        title: Intl.get('user.phone.set.tip', '修改手机号')
                    }}
                    email={{
                        value: userInfo.email,
                        field: 'email',
                        type: 'text',
                        disabled: hasPrivilege('APP_USER_EDIT') ? false : true,
                        validators: [{
                            type: 'email',
                            required: true,
                            message: Intl.get('common.correct.email', '请输入正确的邮箱')
                        }],
                        placeholder: Intl.get('member.input.email', '请输入邮箱'),
                        title: Intl.get('user.email.set.tip', '修改邮箱')
                    }}
                    saveEditInput={AppUserAjax.editAppUser}
                />
                <OrgCard
                    user_id={userInfo.user_id}
                    showBtn={true}
                    organization_id={userInfo.group_id}
                    organization_name={userInfo.group_name}
                    onModifySuccess={this.organizationChangeSuccess}
                    userInfo={this.state.initialUser.user}
                    sales_team={this.state.initialUser.sales_team}
                />
                <div className="app_wrap" ref="app_wrap"> 
                    <DetailCard
                        title={(<div className="sales-team-show-block">
                            <div className="sales-team">
                                <span className="sales-team-label">
                                    <ReactIntl.FormattedMessage id="user.batch.app.open" defaultMessage="开通产品" />
                                </span>
                                <div className="add_app_btns">
                                    {this.renderAddAppBtn()}
                                </div>
                            </div>
                        </div>)}
                        content={this.getAppsBlock()}
                    />
                </div>
                <BootstrapModal
                    show={this.state.modalStatus.disable_all.showModal}
                    onHide={this.cancelAllAppsModal}
                    container={this}
                    aria-labelledby="contained-modal-title"
                >
                    <BootstrapModal.Header closeButton>
                        <BootstrapModal.Title />
                    </BootstrapModal.Header>
                    <BootstrapModal.Body>
                        <p>
                            {Intl.get('user.account.disable.sure', '确认禁用账号吗')}
                            ?</p>
                    </BootstrapModal.Body>
                    <BootstrapModal.Footer>
                        <BootstrapButton className="btn-ok"
                            onClick={this.submitDisableAllApps}><ReactIntl.FormattedMessage
                                id="common.sure" defaultMessage="确定" /></BootstrapButton>
                        <BootstrapButton className="btn-cancel"
                            onClick={this.cancelAllAppsModal}><ReactIntl.FormattedMessage
                                id="common.cancel" defaultMessage="取消" /></BootstrapButton>
                    </BootstrapModal.Footer>
                </BootstrapModal>
            </div>
        ) : null;

       
        return (
            <StatusWrapper
                loading={this.state.isLoading}
            >
                <div style={{ height: this.props.height }}>                
                    <GeminiScrollbar>
                        {ErrorBlock}
                        {DetailBlock}
                    </GeminiScrollbar>
                </div>
            </StatusWrapper>
        );
    }
});

module.exports = UserDetailBasic;
