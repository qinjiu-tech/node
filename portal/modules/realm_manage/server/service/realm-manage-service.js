/**
 * Copyright (c) 2010-2015 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2010-2015 湖南蚁坊软件有限公司。保留所有权利。
 * Created by liwenjun on 2016/2/1.
 */

"use strict";
var restLogger = require("../../../../lib/utils/logger").getLogger('rest');
var restUtil = require("../../../../lib/rest/rest-util")(restLogger);
import Realm from "../dto/realm";
var _ = require("underscore");
var auth = require("../../../../lib/utils/auth");
var realmRestApis = {
    //添加安全域地址
    addRealm: "/rest/base/v1/realm/only",
    //添加所有者地址
    addOwner: "/rest/base/v1/realm/owner",
    //修改安全域地址
    modifyRealm: "/rest/base/v1/realm",
    //启停安全域
    updateRealmStatus: "/rest/base/v1/realm",
    //获取安全域地址列表
    getRealms: "/rest/base/v1/realm",
    //通过id获取该安全域的详细信息
    getCurRealmById: "rest/base/v1/realm",
    //所有者属性唯一性验证的url
    checkOnlyUser: "rest/base/v1/user/unique_info"

};
exports.urls = realmRestApis;
//获取安全域
exports.getRealms = function (req, res, condition) {
    return restUtil.authRest.get(
        {
            url: realmRestApis.getRealms,
            req: req,
            res: res
        }, condition, {
            success: function (eventEmitter, data) {
                //处理数据
                var realmListObj = data;
                if (_.isObject(realmListObj)) {
                    var curRealmList = realmListObj.data;
                    for (var i = 0, len = curRealmList.length; i < len; i++) {
                        curRealmList[i] = Realm.toFrontObject(curRealmList[i]);
                    }
                    realmListObj.data = curRealmList;
                }
                eventEmitter.emit("success", realmListObj);
            }
        });
};
//通过id获取该安全域的详细信息
exports.getCurRealmById = function (req, res, realmId) {
    return restUtil.authRest.get(
        {
            url: realmRestApis.getCurRealmById + "/" + realmId,
            req: req,
            res: res
        }, null, {
            success: function (eventEmitter, data) {
                //处理数据
                eventEmitter.emit("success", Realm.toFrontObject(data));
            }
        });
};
//添加安全域
exports.addRealm = function (req, res, frontRealm) {
    var restRealm = Realm.toRestObject(frontRealm);
    return restUtil.authRest.post(
        {
            url: realmRestApis.addRealm,
            req: req,
            res: res,
            timeout: 60 * 1000
        },
        restRealm,
        {
            success: function (eventEmitter, data) {
                if (data) {
                    //为新增数据增加taskId属性
                    frontRealm.taskId = data;
                    eventEmitter.emit("success", frontRealm);
                }


            }
        });
};
//添加所有者
exports.addOwner = function (req, res, frontOwner) {
    return restUtil.authRest.post(
        {
            url: realmRestApis.addOwner + "/" + frontOwner.realm_id,
            req: req,
            res: res,
            timeout: 60 * 1000
        },
        frontOwner,
        {
            success: function (eventEmitter, data) {
                //处理数据
                eventEmitter.emit("success", data);
            }
        });
};
//修改安全域
exports.editRealm = function (req, res, frontRealm) {
    var editRealm = {};
    if (frontRealm.status || frontRealm.status == 0) {
        //启用、停用的修改
        editRealm = Realm.toRestStatusObject(frontRealm);
    } else {
        editRealm = Realm.toRestObject(frontRealm);
    }
    return restUtil.authRest.put(
        {
            url: realmRestApis.modifyRealm,
            req: req,
            res: res
        },
        editRealm, {
            success: function (eventEmitter, data) {
                //处理数据
                frontRealm.owner = data.owner;
                eventEmitter.emit("success", frontRealm);
            }
        }
    );
};

//启停安全域
exports.updateRealmStatus = function (req, res, frontRealm) {
    var flag = frontRealm.status == 0 ? "disable" : "enable";//成员的启停
    return restUtil.authRest.put(
        {
            url: realmRestApis.updateRealmStatus + "/" + frontRealm.id + "/status/" + flag,
            req: req,
            res: res
        }, null);
};


