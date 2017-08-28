
"use strict";

var  userAuditLog = require("../service/user_audit_log.service");

// 获取用户审计日志列表
exports.getUserLogList = function (req, res) {
    userAuditLog.getUserLogList(req, res, req.query).on("success", function (data) {
        res.status(200).json(data);
    }).on("error", function (codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};

// 获取单个用户审计日志列表
exports.getSingleAuditLogList = function (req, res) {
    userAuditLog.getSingleAuditLogList(req, res,  req.query, req.params.user_id).on("success", function (data) {
        res.status(200).json(data);
    }).on("error", function (codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};

// 用户登录信息（时长、次数、首次和最后一次登录时间、登录时长统计、登录频次统计）
exports.getUserLoginInfo = function(req, res){
    let obj = req.query;
    obj.user_id = req.params.user_id;
    userAuditLog.getUserLoginInfo(req, res, obj).on("success", function (data) {
        res.status(200).json(data);
    }).on("error", function (codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};
