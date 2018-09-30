/**
 * 辅助函数
 */

import { num as antUtilNum } from 'ant-utils';
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
        login_begin_date: conditionObj.starttime,
        login_end_date: conditionObj.endtime,
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
        item.value = formatAmount(item.value);
        return item;
    });
}
