//用户状态添加switch切换逻辑
import {Icon,Switch} from "antd";
const AppUserAjax = require("../ajax/app-user-ajax");
const AlertTimer = require("CMP_DIR/alert-timer");
import language from 'PUB_DIR/language/getLanguage';

const UserStatusFieldSwitch = React.createClass({
    //获取默认属性
    getDefaultProps: function() {
        return {
            //用户id
            userId: '',
            //状态
            status: '',
            //修改成功之后的回调
            modifySuccess: function() {
            }
        };
    },
    componentWillReceiveProps: function(nextProps) {
        if (nextProps.status != this.props.status) {
            this.setState({
                status: nextProps.status
            });
        }
    },
    getInitialState: function() {
        return {
            resultType: '',
            errorMsg: '',
            status: this.props.status
        };
    },

    onHideAlert: function() {
        this.setState({
            resultType: '',
            errorMsg: '',
            status: this.props.status
        });
    },
    changeUserStatus: function(checked) {
        //展示修改用户状态并展示是否保存的提示框
        this.setState({status: checked}, ()=> {
            this.saveUserStatus();
        });
    },
    saveUserStatus: function() {
        let submitObj = {
            user_id: this.props.userId,
            status: this.state.status ? "1" : "0"
        };
        this.setState({resultType: 'loading', errorMsg: ''});
        //提交数据
        AppUserAjax.editAppUser(submitObj).then((result)=> {
            if (result) {
                this.setState({resultType: '', errorMsg: ''});
            } else {
                this.setState({
                    resultType: 'error',
                    errorMsg: Intl.get("common.edit.failed", "修改失败"),
                });
            }
        }, (errorMsg)=> {
            this.setState({
                resultType: 'error',
                errorMsg: errorMsg || Intl.get("common.edit.failed", "修改失败")
            });
        });
    },

    render: function() {
        return (
            <div>
                {language.lan() == "es" ? (
                    <Switch checked={this.state.status} onChange={this.changeUserStatus}
                        checkedChildren={<Icon type="check" />}
                        unCheckedChildren={<Icon type="cross" />} />
                ) : (
                    <Switch checked={this.state.status} onChange={this.changeUserStatus}
                        checkedChildren={Intl.get("common.enabled", "启用")}
                        unCheckedChildren={Intl.get("common.stop", "停用")}/>
                )}
                {this.state.resultType === 'loading' ? <Icon type="loading"/> : null}
                {this.state.resultType === 'error' ? <AlertTimer time={2000} message={this.state.errorMsg} type="error"
                    onHide={this.onHideAlert} showIcon/> : null}
            </div>
        );
    }
});

module.exports = UserStatusFieldSwitch;