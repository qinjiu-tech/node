/**
 * Copyright (c) 2016-2017 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2016-2017 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by zhangshujuan on 2017/5/11.
 */
var customerRecordAjax = require('../ajax/customer-record-ajax');
var scrollBarEmitter = require("../../../../public/sources/utils/emitters").scrollBarEmitter;
function CustomerRecordAction() {
    this.generateActions(
        'setType',
        'setContent',
        'setDetailContent',
        'setUpdateId',
        'setInitial',
        'dismiss',
        'setModalDialogFlag',
        'updateItem',
        'changeAddButtonType',
        'setContent',
        'setLoading'
    );
    //获取客户跟踪列表
    this.getCustomerTraceList = function(queryObj,callback) {
        customerRecordAjax.getCustomerTraceRecordList(queryObj).then((data) => {
            scrollBarEmitter.emit(scrollBarEmitter.HIDE_BOTTOM_LOADING);
            this.dispatch({loading:false,error:false,data:data});
            if(_.isFunction(callback)) callback();
        },(errorMsg)=>{
            this.dispatch({loading:false,error:true,errorMsg:errorMsg});
        });
    };
    //增加客户跟踪记录
    this.addCustomerTrace = function(queryObj, callback) {
        this.dispatch({loading:true,error:false});
        customerRecordAjax.addCustomerTrace(queryObj).then((data) => {
            this.dispatch({loading:false,error:false,data:data});
            _.isFunction(callback) && callback();
        },(errorMsg)=>{
            this.dispatch({loading:false,error:true,errorMsg:errorMsg});
        });
    };
    //更新客户跟踪记录
    this.updateCustomerTrace = function(queryObj, callback) {
        this.dispatch({loading:true,error:false});
        customerRecordAjax.updateCustomerTrace(queryObj).then((data) => {
            this.dispatch({loading:false,error:false,data:data});
            _.isFunction(callback) && callback();
        },(errorMsg)=>{
            this.dispatch({loading:false,error:true,errorMsg:errorMsg});
        });
    };
}
module.exports = alt.createActions(CustomerRecordAction);