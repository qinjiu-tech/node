/**
 * 辅助函数
 */

import { num as antUtilNum } from 'ant-utils';
import Store from './store';
const userData = require('PUB_DIR/sources/user-data');
const formatAmount = antUtilNum.formatAmount;
const querystring = require('querystring');

//获取导入的上下文中的文件内容
//req 为导入的上下文
//sortField 为排序字段
export function getContextContent(req, sortField = 'menuIndex') {
    //内容数组
    let content = [];

    //将通过require.context引入的文件的内容放入内容数组
    req.keys().forEach(key => {
        content.push(req(key));
    });

    //按排序字段值排序
    content = _.sortBy(content, sortField);

    return content;
}

//处理图表点击事件
export function handleChartClick(name, value, conditions) {
    let conditionObj = {};

    _.each(conditions, condition => {
        conditionObj[condition.name] = condition.value;
    });

    const query = {
        app_id: conditionObj.app_id,
        login_begin_date: conditionObj.start_time,
        login_end_date: conditionObj.end_time,
        analysis_filter_value: value,
        analysis_filter_field: name,
        customerType: conditionObj.tab,
    };

    const url = '/crm?' + querystring.stringify(query);

    //跳转到客户列表
    window.open(url);
}

//数字转百分比
export function numToPercent(num) {
    return (num * 100).toFixed(2) + '%';
}

//获取范围请求参数
export function getRangeReqData(rangeParams, multiple) {
    let reqData = [];

    rangeParams.forEach(rangeParam => {
        if (Array.isArray(rangeParam)) {
            reqData.push(...rangeParam.map(value => ({
                'from': value,
                'to': value
            })));
        }
        else {
            if (multiple) {
                rangeParam = _.mapValues(rangeParam, value => value * multiple);
            }
            reqData.push(rangeParam);
        }
    });

    return reqData;
}
    
//处理线索统计数据
export function processClueStatisticsData(isAvalibility, originData) {
    var data = [];
    _.forEach(originData, (dataItem) => {
        _.forEach(dataItem, (value, key) => {
            if (isAvalibility) {
                if (key === '0') {
                    key = Intl.get('clue.analysis.ability', '有效');
                }
                if (key === '1') {
                    key = Intl.get('clue.analysis.inability', '无效');
                }
            }
            data.push({
                'value': value,
                'name': key || Intl.get('common.unknown', '未知')
            });
        });
    });
    return data;
}

//将新增合同毛利统计数据中的值转成以万为单位的
export function processAmountData(data) {
    return _.map(data, item => {
        item.name = moment(item.timestamp).format(oplateConsts.DATE_FORMAT);
        item.value = formatAmount(item.value);
        return item;
    });
}

//是否选中的不是单个应用
export function ifNotSingleApp(conditions) {
    const appIdCondition = _.find(conditions, condition => condition.name === 'app_id');
    const appId = _.get(appIdCondition, 'value');

    if (appId && (appId.includes('all') || appId.includes(','))) {
        return true;
    } else {
        return false;
    }
}

//是否是要查看具体销售人员的数据
//普通销售自己登录或管理人员选择某些销售都属于这种情况
export function isSales() {
    return userData.getUserData().isCommonSales || Store.teamMemberFilterType === 'member'; 
}

//是否是管理员或运营人员
export function isAdminOrOpStaff() {
    const role = userData.ROLE_CONSTANS;
    const hasRole = userData.hasRole;

    return hasRole(role.OPERATION_PERSON) || hasRole(role.REALM_ADMIN);
}

//是否选择的是全部团队或成员
export function isSelectedAllTeamMember() {
    return Store.isSelectedAllTeamMember; 
}

//查询参数回调函数: 带下划线的开始结束时间转成不带下划线的
export function argCallbackUnderlineTimeToTime(arg) {
    let query = arg.query;

    if (query) {
        query.starttime = query.start_time;
        query.endtime = query.end_time;
        delete query.start_time;
        delete query.end_time;
    }
}

//查询参数回调函数: team_ids 转 team_id
export function argCallbackTeamIdsToTeamId(arg) {
    const query = arg.query;

    if (query) {
        if (query.team_ids) {
            query.team_id = query.team_ids;
            delete query.team_ids;
        }
    }
}

//查询参数回调函数: member_ids 转 member_id
export function argCallbackMemberIdsToMemberId(arg) {
    const query = arg.query;

    if (query) {
        if (query.member_ids) {
            query.member_id = query.member_ids;
            delete query.member_ids;
        }
    }
}

//查询参数回调函数: member_ids 转 sales_id
export function argCallbackMemberIdsToSalesId(arg) {
    const query = arg.query;

    if (query) {
        if (query.member_ids) {
            query.sales_id = query.member_ids;
            delete query.member_ids;
        }
    }
}
