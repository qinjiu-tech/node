// 根据客户id获取合同信息
let getContractByCustomerIdAjax = null;
exports.getContractByCustomerId = function(reqData, reqBody) {
    getContractByCustomerIdAjax && getContractByCustomerIdAjax.abort();
    let url = '/rest/crm/contract/' + reqData.pageSize + '/' + reqData.sortField + '/' + reqData.order;
    const Deferred = $.Deferred();
    getContractByCustomerIdAjax = $.ajax({
        url: url,
        dataType: 'json',
        type: 'post',
        data: {rangParams: JSON.stringify(reqBody)},
        success: (data) => {
            Deferred.resolve(data);
        },
        error: (xhr, textStatus) => {
            if (textStatus !== 'abort') {
                Deferred.reject(xhr.responseJSON);
            }
        }
    });
    return Deferred.promise();
};

// 添加合同
let addContractAjax = null;
exports.addContract = function(reqData, reqBody) {
    addContractAjax && addContractAjax.abort();
    let url = '/rest/crm/add/contract/' + reqData.type;
    const Deferred = $.Deferred();
    addContractAjax = $.ajax({
        url: url,
        dataType: 'json',
        type: 'post',
        data: {rangParams: JSON.stringify(reqBody)},
        success: (data) => {
            Deferred.resolve(data);
        },
        error: (xhr, textStatus) => {
            if (textStatus !== 'abort') {
                Deferred.reject(xhr.responseJSON);
            }
        }
    });
    return Deferred.promise();
};

// 删除待审合同
exports.deletePendingContract = function(id) {
    let Deferred = $.Deferred();
    $.ajax({
        url: '/rest/crm/delete/contract/' + id,
        dataType: 'json',
        type: 'delete',
        success: (data) => {
            Deferred.resolve(data);
        },
        error: (errorMsg) => {
            Deferred.reject(errorMsg.responseJSON);
        }
    });
    return Deferred.promise();
};

// 编辑待审合同
let editPendingContractAjax = null;
exports.editPendingContract = function(reqData, reqBody) {
    editPendingContractAjax && editPendingContractAjax.abort();
    let url = '/rest/crm/edit/contract/' + reqData.type;
    const Deferred = $.Deferred();
    editPendingContractAjax = $.ajax({
        url: url,
        dataType: 'json',
        type: 'put',
        data: {rangParams: JSON.stringify(reqBody)},
        success: (data) => {
            Deferred.resolve(data);
        },
        error: (xhr, textStatus) => {
            if (textStatus !== 'abort') {
                Deferred.reject(xhr.responseJSON);
            }
        }
    });
    return Deferred.promise();
};