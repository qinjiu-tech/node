/**
 * Copyright (c) 2015-2018 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2015-2018 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by zhangshujuan on 2019/4/4.
 */
import {Input} from 'antd';
const APPLYAPPROVE_LAYOUT = {
    TOPANDBOTTOM: 64,
    PADDINGHEIGHT: 24,
    TABTITLE: 36
};
exports.APPLYAPPROVE_LAYOUT = APPLYAPPROVE_LAYOUT;
exports.calculateHeight = function() {
    return $(window).height() - APPLYAPPROVE_LAYOUT.TOPANDBOTTOM;
};
export const ALL_COMPONENTS = {
    INPUT: 'Input',

};
export const ALL_COMPONENTS_TYPE = {
    TEXTAREA: 'textarea',

};
exports.applyComponentsType = [{
    name: ALL_COMPONENTS.INPUT,
    component: Input
}];
exports.CONDITION_KEYS = [
    {name: Intl.get('user.duration', '时长'), value: 'timeRange', conditionRule: function (item) {
        item['conditionRule'] = item['rangeLimit'] + item['rangeNumber'];
        item['conditionInverseRule'] = item['inverseCondition'] + item['rangeNumber'];
        item['conditionRuleDsc'] = item['rangeLimitDsc'] + item['rangeNumberDsc'];
    }},
    {name: Intl.get('apply.condition.item.money', '金额'), value: 'money'}
];
exports.FLOW_TYPES = {
    DEFAULTFLOW: 'defaultFlow'
};