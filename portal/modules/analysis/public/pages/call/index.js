/**
 * 通话分析
 */

import { getContextContent } from '../../utils';

//引入同目录下以.js结尾的并且不包含index的文件
const req = require.context('.', false, /^((?!index).)*\.js$/);

//分析页面
const pages = getContextContent(req);

module.exports = {
    title: '通话分析',
    menuIndex: 6,
    privileges: [
        'CUSTOMER_CALLRECORD_STATISTIC_USER',
        'CUSTOMER_CALLRECORD_STATISTIC_MANAGER',
    ],
    pages,
};

