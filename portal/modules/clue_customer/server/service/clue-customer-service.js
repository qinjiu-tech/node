/**
 * Copyright (c) 2016-2017 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2016-2017 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by zhangshujuan on 2017/10/16.
 */
'use strict';
//上传超时时长
var uploadTimeOut = 5 * 60 * 1000;
var restLogger = require('../../../../lib/utils/logger').getLogger('rest');
var restUtil = require('ant-auth-request').restUtil(restLogger);
const restApis = {
    //获取线索来源
    getClueSource: '/rest/customer/v2/clue/clue_source/100/1',
    //获取线索渠道
    getClueChannel: '/rest/customer/v2/clue/access_channel/100/1',
    //获取线索分类
    getClueClassify: '/rest/customer/v2/clue/clue_classify/100/1',
    //查询线索客户用户查询
    queryCluecustomer: '/rest/customer/v2/clue/query/user',
    //查询线索客户 管理员查询
    queryCluecustomerManager: '/rest/customer/v2/clue/query/manager',
    //添加跟进内容
    addCluecustomerTrace: '/rest/customer/v2/clue/trace',
    //把线索客户分配给对应的销售
    distributeCluecustomerToSale: '/rest/customer/v2/clue/distribute/:type',
    //对线索客户的详情进行更新
    updateCluecustomerDetail: '/rest/customer/v2/clue/update/:type/:updateItem',
    //线索名、电话唯一性验证
    checkOnlySalesClue: '/rest/customer/v2/clue/repeat/search',
    //将线索和客户进行关联
    RelateClueAndCustomer: '/rest/customer/v2/clue/:type/customer_clue_relation',
    //导入线索
    upload: '/rest/customer/v2/clue/upload/preview',
    //确认导入线索预览
    uploadClueConfirm: '/rest/customer/v2/clue/upload/confirm/:flag',
    //删除某条线索
    deleteRepeatClue: 'rest/customer/v2/clue/upload/preview/:index',
    //获取线索分析
    getClueAnalysis: '/rest/analysis/customer/v2/clue/customer/label',
    //获取线索统计
    getClueStatics: '/rest/customer/v2/clue/:type/statistical/:field/:page_size/:num',
    //获取线索趋势统计
    getClueTrendStatics: '/rest/analysis/customer/v2/:type/clue/trend/statistic',
    //线索的全文搜索
    getClueFulltext: '/rest/customer/v2/clue/query/fulltext/:type/:page_size/:sort_field/:order',
    //获取线索的动态
    getClueDynamic: '/rest/customer/v2/customerdynamic/clue/:clue_id/:page_size',
    //根据线索的id查询线索的详情
    getClueDetailById: '/rest/customer/v2/clue/query/clue/:clueId',
    //删除某个线索
    deleteClueById: '/rest/customer/v2/clue/delete',
};
//查询客户
exports.getClueCustomerList = function(req, res) {
    let queryObj = {};
    queryObj.query = JSON.parse(req.body.clueCustomerTypeFilter);
    let baseUrl = restApis.queryCluecustomer;
    if (req.body.hasManageAuth){
        baseUrl = restApis.queryCluecustomerManager;
    }
    baseUrl = baseUrl + '/' + req.params.pageSize + '/' + req.params.sortField + '/' + req.params.sortOrder;
    if (req.body.lastCustomerId) {
        baseUrl += '?id=' + req.body.lastCustomerId;
    }
    queryObj.rang_params = JSON.parse(req.body.rangParams);
    return restUtil.authRest.post(
        {
            url: baseUrl,
            req: req,
            res: res
        }, queryObj);
};
//获取线索来源
exports.getClueSource = function(req, res) {
    return restUtil.authRest.get(
        {
            url: restApis.getClueSource,
            req: req,
            res: res
        }, null);
};
//获取线索渠道
exports.getClueChannel = function(req, res) {
    return restUtil.authRest.get(
        {
            url: restApis.getClueChannel,
            req: req,
            res: res
        }, null);
};
//获取线索分类
exports.getClueClassify = function(req, res) {
    return restUtil.authRest.get(
        {
            url: restApis.getClueClassify,
            req: req,
            res: res
        }, null);
};
//添加跟进内容
exports.addCluecustomerTrace = function(req, res) {
    return restUtil.authRest.post(
        {
            url: restApis.addCluecustomerTrace,
            req: req,
            res: res
        }, req.body);
};
//把线索客户分配给对应的销售
//添加跟进内容
exports.distributeCluecustomerToSale = function(req, res) {
    var queryObj = req.body;
    var type = 'user';
    if (queryObj.hasDistributeAuth){
        type = 'manager';
    }
    delete queryObj.hasDistributeAuth;
    return restUtil.authRest.post(
        {
            url: restApis.distributeCluecustomerToSale.replace(':type',type),
            req: req,
            res: res
        }, queryObj);
};
//对线索客户的详情进行更新
exports.updateCluecustomerDetail = function(req, res) {
    var updateItem = req.body.updateItem;
    //添加的时候的字段是weChat，更新该字段的时候是wechat
    if (updateItem === 'weChat'){
        updateItem = 'wechat';
    }
    return restUtil.authRest.put(
        {
            url: restApis.updateCluecustomerDetail.replace(':type', req.body.type).replace(':updateItem', updateItem),
            req: req,
            res: res
        }, JSON.parse(req.body.updateObj));
};

//线索名、电话唯一性验证
exports.checkOnlySalesClue = function(req, res) {
    return restUtil.authRest.get(
        {
            url: restApis.checkOnlySalesClue,
            req: req,
            res: res
        }, req.query);
};
//将线索和客户进行关联
exports.relateClueAndCustomer = function(req, res) {
    return restUtil.authRest.put(
        {
            url: restApis.RelateClueAndCustomer.replace(':type',req.params.type),
            req: req,
            res: res
        }, req.body);
};
//上传线索
exports.uploadClues = function(req, res) {
    return restUtil.authRest.post({
        url: restApis.upload,
        req: req,
        res: res,
        gzip: true,
        'pipe-upload-file': true,
        timeout: uploadTimeOut
    }, null);
};
//上传线索预览
exports.confirmUploadClues = function(req, res) {
    return restUtil.authRest.get(
        {
            url: restApis.uploadClueConfirm.replace(':flag',req.params.flag),
            req: req,
            res: res
        }, null);
};
//删除某个重复线索
exports.deleteRepeatClue = function(req, res) {
    return restUtil.authRest.del(
        {
            url: restApis.deleteRepeatClue.replace(':index',req.params.index),
            req: req,
            res: res
        }, null);
};
//线索分析
exports.getClueAnalysis = function(req, res) {
    return restUtil.authRest.post(
        {
            url: restApis.getClueAnalysis,
            req: req,
            res: res
        }, req.body);
};
exports.getClueStatics = function(req, res) {
    let queryObj = {};
    queryObj.rang_params = JSON.parse(req.body.rangParams);
    //销售取值时，query参数必须有，管理员可以没有
    if (req.body.query){
        queryObj.query = JSON.parse(req.body.query);
    }else{
        queryObj.query = {};
    }
    return restUtil.authRest.post({
        url: restApis.getClueStatics.replace(':type',req.params.type).replace(':field',req.params.field).replace(':page_size',req.params.page_size).replace(':num',req.params.num),
        req: req,
        res: res
    }, queryObj);

};
//线索趋势统计
exports.getClueTrendStatics = function(req, res) {
    var url = restApis.getClueTrendStatics.replace(':type', req.params.type);
    if (req.body.start_time || req.body.start_time === 0){
        url += `?start_time=${req.body.start_time}`;
    }
    if (req.body.end_time){
        url += `&end_time=${req.body.end_time}`;
    }
    if (req.body.field){
        url += `&field=${req.body.field}`;
    }
    if (req.body.interval){
        url += `&interval=${req.body.interval}`;
    }
    return restUtil.authRest.get(
        {
            url: url,
            req: req,
            res: res
        }, null);
};
//线索全文搜索
exports.getClueFulltext = function(req, res) {
    var reqBody = req.body;
    var rangeParams = JSON.parse(reqBody.rangeParams);
    var typeFilter = JSON.parse(reqBody.typeFilter);
    var url = restApis.getClueFulltext.replace(':type',req.params.type).replace(':page_size',req.params.page_size).replace(':sort_field',req.params.sort_field).replace(':order',req.params.order);
    if (rangeParams[0].from){
        url += `?start_time=${rangeParams[0].from}`;
    }
    if (rangeParams[0].to){
        url += `&end_time=${rangeParams[0].to}`;
    }
    if (reqBody.keyword){
        var keyword = encodeURI(reqBody.keyword);
        url += `&keyword=${keyword}`;
    }
    if (reqBody.statistics_fields){
        url += `&statistics_fields=${reqBody.statistics_fields}`;
    }
    if (reqBody.lastClueId){
        url += `&id=${reqBody.lastClueId}`;
    }
    var bodyObj = {
        status: typeFilter.status
    };
    if (reqBody.userId){
        bodyObj.userId = reqBody.userId;
    }
    if (reqBody.id){
        bodyObj.id = reqBody.id;
    }
    return restUtil.authRest.post({
        url: url,
        req: req,
        res: res
    },bodyObj);
};
//获取动态列表
exports.getDynamicList = function(req, res) {
    var url = restApis.getClueDynamic.replace(':clue_id',req.params.clue_id).replace(':page_size',req.params.page_size);
    //todo 现在后端接口的下拉加载有问题
    // if (req.query.id){
    //     url += `?id=${req.query.id}`
    // }
    return restUtil.authRest.get(
        {
            url: url,
            req: req,
            res: res
        }, null);
};
//删除某条线索
exports.deleteClue = function(req, res) {
    return restUtil.authRest.del(
        {
            url: restApis.deleteClueById,
            req: req,
            res: res
        }, req.body);
};
//根据线索的id获取线索的详情
exports.getClueDetailById = function(req, res) {
    return restUtil.authRest.get(
        {
            url: restApis.getClueDetailById.replace(':clueId', req.params.clueId),
            req: req,
            res: res
        }, null);
};