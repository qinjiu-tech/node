/**
 * Copyright (c) 2015-2018 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2015-2018 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by zhangshujuan on 2019/4/26.
 */
import {RightPanel} from 'CMP_DIR/rightPanel';
import GeminiScrollbar from 'CMP_DIR/react-gemini-scrollbar';
import BasicData from 'MOD_DIR/clue_customer/public/views/right_panel_top';
import {Form, Input, Select, DatePicker, Button, Icon, Radio, Checkbox} from 'antd';
const RadioGroup = Radio.Group;
var Option = Select.Option;
const FormItem = Form.Item;
var classNames = require('classnames');
import PropTypes from 'prop-types';
const FORMLAYOUT = {
    PADDINGTOTAL: 60
};
import SaveCancelButton from 'CMP_DIR/detail-card/save-cancel-button';
import {
    INNER_SETTING_FLOW,
    APPROVER_TYPE,
    HIGHER_LEVEL,
    isSalesOpportunityFlow,
    isBussinessTripFlow,
    isLeaveFlow,
    SETTING_APPLY_APPROVER
} from '../../utils/apply-approve-utils';
require('../../style/add-apply-node.less');
class AddApplyNodePanel extends React.Component {
    constructor(props) {
        super(props);
        var isPreviousNodeCheck = this.isPreviousNodeCheck();
        this.state = {
            checkedRadioValue: '',
            //todo 可否可以多选
            higher_ups: {
                candidateUsers: '',//上级审批人
                showCandidateUsers: '',//显示的名称
                higherLevelApproveChecked: false,//空缺时由组织中的更上一级审批
                adminApproveChecked: false,//没有审批人的时候由管理员审批
            },
            setting_roles: {
                selectRole: '',//选中的角色
                showSelectRole: '',
            },
            setting_users: {
                selectUser: '',//选中的成员
                showSelectUser: ''
            },
            submitFiles: false,//可以上传文件
            assignNextNodeApprover: false,//指定下一审批人
            roleList: [],//角色列表
            userList: [],//用户列表
            submitErrorMsg: '',//提交时的错误提示
            isPreviousNodeCheck: isPreviousNodeCheck

        };
    }

    componentDidMount() {
        //获取用户列表
        this.getUserList();
    }

    getUserList = () => {
        $.ajax({
            url: '/rest/user',
            dataType: 'json',
            type: 'get',
            data: {cur_page: 1},
            success: (userListObj) => {
                this.setState({
                    userList: _.get(userListObj, 'data'),
                    roleList: _.get(userListObj, 'roles')
                });
            },
            error: (xhr, textStatus) => {
                this.setState({
                    roleList: [],
                    userList: []
                });
            }
        });
    };
    onRadioChange = (event) => {
        //把其他类型的下面的选项都置为空
        var radioValue = event.target.value;
        var allRadioSelect = [];
        _.forEach(APPROVER_TYPE, (item) => {
            if (item.value && item.value !== radioValue) {
                allRadioSelect.push(item.value);
            }
        });
        _.forEach(allRadioSelect, (item) => {
            var radioType = this.state[item];
            for (var key in radioType) {
                if (_.isBoolean(radioType[key])) {
                    radioType[key] = false;
                } else {
                    radioType[key] = '';
                }
            }
        });
        var checkedRadioValue = this.state.checkedRadioValue;
        this.setState({
            checkedRadioValue: radioValue
        });
    };
    onChangeSubmitFilesCheck = (e) => {
        this.setState({
            submitFiles: e.target.checked,
        });
    };
    onChangeAssignNextNodeApprover = (e) => {
        this.setState({
            assignNextNodeApprover: e.target.checked,
        });
    };
    handleHigherUpChange = (value) => {
        var higher_ups = this.state.higher_ups;
        higher_ups.candidateUsers = value;
        var target = _.find(HIGHER_LEVEL, item => item.value === value);
        higher_ups.showCandidateUsers = target.name;
        this.setState({
            higher_ups: higher_ups
        });
    };
    onChangeAdminApproveCheck = (e) => {
        var higher_ups = this.state.higher_ups;
        higher_ups.adminApproveChecked = e.target.checked;
        this.setState({
            higher_ups: higher_ups
        });
    };
    onChangeHigherLevelCheck = (e) => {
        var higher_ups = this.state.higher_ups;
        higher_ups.higherLevelApproveChecked = e.target.checked;
        this.setState({
            higher_ups: higher_ups
        });
    };
    handleChangeSelectRole = (value) => {
        var setting_roles = this.state.setting_roles;
        setting_roles.selectRole = value;
        var target = _.find(this.state.roleList, item => item.role_id === value);
        setting_roles.showSelectRole = target.role_name;
        this.setState({
            setting_roles: setting_roles
        });
    };
    handleChangeSelectUser = (value) => {
        var setting_users = this.state.setting_users;
        setting_users.selectUser = value;
        var target = _.find(this.state.userList, item => item.userId === value);
        setting_users.showSelectUser = target.nickName;
        this.setState({
            setting_users: setting_users
        });
    };
    renderAdditonContent = (typeItem, index) => {
        var checkedRadioValue = this.state.checkedRadioValue;
        if (this.state.checkedRadioValue === typeItem.value) {
            switch (typeItem.value) {
                case 'higher_ups':
                    var higher_ups = this.state.higher_ups;
                    return (
                        <div className="add-higher-up addition-condition">
                            <div className="higher-level-item addition-condition-item">
                                <Select value={higher_ups.candidateUsers}
                                    onChange={this.handleHigherUpChange}>
                                    {_.map(HIGHER_LEVEL, (item) => {
                                        return <Option value={item.value}>{item.name}</Option>;
                                    })}
                                </Select>
                            </div>
                            <div className="higher-level-item addition-condition-item">
                                <Checkbox checked={higher_ups.higherLevelApproveChecked}
                                    onChange={this.onChangeHigherLevelCheck}>{Intl.get('apply.empty.approve.higher.level', '空缺时，由组织中的更上一级代审批')}</Checkbox>
                            </div>
                            <div className="higher-level-item addition-condition-item">
                                <Checkbox checked={higher_ups.adminApproveChecked}
                                    onChange={this.onChangeAdminApproveCheck}>{Intl.get('apply.empty.admin.approve', '没有审批人时，由管理员审批')}</Checkbox>
                            </div>
                        </div>
                    );
                case 'setting_roles' :
                    var setting_roles = this.state.setting_roles;
                    return (
                        <div className="addition-condition">
                            <div className="addition-condition-item">
                                <Select value={setting_roles.selectRole} onChange={this.handleChangeSelectRole}>
                                    {_.map(this.state.roleList, (item) => {
                                        return <Option value={item.role_id}>{item.role_name}(
                                            {Intl.get('apply.add.approve.num.person', '{num}人', {num: item.num})})</Option>;
                                    })}
                                </Select>
                            </div>
                        </div>
                    );
                case 'setting_users' :
                    var setting_users = this.state.setting_users;
                    return (
                        <div className="addition-condition">
                            <div className="addition-condition-item">
                                <Select value={setting_users.selectUser} onChange={this.handleChangeSelectUser}>
                                    {_.map(this.state.userList, (item) => {
                                        return <Option value={item.userId}>{item.nickName}</Option>;
                                    })}
                                </Select>
                            </div>
                        </div>
                    );
            }
        }
    };
    handleSubmitAddApproveNode = () => {
        var radioValue = this.state.checkedRadioValue, submitObj = {}, errTip = '';
        if (radioValue) {
            switch (radioValue) {
                case 'higher_ups':
                    var higher_ups = this.state.higher_ups;
                    if (higher_ups.candidateUsers) {
                        submitObj.candidateApprover = higher_ups.candidateUsers;
                        submitObj.showName = higher_ups.showCandidateUsers;
                        if (_.isBoolean(higher_ups.higherLevelApproveChecked)) {
                            submitObj.higherLevelApproveChecked = higher_ups.higherLevelApproveChecked;
                        }
                        if (_.isBoolean(higher_ups.adminApproveChecked)) {
                            submitObj.adminApproveChecked = higher_ups.adminApproveChecked;
                        }
                    } else {
                        errTip = 'asaa11';
                    }
                    break;
                case 'setting_roles':
                    var setting_roles = this.state.setting_roles;
                    if (setting_roles.selectRole) {
                        submitObj.candidateApprover = setting_roles.selectRole;
                        submitObj.showName = setting_roles.showSelectRole;
                    } else {
                        errTip = 'sss';
                    }
                    break;
                case 'setting_users':
                    var setting_users = this.state.setting_users;
                    if (setting_users.selectUser) {
                        submitObj.candidateApprover = setting_users.selectUser;
                        submitObj.showName = setting_users.showSelectUser;
                    } else {
                        errTip = 'sssaaa';
                    }
                    break;
                default:
                    submitObj.candidateApprover = radioValue;
                    var target = _.find(APPROVER_TYPE, item => item.value === radioValue);
                    submitObj.showName = target.name;
            }


        } else {
            //如果上一节点是指定审批人
            if (this.state.isPreviousNodeCheck) {
                submitObj.candidateApprover = SETTING_APPLY_APPROVER.value;
                submitObj.showName = SETTING_APPLY_APPROVER.label;
            } else {
                errTip = 'aaa';
            }

        }
        if (!errTip) {
            submitObj.radioType = radioValue;
            //可上传文件
            submitObj.submitFiles = this.state.submitFiles;
            //可以指定下一节点审批人
            submitObj.assignNextNodeApprover = this.state.assignNextNodeApprover;
            //可分配销售
            // submitObj.distributeSales = this.state.distributeSales;

            this.props.saveAddApproveNode(submitObj);
            this.props.hideRightPanel();
        }
        this.setState({
            submitErrorMsg: errTip
        });
        console.log(submitObj);


    };
    //上一节点是否选择了指定下一节点审批人
    isPreviousNodeCheck = () => {
        var hideType = false;
        var applyRulesAndSetting = _.get(this, 'props.applyRulesAndSetting.applyApproveRules');
        var addNodePanelFlow = this.props.addNodePanelFlow;
        if (_.isObject(applyRulesAndSetting[addNodePanelFlow]) && _.isArray(applyRulesAndSetting[addNodePanelFlow]['bpmnNode'])) {
            //如果是之前已经添加过的流程，最后一个节点是结束的节点，那就要看倒数第二个是不是指定了需要
            var bpmnNodeArr = applyRulesAndSetting[addNodePanelFlow]['bpmnNode'];
            var lastNode = _.last(bpmnNodeArr);
            if(lastNode){
                if (lastNode.type === 'EndEvent'){
                    var arrLength = bpmnNodeArr.length - 2;
                    if (arrLength > -1){
                        lastNode = _.get(bpmnNodeArr,`[${arrLength}]`);
                    }else{
                        lastNode = null;
                    }

                }
                if (lastNode && lastNode.assignNextNodeApprover + '' === 'true'){
                    hideType = true;
                }

            }
        }
        return hideType;
    };

    render() {
        var divHeight = $(window).height() - FORMLAYOUT.PADDINGTOTAL;
        return (
            <RightPanel showFlag={true} data-tracename="添加审批人节点" className="add-apply-approver-container">
                <div className="add-apply-node-wrap">
                    <BasicData
                        clueTypeTitle={Intl.get('apply.add.apply.approver', '添加审批人')}
                    />
                    <div className="add-apply-node-item " style={{'height': divHeight}}>
                        <GeminiScrollbar>
                            {/*如果上一节点已经勾选了指定下一审批人，那么下一节点添加的时候就不展示类型了*/}

                            <div className="add-apply-form ant-row ant-form-item">
                                <label className="ant-form-item-label ">
                                    {Intl.get('common.type', '类型')}
                                </label>
                                <div className="add-node-content ant-form-item-control-wrapper">
                                    {this.state.isPreviousNodeCheck ? <span>{SETTING_APPLY_APPROVER.label}</span> :
                                        <RadioGroup onChange={this.onRadioChange} value={this.state.checkedRadioValue}>
                                            {_.map(APPROVER_TYPE, (typeItem, index) => {
                                                return (
                                                    <div>
                                                        <Radio value={typeItem.value}>{typeItem.name}</Radio>
                                                        {this.renderAdditonContent(typeItem, index)}
                                                    </div>
                                                );

                                            })}
                                        </RadioGroup>}
                                </div>
                            </div>
                            <div className="add-apply-form ant-row ant-form-item">
                                <label className="ant-form-item-label ">
                                    {Intl.get('crm.186', '其他')}
                                </label>
                                <div className="add-node-content ant-form-item-control-wrapper">
                                    <div>
                                        <Checkbox
                                            checked={this.state.submitFiles}
                                            onChange={this.onChangeSubmitFilesCheck}
                                        >
                                            {Intl.get('apply.add.approver.submit.files', '可提交文件')}
                                        </Checkbox>
                                    </div>
                                    <div>
                                        <Checkbox
                                            checked={this.state.assignNextNodeApprover}
                                            onChange={this.onChangeAssignNextNodeApprover}
                                        >
                                            {Intl.get('apply.add.approver.distribute', '指定下一审批人')}
                                        </Checkbox>
                                    </div>
                                </div>
                            </div>
                            <SaveCancelButton
                                handleSubmit={this.handleSubmitAddApproveNode}
                                handleCancel={this.props.hideRightPanel}
                                saveErrorMsg={this.state.submitErrorMsg}
                            />
                        </GeminiScrollbar>
                    </div>
                </div>

            </RightPanel>
        );
    }
}
AddApplyNodePanel.defaultProps = {
    hideRightPanel: function() {

    },
    saveAddApproveNode: function() {

    },

    applyRulesAndSetting: {},
    addNodePanelFlow: ''


};
AddApplyNodePanel.propTypes = {
    hideRightPanel: PropTypes.func,
    saveAddApproveNode: PropTypes.func,
    applyRulesAndSetting: PropTypes.object,
    addNodePanelFlow: PropTypes.string,


    defaultClueData: PropTypes.object,
    clueSourceArray: PropTypes.object,
    updateClueSource: PropTypes.func,
    accessChannelArray: PropTypes.object,
    updateClueChannel: PropTypes.func,
    clueClassifyArray: PropTypes.object,
    updateClueClassify: PropTypes.func,
    afterAddSalesClue: PropTypes.func,
    form: PropTypes.object,
    hideAddForm: PropTypes.func,
    appUserId: PropTypes.string,
    appUserName: PropTypes.string
};
export default Form.create()(AddApplyNodePanel);
