/**
 * 公共常量
 */

//初始时间
export const initialTime = {
    range: 'week',
    start: moment().startOf('isoWeek').valueOf(),
    end: moment().valueOf(),
};

const intlUnknown = Intl.get('user.unknown', '未知');

//从 unknown 到 未知 的对应关系对象
export const unknownObj = {name: intlUnknown, key: 'unknown'};

//从 unknown 到 未知 的映射
export const unknownDataMap = {unknown: intlUnknown};

//用户类型
export const USER_TYPES = [
    {name: Intl.get('common.official', '签约'), key: 'formal', dataName: '正式用户'},
    {name: Intl.get('common.trial', '试用'), key: 'trial', dataName: '试用用户'},
    {name: Intl.get('user.type.presented', '赠送'), key: 'special'},
    {name: Intl.get('user.type.train', '培训'), key: 'training'},
    {name: Intl.get('user.type.employee', '员工'), key: 'internal'},
    unknownObj,
];

let userTypeDataObj = {};

_.each(USER_TYPES, userType => {
    const mapKey = userType.dataName || userType.key;
    userTypeDataObj[mapKey] = userType.name;
});

//用户类型名到中文的映射
export const userTypeDataMap = userTypeDataObj;

//带标题的用户类型名数组
export const USER_TYPES_WITH_TITLE = [{
    name: Intl.get('oplate.user.analysis.user.type', '用户类型'),
    key: 'name'
}]
    .concat(USER_TYPES)
    .concat([{
        name: Intl.get('operation.report.total.num', '总数'),
        key: 'total'
    }]);

//一周7天的中文名
export const WEEKDAY = [
    Intl.get('user.time.sunday', '周日'),
    Intl.get('user.time.monday', '周一'),
    Intl.get('user.time.tuesday', '周二'),
    Intl.get('user.time.wednesday', '周三'),
    Intl.get('user.time.thursday', '周四'),
    Intl.get('user.time.friday', '周五'),
    Intl.get('user.time.saturday', '周六')
];
