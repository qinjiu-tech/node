/**
 * Copyright (c) 2016-2017 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2016-2017 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by zhangshujuan on 2017/5/11.
 */
//获取客户跟踪记录列表
exports.getCustomerTraceRecordList = function(queryObj) {
    var Deferred = $.Deferred();
    $.ajax({
        url : '/rest/customer/get_customer_trace_list',
        dataType : 'json',
        type : 'post',
        data : queryObj,
        success : function(data) {
            Deferred.resolve(data);
        },
        error : function(xhr) {
            Deferred.reject(xhr.responseJSON || Intl.get("customer.fail.get.customer.trace", "获取客户跟踪记录列表失败"));
        }
    });
    return Deferred.promise();
};
//增加客户跟踪记录
exports.addCustomerTrace = function(queryObj) {
    var Deferred = $.Deferred();
    $.ajax({
        url : '/rest/customer/add_customer_trace_list',
        dataType : 'json',
        type : 'post',
        data : queryObj,
        success : function(data) {
            Deferred.resolve(data);
        },
        error : function(xhr) {
            Deferred.reject(xhr.responseJSON || Intl.get("customer.fail.add.customer.trace", "增加客户跟踪记录列表失败"));
        }
    });
    return Deferred.promise();

};
//更新客户跟踪记录
exports.updateCustomerTrace = function(queryObj) {

    var Deferred = $.Deferred();
    $.ajax({
        url : '/rest/customer/update_customer_trace_list',
        dataType : 'json',
        type : 'put',
        data : queryObj,
        success : function(data) {
            Deferred.resolve(data);
        },
        error : function(xhr) {
            Deferred.reject(xhr.responseJSON || Intl.get("fail.add.customer.trace", "更新客户跟踪记录列表失败"));
        }
    });
    return Deferred.promise();

};
