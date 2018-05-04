const util = require("../utils/contact-util");
const crmAjax = require("../ajax");
const scheduleAjax = require('../ajax/schedule-ajax');
function CRMActions() {
    this.generateActions({
        'setBasicState': 'setBasicState',
        'afterHandleStatus': 'afterHandleStatus'
    });

    this.getBasicData = function (curCustomer) {
        var basicData = curCustomer || {};
        setTimeout(() => {
            this.dispatch(basicData);
        });
    };
    this.getCrmUserList = function (queryParams) {
        this.dispatch({errorMsg: "", loading: true});
        crmAjax.getCrmUserList(queryParams).then((result) => {
            this.dispatch({loading: false, errorMsg: "", result: result});
        }, (errorMsg) => {
            this.dispatch({loading: false, errorMsg: errorMsg || Intl.get("failed.get.crm.list", "获取客户列表失败")});
        });
    };
    this.getNotCompletedScheduleList = function (queryObj) {
        this.dispatch({loading: true, error: false});
        scheduleAjax.getScheduleList(queryObj).then((resData) => {
            this.dispatch({loading: false, error: false, data: resData});
        }, (errorMsg) => {
            this.dispatch({loading: false, error: true, errorMsg: errorMsg});
        });
    };
    //修改某条日程的状态
    this.handleScheduleStatus = function (reqData, cb) {
        scheduleAjax.handleScheduleStatus(reqData).then(function (resData) {
            cb(resData);
        }, (errMsg) => {
            cb(errMsg)
        });
    }
}

module.exports = alt.createActions(CRMActions);
