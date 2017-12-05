/**
 * Copyright (c) 2016-2017 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2016-2017 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by zhangshujuan on 2017/10/16.
 */
var clueCustomerAjax = require("../ajax/clue-customer-ajax");
var scrollBarEmitter = require("PUB_DIR/sources/utils/emitters").scrollBarEmitter;
let userData = require("PUB_DIR/sources/user-data");
function ClueCustomerActions() {
    this.generateActions(
        "setCurrentCustomer",
        "setPageNum",
        "afterAddSalesClue",
        "getClueCustomerList",//获取线索客户列表
        "getSalesManList",//获取销售团队列表
        "addCluecustomerTrace",//添加或者更新跟进内容
        "distributeCluecustomerToSale",//分配线索客户给某个销售
        "setLastCustomerId",//用于设置下拉加载的最后一个客户的id
        "setTimeRange",//设置开始和结束时间
        "setFilterType",//设置筛选线索客户的类型
        "setStatusLoading",
        "setEdittingStatus",//是否是在编辑跟进内容状态
        "setSalesMan",//获取销售人员及团队的id
        "setSalesManName",//获取销售人员及团队的名字
        "setUnSelectDataTip",//未选择销售人员的提醒信息
        "afterEditCustomerDetail"//修改线索客户完成后更新列表中的信息
    );
    //获取线索客户列表
    this.getClueCustomerList = function (clueCustomerTypeFilter, rangParams, pageSize, sorter, lastCustomerId) {
        if (!lastCustomerId){
            this.dispatch({error: false, loading: true});
        }
        clueCustomerAjax.getClueCustomerList(clueCustomerTypeFilter, rangParams, pageSize, sorter, lastCustomerId).then((result) => {
            scrollBarEmitter.emit(scrollBarEmitter.HIDE_BOTTOM_LOADING);
            this.dispatch({error: false, loading: false, clueCustomerObj: result})
        }, (errorMsg) => {
            this.dispatch({
                error: true,
                loading: false,
                errorMsg: errorMsg || Intl.get("failed.to.get.clue.customer.list", "获取线索客户列表失败")
            });
        });
    };
    //联系人电话唯一性的验证
    this.checkOnlyContactPhone = function (phone, callback) {
        clueCustomerAjax.checkOnlyCustomer({phone: phone}).then(function (data) {
            if (callback) {
                callback(data);
            }
        }, function (errorMsg) {
            if (callback) {
                callback(errorMsg || Intl.get("crm.194", "联系人电话唯一性验证失败"));
            }
        });
    };
    //获取销售列表
    this.getSalesManList = function (cb) {
        var _this = this;
        let ajaxFunc = null;
        if (userData.isSalesManager()) {
            //销售领导、域管理员角色时，客户所属销售下拉列表的数据获取
            ajaxFunc = clueCustomerAjax.getSalesManList();
        }
        if (ajaxFunc) {
            ajaxFunc.then(function (list) {
                _this.dispatch(list);
                if (cb) cb();
            }, function (errorMsg) {
                console.log(errorMsg);
            });
        }
    };
    //添加或更新跟进内容
    this.addCluecustomerTrace = function (submitObj,callback) {
        this.dispatch({error: false, loading: true});
        clueCustomerAjax.addCluecustomerTrace(submitObj).then((result)=>{
            this.dispatch({error: false, loading: false, submitTip: result});
            _.isFunction(callback) && callback();
        },(errorMsg)=>{
            this.dispatch({error: true, loading: false, errorMsg: errorMsg || Intl.get("failed.submit.trace.content","添加跟进内容失败")})
        })
    };
    //把线索客户分配给对应的销售
    this.distributeCluecustomerToSale = function (submitObj,callback) {
        this.dispatch({error: false, loading: true});
        clueCustomerAjax.distributeCluecustomerToSale(submitObj).then((result)=>{
            this.dispatch({error: false, loading: false});
            _.isFunction(callback) && callback();
        },(errorMsg)=>{
            this.dispatch({error: true, loading: false});
            _.isFunction(callback) && callback({errorMsg: errorMsg || Intl.get("failed.distribute.cluecustomer.to.sales","把线索客户分配给对应的销售失败")});
        })
    };
}
module.exports = alt.createActions(ClueCustomerActions);