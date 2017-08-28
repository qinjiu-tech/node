/**
 * 说明：统计分析-客户分析
 */
module.exports = {
    //页面路径
    path: 'analysis/customer',
    //实际渲染文件为public/index.js
    getComponent : function(location, cb) {
        require.ensure([], function(require){
            cb(null, require('./public'))
        })
    }
};
