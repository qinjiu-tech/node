/**
 * Copyright (c) 2015-2018 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2015-2018 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by zhangshujuan on 2018/12/10.
 */
var trans = $.ajaxTrans();
trans.register('candidateList', {url: '/rest/get/apply/next/candidate', type: 'get'});
trans.register('transferNextCandidate', {url: '/rest/add/apply/new/candidate', type: 'post'});
trans.register('getApplyListApprovedByMe', {url: '/rest/get/myapproved/apply/list', type: 'get'});
trans.register('getApplyTaskNode', {url: '/rest/get/apply/node', type: 'get'});

exports.getNextCandidate = function(reqParams) {
    return trans.getAjax('candidateList', reqParams);
};
exports.transferNextCandidate = function(reqParams) {
    return trans.getAjax('transferNextCandidate', reqParams);
};

exports.getApplyListApprovedByMe = function(reqParams) {
    return trans.getAjax('getApplyListApprovedByMe', reqParams);
};
exports.getApplyTaskNode = function(reqParams) {
    return trans.getAjax('getApplyTaskNode', reqParams);
};