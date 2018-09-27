/**
 * 客户分析
 */

import { getContextContent } from '../../utils';

//引入同目录下以.js结尾的并且不包含index的文件
const req = require.context('.', false, /^((?!index).)*\.js$/);

//分析页面
const pages = getContextContent(req);

module.exports = {
    title: '客户分析',
    menuIndex: 3,
    privileges: [
        'CUSTOMER_ANALYSIS_COMMON',
        'CUSTOMER_ANALYSIS_MANAGER',
    ],
    pages,
};

