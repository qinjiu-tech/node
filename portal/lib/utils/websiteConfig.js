import routeList from "../../modules/common/route";
import ajax from "../../modules/common/ajax";

//设置网站个性化配置
var websiteConfig = {
    setWebsiteConfig: function (data, onSuccess, onError) {        
        const route = _.find(routeList, route => route.handler === "setWebsiteConfig");
        const arg = {
            url: route.path,
            type: route.method,
            data
        };
        ajax(arg).then(result => {
            const preStorage = JSON.parse(localStorage.getItem("websiteConfig"));
            const curStorage = $.extend({}, preStorage, data);
            localStorage.setItem("websiteConfig", JSON.stringify(curStorage));
            onSuccess(result);
        }, err => {
            onError(err);
        });
    },
    //设置某个模块是否被点击过
    setWebsiteConfigModuleRecord: function (data, onSuccess, onError) {
        const route = _.find(routeList, route => route.handler === "setWebsiteConfigModuleRecord");
        const arg = {
            url: route.path,
            type: route.method,
            data
        };
        ajax(arg).then(result => {
            if (_.isFunction(onSuccess)){
                onSuccess(result);
            }
        }, err => {
            if (_.isFunction(onError)){
                onError(err);
            }
        });
    },
    //获取网站个性化配置
    getWebsiteConfig: function (callback) {
        const route = _.find(routeList, route => route.handler === "getWebsiteConfig");
        const arg = {
            url: route.path,
            type: route.method
        };
        ajax(arg).then(result => {
            if (result && result.personnel_setting) {
                localStorage.websiteConfig = JSON.stringify(result.personnel_setting);
            }else if (result && !result.personnel_setting){
                localStorage.websiteConfig = JSON.stringify({});
            }
            //存储是否点击了某个模块
            if (result && result.module_record){
                if (_.isFunction(callback)){
                    callback(result.module_record);
                }
            }else if (result && !result.module_record){
                if (_.isFunction(callback)){
                    callback([]);
                }
            }
        });
    },

    //获取本地存储的自定义表格配置
    getLocalWebsiteConfig: () => {
        return JSON.parse(localStorage.getItem("websiteConfig"));
    }
}
module.exports = websiteConfig;