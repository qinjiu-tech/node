/**
 * Copyright (c) 2015-2018 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2015-2018 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by zhangshujuan on 2018/9/10.
 */
var LeaveApplyService = require('../service/leave-apply-service');

exports.getAllLeaveApplyList = function(req, res) {
    LeaveApplyService.getAllLeaveApplyList(req, res).on('success', function(data) {
        data = handleNodata(data);
        res.status(200).json(data);
    }).on('error', function(codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};
function handleNodata(data) {
    if (!data){
        data = {
            list: [],
            total: 0
        };
    }
    return data;
}
exports.getWorklistLeaveApplyList = function(req, res) {
    LeaveApplyService.getWorklistLeaveApplyList(req, res).on('success', function(data) {
        data = handleNodata(data);
        res.status(200).json(data);
    }).on('error', function(codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};
exports.addLeaveApply = function(req, res) {
    LeaveApplyService.addLeaveApply(req, res).on('success', function(data) {
        data = handleNodata(data);
        res.status(200).json(data);
    }).on('error', function(codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};
exports.getLeaveApplyDetailById = function(req, res) {
    LeaveApplyService.getLeaveApplyDetailById(req, res).on('success', function(data) {
        res.status(200).json(data);
    }).on('error', function(codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};
exports.getLeaveApplyComments = function(req, res) {
    LeaveApplyService.getLeaveApplyComments(req, res).on('success', function(data) {
        res.status(200).json(data);
    }).on('error', function(codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};
exports.addLeaveApplyComments = function(req, res) {
    LeaveApplyService.addLeaveApplyComments(req, res).on('success', function(data) {
        res.status(200).json(data);
    }).on('error', function(codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};
exports.approveLeaveApplyPassOrReject = function(req, res) {
    LeaveApplyService.approveLeaveApplyPassOrReject(req, res).on('success', function(data) {
        res.status(200).json(data);
    }).on('error', function(codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};
exports.getLeaveApplyStatusById = function(req, res) {
    LeaveApplyService.getLeaveApplyStatusById(req, res).on('success', function(data) {
        res.status(200).json(data);
    }).on('error', function(codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};