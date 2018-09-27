/**
 * Copyright (c) 2010-2015 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2010-2015 湖南蚁坊软件有限公司。保留所有权利。
 */

'use strict';
var restLogger = require('../../../../lib/utils/logger').getLogger('rest');
var restUtil = require('ant-auth-request').restUtil(restLogger);
var customersDto = require('../dto/customers');
var applyDto = require('../dto/apply');
var replyDto = require('../dto/reply');
var _ = require('lodash');
var auth = require('../../../../lib/utils/auth');
var Promise = require('bluebird');
var EventEmitter = require('events').EventEmitter;

//常量定义
var CONSTANTS = {
    APPLY_USER_OFFICIAL: 'apply_user_official', //申请正式用户
    APPLY_USER_TRIAL: 'apply_user_trial', //申请试用用户
    EXIST_APPLY_TRIAL: 'apply_app_trial', //已有用户开通试用
    EXIST_APPLY_FORMAL: 'apply_app_official', //已有用户开通正式
    APPLY_GRANT_DELAY: 'apply_grant_delay',// 延期
    APPLY_PWD_CHANGE: 'apply_pwd_change',// 修改开通状态
    APPLY_GRANT_STATUS_CHANGE: 'apply_grant_status_change', // 修改密码
    APPLY_GRANT_OTHER_CHANGE: 'apply_sth_else', // 修改其他类型
    USER_TRIAL: '试用用户',
    USER_OFFICIAL: '正式用户',
    APPROVAL_STATE_FALSE: '0', // 待审批
    APPROVAL_STATE_PASS: '1' // 已通过
};

var AppUserRestApis = {
    //根据用户名获取用户信息
    getUserByName: '/rest/base/v1/user/name',
    //根据字段（邮箱，手机）检查用户是否存在
    checkUserExist: '/rest/base/v1/user/:field',
    //停用所有应用
    disableApps: '/rest/base/v1/user/:user_id/app/0',
    //添加用户
    addUser: '/rest/base/v1/user/users',
    //添加应用
    addApp: '/rest/base/v1/user/grant_applications',
    //修改引用
    editApp: '/rest/base/v1/user/grant_application',
    //获取应用列表
    getAppList: '/rest/base/v1/application',
    //获取用户列表
    getUsers: '/rest/base/v1/user/search',
    //获取用户详情
    getUserDetail: '/rest/base/v1/user/:user_id/detail',
    //批量更新
    batchUpdate: '/rest/base/v1/user/batch/:field',
    //修改用户信息
    editAppUser: '/rest/base/v1/user/:user_id/detail',
    //修改用户所属客户
    editAppUserCustomer: '/rest/base/v1/user/belong/customer',
    //获取用户审批列表
    getApplyList: '/rest/base/v1/message/applylist',
    //获取有未读回复的申请列表
    getUnreadApplyList: '/rest/base/v1/message/applylist/comment/unread',
    //获取未读回复列表(用户来标识未读回复的申请)
    getUnreadReplyList: '/rest/base/v1/message/applycomment/unread/notices',
    //获取申请单详情
    getApplyDetail: '/rest/base/v1/message/apply/:apply_id',
    //审批申请单（新创建用户）
    submitNewApply: '/rest/base/v1/user/approve_users',
    //审批申请单（已有用户）
    submitExistApply: '/rest/base/v1/user/approve_grants',
    // 申请用户
    applyUser: '/rest/base/v1/user/apply_grants',
    //获取客户对应的用户列表
    getCustomerUsers: '/rest/base/v1/user/customer/users',
    //用户申请延期
    applyDelayUser: '/rest/base/v1/user/grant/delay',
    //批量用户延期
    batchDelayUser: '/rest/base/v1/user/batch/grant/delay',
    //修改密码
    changePassword: '/rest/base/v1/user/apply/user_password',
    //用户申请修改其他类型
    applyChangeOther: '/rest/base/v1/user/apply/else',
    //销售申请修改开通状态
    applyChangeStatus: '/rest/base/v1/user/apply/grant_status',
    //审批用户延期
    approveDelayUser: '/rest/base/v1/user/approve_delay',
    //审批修改密码
    submitApplyChangePassword: '/rest/base/v1/user/approve_password',
    //审批其他类型的修改
    submitApplyChangeOther: '/rest/base/v1/user/approve/sthelse',
    //审批开通状态
    submitApplyGrantStatus: '/rest/base/v1/user/approve_status',
    //编辑用户应用单个字段
    editAppDetail: '/rest/base/v1/user/grantdetail',
    //添加一条回复
    addReply: '/rest/base/v1/message/apply/comment',
    //获取回复列表
    getReplyList: '/rest/base/v1/message/apply/comments',
    //管理员批量添加、修改应用
    BATCH_GRANT_APPLICATION: '/rest/base/v1/user/batch/grant/application',
    //管理员批量延期
    BATCH_UPDATE_GRANT_DELAY: '/rest/base/v1/user/batch/grant/delay',
    //管理员批量修改开通时间
    BATCH_UPDATE_GRANT_PERIOD: '/rest/base/v1/user/batch/grant/period',
    //管理员批量修改应用
    BATCH_UPDATE_GRANT_ROLES: '/rest/base/v1/user/batch/grant/roles',
    //管理员批量修改开通状态
    BATCH_UPDATE_GRANT_STATUS: '/rest/base/v1/user/batch/grant/status',
    //管理员批量修改开通类型
    BATCH_UPDATE_GRANT_TYPE: '/rest/base/v1/user/batch/grant/type',
    //管理员批量修改客户
    BATCH_UPDATE_USER_CUSTOMER: '/rest/base/v1/user/batch/user/customer',
    //管理员批量修改密码
    BATCH_UPDATE_USER_PASSWORD: '/rest/base/v1/user/batch/user/password',
    //获取团队列表
    getteamlists: '/rest/base/v1/group/myteam',
    // 撤销申请
    saleBackoutApply: '/rest/base/v1/message/apply/cancel',
    // 获取应用的默认配置信息（待审批）
    getAppExtraConfigInfo: '/rest/base/v1/application/extra/grantinfos',
    // 获取应用的角色名称（已通过）
    getAppRoleNames: '/rest/base/v1/role/batch_ids',
    // 获取应用的权限名称（已通过）
    getAppPermissionNames: '/rest/base/v1/permission/batch_ids',
    // 判断审批的用户名的合法性
    checkUserName: '/rest/base/v1/user/info/name/prefixname',
    //  添加一个用户时，提示用户名信息
    addOneUserSuggestName: '/rest/base/v1/user/username/suggest',
    // 获取安全域信息列表
    getRealmList: '/rest/base/v1/realm/list',
    // 根据客户的id查询客户最后联系时间
    getQueryCustomerById: '/rest/customer/v2/customer/query/10/id/ascend',
};

exports.urls = AppUserRestApis;
//添加用户
exports.addUser = function(req, res, user) {
    return restUtil.authRest.post(
        {
            url: AppUserRestApis.addUser,
            req: req,
            res: res,
        },
        user,
        {
            error: function(eventEmitter, errorCodeDesc, restResp) {
                //添加错误码,10214（表示该用户名已存在）
                if (restResp.body && restResp.body.errorCode) {
                    errorCodeDesc.errorCode = restResp.body.errorCode;
                }
                eventEmitter.emit('error', errorCodeDesc);
            }
        });
};

//为用户添加应用
exports.addApp = function(req, res, appList) {
    return restUtil.authRest.post(
        {
            url: AppUserRestApis.addApp,
            req: req,
            res: res,
        },
        appList
    );
};
//为用户修改应用
exports.editApp = function(req, res, appInfo) {
    return restUtil.authRest.put(
        {
            url: AppUserRestApis.editApp,
            req: req,
            res: res,
        },
        appInfo
    );
};
//获取近期登录的用户列表
exports.getRecentLoginUsers = function(req, res, queryObj) {
    return restUtil.authRest.get(
        {
            url: AppUserRestApis.getUsers,
            req: req,
            res: res
        }, queryObj);
};

// 获取用户列表
function getUsersList(req, res, obj, requestUrl) {
    return new Promise((resolve, reject) => {
        return restUtil.authRest.get({
            url: requestUrl,
            req: req,
            res: res,
        }, obj, {
            success: function(eventEmitter, data) {
                resolve(data);
            },
            error: function(eventEmitter, errorDesc) {
                reject(errorDesc.message);
            }
        });
    });
}

//获取用户列表和异地登录的封装信息
exports.getUsers = function(req, res, obj) {
    var emitter = new EventEmitter();
    obj = obj || {};
    var requestUrl = '';
    if (obj.customer_id) {
        requestUrl = AppUserRestApis.getCustomerUsers;
    } else {
        requestUrl = AppUserRestApis.getUsers;
    }
    getUsersList(req, res, obj, requestUrl).then((userBasicInfo) => {
        emitter.emit('success', userBasicInfo);
    }).catch((errorMsg) => {
        emitter.emit('error', errorMsg);
    });

    return emitter;
};
//获取用户详情
exports.getUserDetail = function(req, res, user_id) {
    return restUtil.authRest.get({
        url: AppUserRestApis.getUserDetail.replace(':user_id', user_id),
        req: req,
        res: res,
    });
};
//停用所有应用
exports.disableAllApps = function(req, res, user_id) {
    return restUtil.authRest.put({
        url: AppUserRestApis.disableApps.replace(':user_id', user_id),
        req: req,
        res: res,
    });
};
//批量更新
exports.batchUpdate = function(req, res, field, data, application_ids) {
    var userObj = {};
    try {
        userObj = JSON.parse(data);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(e));
    }
    //修改权限
    if (field === 'grant_roles') {
        userObj.application_id = application_ids;
    } else {
        //修改其他选项
        userObj.application_ids = application_ids;
    }
    var restUrl = '';
    switch (field) {
    //批量 添加/修改 应用
        case 'grant_application':
            restUrl = AppUserRestApis.BATCH_GRANT_APPLICATION;
            break;
        //批量修改密码
        case 'change_password':
            restUrl = AppUserRestApis.BATCH_UPDATE_USER_PASSWORD;
            break;
        //批量修改类型
        case 'grant_type':
            restUrl = AppUserRestApis.BATCH_UPDATE_GRANT_TYPE;
            break;
        //批量修改开通状态
        case 'grant_status':
            restUrl = AppUserRestApis.BATCH_UPDATE_GRANT_STATUS;
            break;
        //批量延期
        case 'grant_period':
            restUrl = AppUserRestApis.BATCH_UPDATE_GRANT_PERIOD;
            break;
        //批量修改客户
        case 'grant_customer':
            restUrl = AppUserRestApis.BATCH_UPDATE_USER_CUSTOMER;
            break;
        //批量修改角色
        case 'grant_roles':
            restUrl = AppUserRestApis.BATCH_UPDATE_GRANT_ROLES;
            break;
    }
    return restUtil.authRest.put({
        url: restUrl,
        req: req,
        res: res,
    }, userObj);
};
/**
 * 获取申请列表
 */
exports.getApplyList = function(req, res, obj) {
    let url = AppUserRestApis.getApplyList;
    //获取有未读回复的申请列表
    if (obj.isUnreadApply === 'true') {
        obj = {id: obj.id, page_size: obj.page_size};
        url = AppUserRestApis.getUnreadApplyList;
    } else {
        delete obj.isUnreadApply;
    }
    return restUtil.authRest.get({
        url: url,
        req: req,
        res: res
    }, obj, {
        success: function(eventEmitter, data) {
            //处理数据
            if (data && data.list && data.list.length) {
                var applyList = applyDto.toRestObject(data.list || []);
                data.list = applyList;
            }
            eventEmitter.emit('success', data);
        }
    });
};
//获取未读回复列表
exports.getUnreadReplyList = function(req, res) {
    return restUtil.authRest.get({
        url: AppUserRestApis.getUnreadReplyList,
        req: req,
        res: res
    }, req.query, {
        success: (eventEmitter, data) => {
            //处理数据
            let replyList = _.get(data,'list[0]') ? data.list : [];
            data.list = _.map(replyList, reply => {
                return applyDto.unreadReplyToFrontend(reply);
            });
            eventEmitter.emit('success', data);
        }
    });
};
//修改用户字段
exports.editAppUser = function(req, res, obj) {
    //调用接口
    var requestUrl = AppUserRestApis.editAppUser;
    //是否是销售修改客户
    var isSalesEditCustomerBelong = false;
    //如果只修改客户的话，看看是否是销售，销售调用另一个接口
    if (obj && 'customer_id' in obj && obj.user_id && Object.keys(obj).length === 2) {
        if (auth.hasRole(req, auth.ROLE_CONSTANTS.SALES) ||
            auth.hasRole(req, auth.ROLE_CONSTANTS.SALES_LEADER) ||
            auth.hasRole(req, auth.ROLE_CONSTANTS.SECRETARY)) {
            isSalesEditCustomerBelong = true;
            requestUrl = AppUserRestApis.editAppUserCustomer;
        }
    }
    var user_id = obj.user_id;
    //如果不是销售修改用户所属客户，则删掉user_id
    if (!isSalesEditCustomerBelong) {
        delete obj.user_id;
    }
    return restUtil.authRest.put({
        url: requestUrl.replace(':user_id', user_id),
        req: req,
        res: res,
    }, obj);
};

//根据客户id获取对应的用户列表
exports.getCustomerUsers = function(req, res, obj) {
    obj = obj || {};
    return restUtil.authRest.get({
        url: AppUserRestApis.getCustomerUsers + '/' + req.params.customer_id,
        req: req,
        res: res
    }, {
        id: obj.id,
        page_size: obj.page_size,
        filter_content: obj.filter_content
    });
};

//获取申请单详情
exports.getApplyDetail = function(req, res, apply_id) {
    var emitter = new EventEmitter();
    getApplyBasicDetail(req, res, apply_id).then((applyBasicDetail) => {
        // 申请正式、试用，已用用户申请正式、试用的情况
        if (applyBasicDetail.type === CONSTANTS.APPLY_USER_OFFICIAL ||
            applyBasicDetail.type === CONSTANTS.APPLY_USER_TRIAL ||
            applyBasicDetail.type === CONSTANTS.EXIST_APPLY_TRIAL ||
            applyBasicDetail.type === CONSTANTS.EXIST_APPLY_FORMAL) {
            if (applyBasicDetail.approval_state === CONSTANTS.APPROVAL_STATE_FALSE) { // 待审批
                // 获取登陆用户的权限
                let privilegesArray = req.session.user && req.session.user.privileges ? req.session.user.privileges : [];
                // GET_APP_EXTRA_GRANTS获取应用的默认配置信息
                let index = _.indexOf(privilegesArray, 'GET_APP_EXTRA_GRANTS');
                if (index !== -1 && _.isArray(applyBasicDetail.apps) && applyBasicDetail.apps.length) {
                    let user_type = (applyBasicDetail.type === CONSTANTS.APPLY_USER_TRIAL || applyBasicDetail.type === CONSTANTS.EXIST_APPLY_TRIAL ?
                        CONSTANTS.USER_TRIAL : CONSTANTS.USER_OFFICIAL
                    );
                    let appIdList = _.map(applyBasicDetail.apps, 'client_id');
                    let obj = {
                        client_id: appIdList.join(','),
                        user_type: user_type,
                        with_addition: 'true' // 附加字段，true时，获取额角色和权限的名称，false时，不获取额外的对应的名称
                    };
                    getAppExtraConfigInfo(req, res, obj).then((list) => {
                        let applyDetailInfo = getExtraAppInfo(applyBasicDetail, list);
                        emitter.emit('success', applyDetailInfo);
                    }).catch((errorMsg) => {
                        emitter.emit('error', errorMsg);
                    });
                } else {
                    emitter.emit('success', applyBasicDetail);
                }
            } else if (applyBasicDetail.approval_state === CONSTANTS.APPROVAL_STATE_PASS) { // 已通过
                let roleIdsList = _.map(applyBasicDetail.apps, 'roles');
                let roleIdsArray = _.flatten(roleIdsList);
                let permissionIdsList = _.map(applyBasicDetail.apps, 'permissions');
                let permissionIdsArray = _.flatten(permissionIdsList);
                let roleObj = {
                    ids: roleIdsArray
                };
                if (roleIdsArray.length > 0) {
                    getAppRoleNames(req, res, roleObj).then((list) => {
                        if (permissionIdsArray.length === 0) { // 没有分配权限
                            let applyDetailInfo = getAppExtraRoleNames(applyBasicDetail, list);
                            emitter.emit('success', applyDetailInfo);
                        } else {
                            let permissionObj = {
                                ids: permissionIdsArray
                            };
                            let applyDetailRoleNames = getAppExtraRoleNames(applyBasicDetail, list);
                            getAppPermissionNames(req, res, permissionObj).then((list) => {
                                let applyDetailInfo = getAppExtraPermissionNames(applyDetailRoleNames, list);
                                emitter.emit('success', applyDetailInfo);
                            }).catch((errorMsg) => {
                                emitter.emit('error', errorMsg);
                            });
                        }
                    }).catch((errorMsg) => {
                        emitter.emit('error', errorMsg);
                    });
                } else {
                    emitter.emit('success', applyBasicDetail);
                }

            } else { // 驳回、撤销
                emitter.emit('success', applyBasicDetail);
            }
        } else {
            emitter.emit('success', applyBasicDetail);
        }
    });
    return emitter;
};

// 根据应用的默认配置信息，封装审批详情的角色和权限名称
function getExtraAppInfo(applyBasicDetail, appConfigInfo) {
    let appIdList = _.map(applyBasicDetail.apps, 'client_id');
    let length = appConfigInfo.length;
    for (let i = 0; i < length; i++) {
        let index = _.indexOf(appIdList, appConfigInfo[i].client_id);
        applyBasicDetail.apps[index].roles = appConfigInfo[i].roles || [];
        applyBasicDetail.apps[index].rolesNames = appConfigInfo[i].roles_name || [];
        applyBasicDetail.apps[index].permissions = appConfigInfo[i].permissions || [];
        applyBasicDetail.apps[index].permissionsNames = appConfigInfo[i].permissions_name || [];
    }
    return applyBasicDetail;
}

// 角色ids获取对应的角色名称
function getAppExtraRoleNames(applyBasicDetail, appRoleNames) {
    applyBasicDetail.apps.forEach((item) => {
        let appRolesNamesList = _.filter(appRoleNames, (roleItem) => roleItem.client_id === item.client_id);
        item.rolesNames = _.map(appRolesNamesList, 'role_name');
    });
    return applyBasicDetail;
}

// 角色ids获取对应的权限名称
function getAppExtraPermissionNames(applyBasicDetail, appPermissionNames) {
    applyBasicDetail.apps.forEach((item) => {
        let appPermissionsNamesList = _.filter(appPermissionNames, (permissionItem) => permissionItem.client_id === item.client_id);
        item.permissionsNames = _.map(appPermissionsNamesList, 'permission_name');
    });
    return applyBasicDetail;
}


// 获取用户详情的基本信息
function getApplyBasicDetail(req, res, apply_id) {
    let obj = {
        with_addition: 'true' // 附加字段，true时，获取额应用对应的名称
    };
    return new Promise((resolve, reject) => {
        return restUtil.authRest.get({
            url: AppUserRestApis.getApplyDetail.replace(':apply_id', apply_id),
            req: req,
            res: res
        }, obj, {
            success: function(eventEmitter, data) {
                if (data && data.message && !_.isEmpty(data.message)) {
                    var detailObj;
                    if (data.message.type === CONSTANTS.APPLY_GRANT_DELAY) { // 延期
                        detailObj = applyDto.toDetailDelayRestObject(data);
                    } else if (data.message.type === CONSTANTS.APPLY_PWD_CHANGE ||// 更改密码
                        data.message.type === CONSTANTS.APPLY_GRANT_OTHER_CHANGE) {// 更改其他信息
                        detailObj = applyDto.toDetailChangePwdOtherRestObject(data);
                    } else if (data.message.type === CONSTANTS.APPLY_GRANT_STATUS_CHANGE) { // 更改状态
                        detailObj = applyDto.toDetailStatusRestObject(data);
                    } else {
                        detailObj = applyDto.toDetailRestObject(data); // 待审批、已审批、已驳回（用户申请应用）
                    }
                    if (detailObj && detailObj.customer_id) {
                        getQueryCustomerById(req, res, detailObj.customer_id).then((result) => {
                            if (_.isArray(result.result) && result.result.length) {
                                detailObj.last_contact_time = result.result[0].last_contact_time;
                            }
                            resolve(detailObj);
                        }).catch((errorMsg) => {
                            resolve(detailObj);
                            restLogger.error('根据客户的id查询客户最后联系时间失败：' + errorMsg);
                        });
                    } else {
                        resolve(detailObj);
                    }
                }
            },
            error: function(eventEmitter, errorDesc) {
                reject(errorDesc.message);
            }
        });
    });
}

// 获取应用的默认配置信息（待审批）
function getAppExtraConfigInfo(req, res, obj) {
    return new Promise((resolve, reject) => {
        return restUtil.authRest.get({
            url: AppUserRestApis.getAppExtraConfigInfo,
            req: req,
            res: res
        }, obj, {
            success: function(emitter, list) {
                resolve(list);
            },
            error: function(eventEmitter, errorDesc) {
                reject(errorDesc.message);
            }
        });
    });
}

// 获取应用的角色名称（已通过）
function getAppRoleNames(req, res, obj) {
    return new Promise((resolve, reject) => {
        return restUtil.authRest.post({
            url: AppUserRestApis.getAppRoleNames,
            req: req,
            res: res
        }, obj, {
            success: function(emitter, list) {
                resolve(list);
            },
            error: function(eventEmitter, errorDesc) {
                reject(errorDesc.message);
            }
        });
    });
}

//跟据客户的id获取客户详情
function getQueryCustomerById(req, res, id) {
    var queryObj = {id: id};
    return new Promise((resolve, reject) => {
        return restUtil.authRest.post(
            {
                url: AppUserRestApis.getQueryCustomerById,
                req: req,
                res: res
            }, queryObj, {
                success: function(emitter, list) {
                    resolve(list);
                },
                error: function(eventEmitter, errorDesc) {
                    reject(errorDesc.message);
                }
            });
    });
}
// 获取应用的权限名称（已通过）
function getAppPermissionNames(req, res, obj) {
    return new Promise((resolve, reject) => {
        return restUtil.authRest.post({
            url: AppUserRestApis.getAppPermissionNames,
            req: req,
            res: res
        }, obj, {
            success: function(emitter, list) {
                resolve(list);
            },
            error: function(eventEmitter, errorDesc) {
                reject(errorDesc.message);
            }
        });
    });
}

//审批申请单
exports.submitApply = function(req, res, requestObj) {
    //审批提交地址
    var applyUrl;
    //如果有用户名，是新申请
    if (requestObj.type === 'apply_grant_delay') {
        applyUrl = AppUserRestApis.approveDelayUser;
        delete requestObj.user_name;
        delete requestObj.products;
        delete requestObj.nick_name;
        delete requestObj.password;
    } else if (requestObj.type === 'apply_pwd_change') {
        applyUrl = AppUserRestApis.submitApplyChangePassword;
        delete requestObj.user_name;
        delete requestObj.products;
        delete requestObj.nick_name;
        delete requestObj.delay;
        delete requestObj.end_date;
    } else if (requestObj.type === 'apply_sth_else') {
        applyUrl = AppUserRestApis.submitApplyChangeOther;
        delete requestObj.user_name;
        delete requestObj.products;
        delete requestObj.nick_name;
        delete requestObj.delay;
        delete requestObj.end_date;
        delete requestObj.password;
    } else if (requestObj.type === 'apply_grant_status_change') {
        applyUrl = AppUserRestApis.submitApplyGrantStatus;
        delete requestObj.user_name;
        delete requestObj.products;
        delete requestObj.nick_name;
        delete requestObj.delay;
        delete requestObj.end_date;
        delete requestObj.password;
    } else {
        delete requestObj.delay;
        delete requestObj.end_date;
        delete requestObj.password;
        if (requestObj.user_name) {
            applyUrl = AppUserRestApis.submitNewApply;
        } else {
            //没有用户名，是已有用户申请
            applyUrl = AppUserRestApis.submitExistApply;
            delete requestObj.user_name;
            delete requestObj.nick_name;
        }
    }
    delete requestObj.type;
    return restUtil.authRest.post({
        url: applyUrl,
        req: req,
        res: res
    }, requestObj);
};

//根据用户名获取用户信息
exports.getUserByName = function(req, res, userName) {
    return restUtil.authRest.get({
        url: AppUserRestApis.getUserByName,
        req: req,
        res: res
    }, {
        user_name: userName
    }, {
        success: function(eventEmitter, data) {
            if (data && data.user_id) {
                delete data.password;
                delete data.password_salt;
                eventEmitter.emit('success', data);
            } else {
                eventEmitter.emit('success', {});
            }
        }
    });
};

//检查用户是否存在
exports.checkUserExist = function(req, res, field, value) {
    var data = {};
    data[field] = value;
    return restUtil.authRest.get({
        url: AppUserRestApis.checkUserExist.replace(':field', field),
        req: req,
        res: res
    }, data, {
        success: function(eventEmitter, data) {
            if (data && data.user_id) {
                eventEmitter.emit('success', true);
            } else {
                eventEmitter.emit('success', false);
            }
        }
    });
};

//申请用户
exports.applyUser = function(req, res, requestObj) {
    return restUtil.authRest.post({
        url: AppUserRestApis.applyUser,
        req: req,
        res: res
    }, requestObj);
};

//申请延期
exports.applyDelayUser = function(req, res, requestObj) {
    return restUtil.authRest.post({
        url: AppUserRestApis.applyDelayUser,
        req: req,
        res: res
    }, requestObj);
};

//批量用户延期
exports.batchDelayUser = function(req, res, requestObj) {
    return restUtil.authRest.put({
        url: AppUserRestApis.BATCH_UPDATE_GRANT_DELAY,
        req: req,
        res: res
    }, requestObj);
};

//销售申请修改密码
exports.applyChangePassword = function(req, res, requestObj) {
    return restUtil.authRest.post({
        url: AppUserRestApis.changePassword,
        req: req,
        res: res
    }, requestObj);
};

//申请修改其他类型
exports.applyChangeOther = function(req, res, requestObj) {
    return restUtil.authRest.post({
        url: AppUserRestApis.applyChangeOther,
        req: req,
        res: res
    }, requestObj);
};

//销售申请修改开通状态
exports.applyChangeStatus = function(req, res, requestObj) {
    return restUtil.authRest.post({
        url: AppUserRestApis.applyChangeStatus,
        req: req,
        res: res
    }, requestObj);
};

//编辑用户应用单个字段
exports.editAppDetail = function(req, res, requestObj) {

    var list = [
        'status',
        'is_two_factor',
        'multilogin',
        'status'
    ];

    for (var i = 0, len = list.length; i < len; i++) {
        var key = list[i];
        if (key in requestObj && /^\d+$/.test(requestObj[key])) {
            requestObj[key] = parseInt(requestObj[key]);
            break;
        }
    }

    return restUtil.authRest.put({
        url: AppUserRestApis.editAppDetail,
        req: req,
        res: res
    }, requestObj);
};

//针对一个用户申请，添加一条回复
exports.addReply = function(req, res, postData) {
    return restUtil.authRest.post({
        url: AppUserRestApis.addReply,
        req: req,
        res: res
    }, postData);
};

//获取一个申请单的回复列表
exports.getReplyList = function(req, res, apply_id) {
    return restUtil.authRest.get({
        url: AppUserRestApis.getReplyList,
        req: req,
        res: res
    }, {
        apply_id: apply_id,
        page_size: 1000
    }, {
        success: function(eventEmitter, data) {
            var list = [];
            //处理数据
            if (data && data.list && data.list.length) {
                list = replyDto.toRestObject(data.list);
            }
            eventEmitter.emit('success', list);
        }
    });
};

//获取团队信息
exports.getteamlists = function(req, res) {
    return restUtil.authRest.get({
        url: AppUserRestApis.getteamlists,
        req: req,
        res: res
    }, {});
};

// 撤销申请
exports.saleBackoutApply = function(req, res, obj) {
    return restUtil.authRest.put({
        url: AppUserRestApis.saleBackoutApply,
        req: req,
        res: res
    }, obj);
};

// 判断审批的用户名的合法性
exports.checkUserName = function(req, res, obj) {
    return restUtil.authRest.get({
        url: AppUserRestApis.checkUserName,
        req: req,
        res: res
    }, obj);
};

//  添加一个用户时，提示用户名信息
exports.addOneUserSuggestName = function(req, res, obj) {
    return restUtil.authRest.get({
        url: AppUserRestApis.addOneUserSuggestName,
        req: req,
        res: res
    }, obj);
};

// 获取安全域信息列表
exports.getRealmList = function(req, res) {
    return restUtil.authRest.get({
        url: AppUserRestApis.getRealmList,
        req: req,
        res: res
    }, {});
};