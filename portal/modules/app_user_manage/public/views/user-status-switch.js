//用户状态添加switch切换逻辑
var React = require('react');
import { Icon, Switch } from 'antd';
const AppUserAjax = require('../ajax/app-user-ajax');
const AlertTimer = require('CMP_DIR/alert-timer');
import language from 'PUB_DIR/language/getLanguage';
import { StatusWrapper } from 'antc';

class UserStatusFieldSwitch extends React.Component {
    //获取默认属性
    static defaultProps = {
        //用户id
        userId: '',
        //状态
        status: '',
        //修改成功之后的回调
        modifySuccess: function() {
        }
    };

    state = {
        resultType: '',
        errorMsg: '',
        status: this.props.status
    };

    componentWillReceiveProps(nextProps) {
        if (nextProps.status !== this.props.status) {
            this.setState({
                status: nextProps.status
            });
        }
    }

    onHideAlert = () => {
        this.setState({
            resultType: '',
            errorMsg: '',
            status: this.props.status
        });
    };

    changeUserStatus = (checked) => {
        //展示修改用户状态并展示是否保存的提示框
        this.setState({ status: checked }, () => {
            this.saveUserStatus();
        });
        if(checked){
            Trace.traceEvent('用户详情','点击开启用户状态switch');
        }else{
            Trace.traceEvent('用户详情','点击停用用户状态switch');
        }
    };

    saveUserStatus = () => {
        let submitObj = {
            user_id: this.props.userId,
            status: this.state.status ? '1' : '0'
        };
        this.setState({ resultType: 'loading', errorMsg: '' });
        //提交数据
        AppUserAjax.editAppUser(submitObj).then((result) => {
            if (result) {
                this.setState({ resultType: '', errorMsg: '', status: submitObj.status === '1'});
            } else {
                this.setState({
                    resultType: 'error',
                    errorMsg: Intl.get('common.edit.failed', '修改失败')                    
                });
            }
        }, (errorMsg) => {
            this.setState({
                resultType: 'error',
                errorMsg: errorMsg || Intl.get('common.edit.failed', '修改失败')
            });
        });
    };

    render() {
        if (this.props.useIcon) {
            return (
                <div className="status-switch-container">
                    <StatusWrapper
                        loading={this.state.resultType === 'loading'}
                        errorMsg={this.state.resultType === 'error' && this.state.errorMsg}
                        size='small'
                    >
                        <Switch
                            checked={this.state.status}
                            onChange={this.changeUserStatus}
                            checkedChildren={Intl.get('common.enabled', '启用')}
                            unCheckedChildren={Intl.get('common.stop', '停用')}
                        />
                    </StatusWrapper>
                </div>
            );
        }
        return (
            <div>
                {language.lan() === 'es' ? (
                    <Switch checked={this.state.status} onChange={this.changeUserStatus}
                        checkedChildren={<Icon type="check" />}
                        unCheckedChildren={<Icon type="cross" />} />
                ) : (
                    <Switch checked={this.state.status} onChange={this.changeUserStatus}
                        checkedChildren={Intl.get('common.enabled', '启用')}
                        unCheckedChildren={Intl.get('common.stop', '停用')} />
                )}
                {this.state.resultType === 'loading' ? <Icon type="loading" /> : null}
                {this.state.resultType === 'error' ? <AlertTimer time={2000} message={this.state.errorMsg} type="error"
                    onHide={this.onHideAlert} showIcon /> : null}
            </div>
        );
    }
}

UserStatusFieldSwitch.propTypes = {
    status: PropTypes.bool,
    userId: PropTypes.string,
    useIcon: PropTypes.bool,
};

module.exports = UserStatusFieldSwitch;
