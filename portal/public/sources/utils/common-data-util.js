import {getUserData, setUserData} from '../user-data';
import crmAjax from 'MOD_DIR/crm/public/ajax/index';
import appAjaxTrans from 'MOD_DIR/common/public/ajax/app';
import teamAjaxTrans from 'MOD_DIR/common/public/ajax/team';
import {storageUtil} from 'ant-utils';
import {traversingTeamTree, getParamByPrivilege} from 'PUB_DIR/sources/utils/common-method-util';
import {hasPrivilege} from 'CMP_DIR/privilege/checker';
import {message} from 'antd';
import {phoneMsgEmitter} from 'PUB_DIR/sources/utils/emitters';
const session = storageUtil.session;
// 缓存在sessionStorage中的座席号的key
const sessionCallNumberKey = 'callNumber';
let appList = [];
//oplate中的应用+客套中的产品列表
let allProductList = [];
//已集成的产品列表
let integrationProductList = [];
let dealStageList = [];
let allUserList = [];
//缓存在sessionStorage中的我能查看的团队
const MY_TEAM_TREE_KEY = 'my_team_tree';
const AUTH_MAP = {
    ALL_TEAM_AUTH: 'GET_TEAM_LIST_ALL'//管理员获取所有团队树的权限
};
import {DIFF_TYPE_LOG_FILES, AM_AND_PM} from './consts';
import {isEqualArray} from 'LIB_DIR/func';
// 获取拨打电话的座席号
exports.getUserPhoneNumber = function(cb) {
    let user_id = getUserData().user_id;
    let callNumberObj = {};
    let storageObj = JSON.parse(session.get(sessionCallNumberKey));
    let callNumber = storageObj && storageObj[user_id] ? storageObj[user_id] : '';
    if (callNumber) {
        callNumberObj.callNumber = callNumber;
        cb(callNumberObj);
    } else {
        crmAjax.getUserPhoneNumber(user_id).then((result) => {
            if (result.phone_order) {
                let storageCallNumberObj = {};
                storageCallNumberObj[user_id] = result.phone_order;
                session.set(sessionCallNumberKey, JSON.stringify(storageCallNumberObj));
                callNumberObj.callNumber = result.phone_order;
                cb(callNumberObj);
            }
        }, (errMsg) => {
            callNumberObj.errMsg = errMsg || Intl.get('crm.get.phone.failed', ' 获取座机号失败!');
            cb(callNumberObj);
        });
    }
};
//获取oplate中的应用
exports.getAppList = function(cb) {
    if (_.get(appList, '[0]')) {
        if (_.isFunction(cb)) cb(appList);
    } else {
        appAjaxTrans.getGrantApplicationListAjax().sendRequest({integration: true, page_size: 1000}).success(result => {
            let list = [];
            if (_.get(result, '[0]')) {
                list = result.map(function(app) {
                    return {
                        app_id: app.app_id,
                        app_name: app.app_name,
                        app_logo: app.app_logo,
                    };
                });
            }
            appList = list;
            if (_.isFunction(cb)) cb(appList);
        }).error(errorMsg => {
            appList = [];
            if (_.isFunction(cb)) cb(appList, errorMsg);
        });
    }
};
//获取订单\合同中的产品列表,所有的产品列表，包括：集成+自己添加的
exports.getAllProductList = function(cb) {
    if (_.get(allProductList, '[0]')) {
        if (_.isFunction(cb)) cb(allProductList);
    } else {
        appAjaxTrans.getGrantApplicationListAjax().sendRequest().success(result => {
            let list = [];
            if (_.get(result, '[0]')) {
                list = result.map(function(app) {
                    return {
                        client_id: app.app_id,
                        client_name: app.app_name,
                        client_image: app.app_logo,
                    };
                });
            }
            allProductList = list;
            if (_.isFunction(cb)) cb(allProductList);
        }).error(errorMsg => {
            allProductList = [];
            if (_.isFunction(cb)) cb(allProductList, errorMsg);
        });
    }
};
//获取所有的成员列表
exports.getAllUserList = function(cb) {
    if (_.get(allUserList, '[0]')) {
        if (_.isFunction(cb)) cb(allUserList);
    } else {
        $.ajax({
            url: '/rest/user',
            type: 'get',
            dataType: 'json',
            data: {},
            success: result => {
                if (_.isArray(result.data)){
                    allUserList = _.filter(result.data, sales => sales && sales.status === 1);
                    if (_.isFunction(cb)) cb(allUserList);
                }
            },
            error: xhr => {
                allUserList = [];
                if (_.isFunction(cb)) cb(allUserList);
            }
        });
    }
};
//获取我能看的团队树
exports.getMyTeamTreeList = function(cb) {
    let teamTreeList = getUserData().my_team_tree || [];
    if (_.get(teamTreeList, '[0]')) {
        if (_.isFunction(cb)) cb({teamTreeList});
    } else {
        const reqData = getParamByPrivilege();
        teamAjaxTrans.getMyTeamTreeListAjax().sendRequest({
            type: reqData.type,
        }).success(function(teamTreeList) {
            if (_.isFunction(cb)) cb({teamTreeList});
            //保存到userData中
            setUserData(MY_TEAM_TREE_KEY, teamTreeList);
        }).error(errorMsg => {
            teamTreeList = [];
            if (_.isFunction(cb)) cb({teamTreeList, errorMsg});
            //保存到userData中
            setUserData(MY_TEAM_TREE_KEY, teamTreeList);
        });
    }
};

//获取平铺的和树状团队列表
exports.getMyTeamTreeAndFlattenList = function(cb,flag) {
    let teamTreeList = getUserData().my_team_tree || [];
    let teamList = [];
    if (_.get(teamTreeList, '[0]')) {
        traversingTeamTree(teamTreeList, teamList,flag);
        if (_.isFunction(cb)) cb({teamTreeList, teamList});
    } else {
        const reqData = getParamByPrivilege();
        teamAjaxTrans.getMyTeamTreeListAjax().sendRequest({
            type: reqData.type,
        }).success(function(treeList) {
            if (_.get(treeList, '[0]')) {
                teamTreeList = treeList;
                //遍历团队树取出我能看的所有的团队列表list
                traversingTeamTree(teamTreeList, teamList,flag);
            }
            if (_.isFunction(cb)) cb({teamTreeList, teamList});
            //保存到userData中
            setUserData(MY_TEAM_TREE_KEY, teamTreeList);
        }).error(errorMsg => {
            teamTreeList = [];
            if (_.isFunction(cb)) cb({teamTreeList, teamList, errorMsg});
            //保存到userData中
            setUserData(MY_TEAM_TREE_KEY, teamTreeList);
        });
    }
};

/* 拨号是否成功的处理
 * paramObj:{
 * errorMsg:获取座机号时的错误提示，
 * callNumber: 座席号，
 * contactName: 电话联系人名称，
 * phoneNumber: 拨打的电话号码，
 * customerId: 客户的id
 * }
 */
exports.handleCallOutResult = function(paramObj) {
    if (paramObj.errorMsg) {
        message.error(paramObj.errorMsg || Intl.get('crm.get.phone.failed', ' 获取座机号失败!'));
    } else {
        if (paramObj.callNumber) {
            let phoneNumber = paramObj.phoneNumber ? paramObj.phoneNumber.replace('-', '') : '';
            if (phoneNumber) {
                phoneMsgEmitter.emit(phoneMsgEmitter.SEND_PHONE_NUMBER,
                    {
                        contact: paramObj.contactName,
                        phone: phoneNumber
                    }
                );
                let reqData = {
                    from: paramObj.callNumber,
                    to: phoneNumber
                };
                crmAjax.callOut(reqData).then((result) => {
                    if (result.code === 0) {
                        message.success(Intl.get('crm.call.phone.success', '拨打成功'));
                    }
                }, (errMsg) => {
                    message.error(errMsg || Intl.get('crm.call.phone.failed', '拨打失败'));
                });
            }
        } else {
            message.error(Intl.get('crm.bind.phone', '请先绑定分机号！'));
        }
    }
};

//获取订单阶段列表
exports.getDealStageList = function(cb) {
    if (_.get(dealStageList, '[0]')) {
        if (_.isFunction(cb)) cb(dealStageList);
    } else {
        $.ajax({
            url: '/rest/sales_stage_list',
            type: 'get',
            dataType: 'json',
            success: data => {
                dealStageList = _.get(data, 'result[0]') ? data.result : [];
                if (_.isFunction(cb)) cb(dealStageList);
            },
            error: xhr => {
                dealStageList = [];
                if (_.isFunction(cb)) cb(dealStageList);
            }
        });
    }
};

//将文件分为客户资料和各种类型的报告
exports.seperateFilesDiffType = function(fileList) {
    var allUploadFiles = {
        customerFiles: [],//销售添加申请时上传的文件
        customerAddedFiles: [],//销售在申请确认之前补充上传的文件
        approverUploadFiles: []//支持部上传的文件
    };
    if (_.isArray(fileList)){
        allUploadFiles.customerFiles = _.filter(fileList, item => item.log_type === DIFF_TYPE_LOG_FILES.SALE_UPLOAD);
        allUploadFiles.customerAddedFiles = _.filter(fileList, item => item.log_type === DIFF_TYPE_LOG_FILES.SALE_UPLOAD_NEW);
        allUploadFiles.approverUploadFiles = _.filter(fileList, item => item.log_type === DIFF_TYPE_LOG_FILES.APPROVER_UPLOAD);
    }
    return allUploadFiles;
};
//标识是否已经确认过审批,因为文件类型和舆情报告前面是有两个节点
exports.hasApprovedReportAndDocumentApply = function(approverIds) {
    if (_.isArray(approverIds)){
        return approverIds.length === 2;
    }else{
        return false;
    }
};

function calculateTimeRange(beginType,endType) {
    var timeRange = '';
    if (beginType === endType){
        timeRange = 0.5;
    }else if (beginType === AM_AND_PM.AM && endType === AM_AND_PM.PM){
        timeRange = 1;
    }
    return timeRange;

}
//计算两个日期中间相隔的天数
exports.calculateTotalTimeRange = (formData) => {
    var beginTime = formData.begin_time,beginType = formData.begin_type,endTime = formData.end_time,endType = formData.end_type;
    var timeRange = '';
    //如果开始和结束时间是同一天的
    var isSameDay = moment(beginTime).isSame(endTime, 'day');
    if (isSameDay){
        timeRange = calculateTimeRange(beginType,endType);
    }else {
        //相差几天
        timeRange = moment(endTime).diff(moment(beginTime), 'days');
        timeRange += calculateTimeRange(beginType,endType);
    }
    return timeRange;
};
function showAmAndPmDes(time){
    var des = '';
    if (time === AM_AND_PM.AM){
        des = Intl.get('apply.approve.leave.am', '上午');
    }else if (time === AM_AND_PM.PM){
        des = Intl.get('apply.approve.leave.pm', '下午');
    }
    return des;
}
exports.handleTimeRange = function(start,end){
    var beginTimeArr = start.split('_');
    var endTimeArr = end.split('_');
    var leaveTime = _.get(beginTimeArr,[0]);
    if (isEqualArray(beginTimeArr,endTimeArr)){
        leaveTime += showAmAndPmDes(_.get(beginTimeArr,[1]));
    }else if (_.get(beginTimeArr,[0]) !== _.get(endTimeArr,[0])){
        leaveTime += showAmAndPmDes(_.get(beginTimeArr,[1]));
        leaveTime = leaveTime + ' — ' + _.get(endTimeArr,[0]);
        leaveTime += showAmAndPmDes(_.get(endTimeArr,[1]));
    }
    return leaveTime;
};
exports.calculateRangeType = function() {
    //今天上午12点前请假，默认请假时间选今天一天，下午12点到6点请假，默认请今天一下午，6点之后请假，默认请明天一天
    var newSetting = {};
    var curHour = moment().hours();
    if (curHour >= 0 && curHour < 12) {
        newSetting.begin_type = AM_AND_PM.AM;
        newSetting.end_type = AM_AND_PM.PM;
    } else if (curHour >= 12 && curHour < 18) {
        newSetting.begin_type = AM_AND_PM.PM;
        newSetting.end_type = AM_AND_PM.PM;
    } else if (curHour >= 18 && curHour < 24) {
        newSetting.begin_type = AM_AND_PM.AM;
        newSetting.end_type = AM_AND_PM.PM;
        newSetting.begin_time = moment().add(1, 'day').valueOf();
        newSetting.end_time = moment().add(1, 'day').valueOf();
    }
    return newSetting;
};

//获取集成配置
exports.getIntegrationConfig = function(cb) {
    //集成配置信息{type: matomo、oplate、uem}
    let integrationConfig = getUserData().integration_config;
    if (integrationConfig) {
        if (_.isFunction(cb)) cb(integrationConfig);
    } else {
        const userProperty = 'integration_config';
        $.ajax({
            url: '/rest/global/integration/config',
            type: 'get',
            dataType: 'json',
            success: data => {
                if (_.isFunction(cb)) cb(data);
                //保存到userData中
                setUserData(userProperty, data);
            },
            error: xhr => {
                if (_.isFunction(cb)) cb({errorMsg: xhr.responseJSON});
            }
        });
    }
};
//获取已集成的产品列表
exports.getProductList = function(cb, isRefresh) {
    //需要刷新产品列表或产品列表中没有数据时，发请求获取已集成的产品列表
    if(isRefresh || !_.get(integrationProductList, '[0]')){
        $.ajax({
            url: '/rest/product',
            type: 'get',
            dataType: 'json',
            data: {
                page_size: 1000, //为确保能获取到全部的产品，所以传了个比较大的数1000
                integration: true //集成的应用
            },
            success: result => {
                integrationProductList = _.get(result, 'list', []);
                if (_.isFunction(cb)) cb(integrationProductList);
            },
            error: xhr => {
                integrationProductList = [];
                if (_.isFunction(cb)) cb(integrationProductList);
            }
        });
    } else {
        if (_.isFunction(cb)) cb(integrationProductList);
    }
};
