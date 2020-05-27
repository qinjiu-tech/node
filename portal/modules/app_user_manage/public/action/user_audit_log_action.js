var userAuditLogAjax = require('../ajax/user_audit_log_ajax');
var scrollBarEmitter = require('../../../../public/sources/utils/emitters').scrollBarEmitter;
var ShareObj = require('../util/app-id-share-util');
var AppUserUtil = require('../util/app-user-util');
import { storageUtil } from 'ant-utils';
import commonDataUtil from 'PUB_DIR/sources/utils/common-data-util';
import {isKetaoOrganizaion} from 'PUB_DIR/sources/utils/common-method-util';

function UserAuditLogAction() {
    this.generateActions(
        'getUserApp', // 获取用户的应用
        'getAuditLogList', // 获取用户审计日志
        'handleSearchEvent', // 处理搜索框中内容的变化
        'changeSearchTime', // 某个时间内显示
        'setUserLogSelectedAppId', //设置选中的appid
        'setSort', // 设置排序选项
        'handleFilterUserType', // 用户类型的过滤
        'handleRefresh', //刷新用户审计日志
        'resetState',
        'handleFilterLogType', // 审计日志类型的过滤
        'setTypeFilterValue', // 设置过滤字段的值
        'handleFilterAppTerminalType', // 筛选产品的多终端类型
    );

    //获取应用appID
    this.getUserApp = function(callback) {
        var _this = this;
        commonDataUtil.getAppList((data,errorMsg) => {
            if (!errorMsg){
                let app_id = '';
                // 客套组织下，直接显示客套产品
                if (isKetaoOrganizaion()) {
                    let ketaoId = _.get(window, 'Oplate.clientId'); // 客套id
                    let ketaoApp = _.find(data, app => app.app_id === ketaoId);
                    if (!_.isEmpty(ketaoApp)) {
                        app_id = ketaoId;
                    } else {
                        app_id = _.get(data, '[0].app_id');
                    }
                } else {
                    let storageValue = JSON.parse(storageUtil.local.get(AppUserUtil.saveSelectAppKeyUserId));
                    let lastSelectAppId = storageValue && storageValue.logViewAppId ? storageValue.logViewAppId : '';
                    // 判断记住的应用，在应用列表中，是否还存在，若存在，则使用,否则，不用
                    let matchAppList = _.find(data, app => app.app_id === lastSelectAppId);
                    if (matchAppList) { //缓存中存在最后一次选择的应用，直接查看该应用的审计日志
                        app_id = lastSelectAppId;
                    } else { // 首次登陆时
                        if (ShareObj.app_id) { // 已有用户选择的应用时，用户审计日志也要展示该应用的
                            app_id = ShareObj.app_id;
                        } else {
                            // 已有用户应用选择框中选择全部时，用户审计日志默认展示第一个应用的
                            if (_.isArray(data) && data.length >= 1) {
                                app_id = data[0].app_id;
                            }
                        }
                    }
                }
                
                _this.dispatch({error: false, data: data, selectAppId: app_id});
                callback && callback(app_id);
            }else{
                _this.dispatch({error: true, errorMsg: errorMsg});
            }
        });
    };

    // 获取用户的审计日志信息
    this.getAuditLogList = function(searchObj, callback) {
        var _this = this;
        _this.dispatch({loading: true, error: false});
        userAuditLogAjax.getAuditLogList(searchObj).then(function(data) {
            scrollBarEmitter.emit(scrollBarEmitter.HIDE_BOTTOM_LOADING);
            _this.dispatch({loading: false, error: false, data: data});
            if (callback && typeof callback == 'function') {
                callback();
            }
        }, function(errorMsg) {
            _this.dispatch({loading: false, error: true, errorMsg: errorMsg});
        });
    };
    this.getTeamList = function(cb) {
        commonDataUtil.getMyTeamTreeAndFlattenList(data => {
            let list = data.teamList || [];
            // list.unshift({group_id: '', group_name: Intl.get('common.all', '全部')});
            this.dispatch({teamList: list, teamTreeList: data.teamTreeList, errorMsg: data.errorMsg});
            if (_.isFunction(cb)) cb(list);
        });
    };
    // 成员信息
    this.getSaleMemberList = function(reqData) {
        userAuditLogAjax.getSaleMemberList(reqData).then((resData) => {
            this.dispatch({error: false, resData: resData});
        }, (errorMsg) => {
            this.dispatch({error: true, errMsg: errorMsg});
        }
        );
    };
}

module.exports = alt.createActions(UserAuditLogAction);