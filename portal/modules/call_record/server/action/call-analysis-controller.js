"use strict";

//通话分析
var callAnalysisService = require("../service/call-analysis-service");

// 获取单次通话时长为top10的数据
exports.getCallDurTopTen = function (req, res) {
    callAnalysisService.getCallDurTopTen(req, res, req.params, req.body).on("success",  (data) => {
        res.status(200).json(data);
    }).on("error", (codeMessage)  => {
        res.json(codeMessage && codeMessage.message);
    });
};

// 获取通话数量和通话时长趋势图统计
exports.getCallCountAndDur = function (req, res) {
    callAnalysisService.getCallCountAndDur(req, res, req.params, req.body).on("success",  (data) => {
        res.status(200).json(data);
    }).on("error", (codeMessage)  => {
        res.json(codeMessage && codeMessage.message);
    });
};

// 获取电话的接通情况
exports.getCallInfo = function (req, res) {
    callAnalysisService.getCallInfo(req, res, req.params, req.body).on("success", function (data) {
        res.status(200).json(data);
    }).on("error", function (codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};

// 通话记录中，114占比
exports.getCallRate = function (req, res) {
    callAnalysisService.getCallRate(req, res, req.params, req.body).on("success",  (data) => {
        res.status(200).json(data);
    }).on("error", (codeMessage)  => {
        res.json(codeMessage && codeMessage.message);
    });
};

// 获取团队信息
exports.getSaleGroupTeams = function (req, res) {
    callAnalysisService.getSaleGroupTeams(req, res, req.params).on("success",  (data) => {
        res.status(200).json(data);
    }).on("error", (codeMessage)  => {
        res.json(codeMessage && codeMessage.message);
    });
};

// 获取成员信息
exports.getSaleMemberList = function (req, res) {
    callAnalysisService.getSaleMemberList(req, res, req.params).on("success",  (data) => {
        res.status(200).json(data);
    }).on("error", (codeMessage)  => {
        res.json(codeMessage && codeMessage.message);
    });
};