/**
 * 应用用户基本资料的action
 */
//用户管理的ajax
var AppUserAjax = require('../ajax/app-user-ajax');
var AppUserUtil = require('../util/app-user-util');

function AppUserDetailAction() {

    this.generateActions(
        //隐藏用户详情
        'dismiss',
        //获取用户详情
        'getUserDetail',
        //显示全部停用提示框
        'showDisableAllAppsModal',
        //全部停用
        'submitDisableAllApps',
        //取消全部禁用
        'cancelAllAppsModal',
        //取消显示停用成功
        'hideDisableSuccessMsg',
        //添加应用成功
        'addAppSuccess',
        //修改应用成功,
        'editAppSuccess',
        //修改(昵称，备注)成功
        'changeUserFieldSuccess',
        //修改客户
        'changeCustomer',
        //修改用户组织
        'changeUserOrganization',
        //修改应用单个字段成功
        'changeAppFieldSuccess',
        'showAppDetail'
    );

    //获取用户详情
    this.getUserDetail = function(userId) {
        var _this = this;
        AppUserAjax.getUserDetail(userId).then(function(userDetail) {
            _this.dispatch({loading: false,error: false,userDetail: userDetail});
        },function(errorMsg) {
            _this.dispatch({loading: false,error: true , userDetailErrorMsg: errorMsg || Intl.get('user.get.user.detail.failed', '获取用户详情失败')});
        });
    };

    //全部停用
    this.submitDisableAllApps = function({user_id},callback) {
        var _this = this;
        this.dispatch({loading: true});
        AppUserAjax.disableAllAppsByUser(user_id).then(function(result) {
            _this.dispatch({error: false,result: result});
            _.isFunction(callback) && callback(user_id);
        },function(errorMsg) {
            _this.dispatch({error: true , errorMsg: errorMsg});
        });
    };

}

module.exports = alt.createActions(AppUserDetailAction);