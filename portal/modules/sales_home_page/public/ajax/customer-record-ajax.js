/**
 * Copyright (c) 2016-2017 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2016-2017 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by zhangshujuan on 2018/3/12.
 */
/**
 * Copyright (c) 2016-2017 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2016-2017 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by zhangshujuan on 2017/5/11.
 */
//获取客户跟踪记录列表
exports.getCustomerTraceRecordList = function (queryObj) {
    var Deferred = $.Deferred();
    var id = '';
    if (queryObj.id){
        id = queryObj.id;
        delete queryObj.id;
    }
    $.ajax({
        url : '/rest/customer/get_customer_trace_list'+'?id='+id,
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
exports.addCustomerTrace = function (queryObj) {
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
exports.updateCustomerTrace = function (queryObj) {

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

import {hasPrivilege} from "CMP_DIR/privilege/checker";
//获取联系人列表
let contactListAjax;
exports.getContactList = function (customerId) {
    if (contactListAjax) {
        contactListAjax.abort();
    }
    let type = 'user';//CRM_USER_LIST_CONTACTS
    if (hasPrivilege("CRM_MANAGER_LIST_CONTACTS")) {
        type = 'manager';
    }
    var Deferred = $.Deferred();
    contactListAjax = $.ajax({
        url: `/rest/crm/contact_list/${type}`,
        dataType: 'json',
        type: 'post',
        data: {customer_id: customerId},
        success: function (result) {
            Deferred.resolve(result);
        },
        error: function (error, errorText) {
            if (errorText !== 'abort') {
                Deferred.reject(error && error.responseJSON || Intl.get("crm.contact.list.failed", "获取联系人列表失败"));
            }
        }
    });
    return Deferred.promise();

};