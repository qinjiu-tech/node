var path = require("path");
var LeftMenus = require(path.join(config_root_path, "menu.js"));
var auth = require(path.join(portal_root_path, "./lib/utils/auth"));
var treeWalk = require("tree-walk");
var _ = require("underscore");
var mapToObj = require(path.join(portal_root_path, "./lib/utils/mapToObj"));
var fs = require("fs");
var request = require("request");
var restLogger = require("../../../lib/utils/logger").getLogger('rest');
var pageLogger = require("../../../lib/utils/logger").getLogger('page');
var restUtil = require("../../../lib/rest/rest-util")(restLogger);
var EventEmitter = require('events');
function _getLeftMenus(req) {
    let leftMenus = new LeftMenus(req);
    return leftMenus.getLeftMenuList();
}
//获取权限对应
function _getPrivilegeModuleMap(req) {
    var map = {};
    let MenusAll = _getLeftMenus(req);
    treeWalk.preorder(MenusAll, function (value, key, parent) {
        if (key === "privileges") {
            var privilegeList = value, moduleId = parent.id.toLowerCase();
            _.each(privilegeList, function (privilege) {
                map[privilege] = moduleId;
            });
        }
    });
    return map;
}

//获取每个subMenu对象的id对应的父对象的id
function _getSubMenuMap(req) {
    var map = {};
    let MenusAll = _getLeftMenus(req);
    treeWalk.preorder(MenusAll, function (value, key, parent) {
        if (key === "subMenu" && value && value.length) {
            var subMenus = value;
            _.each(subMenus, function (menu) {
                map[menu.id] = parent.id;
            });
        }
    });
    return map;
}

//根据ID获取一个对象
function _getObjectById(id, req) {
    var obj;
    let MenusAll = _getLeftMenus(req);
    treeWalk.preorder(MenusAll, function (value, key, parent) {
        if (key === "id" && value === id) {
            obj = parent;
        }
    });
    return obj;
}

//获取菜单列表对象
function _getMenuChained(req) {
    var parentMap = _getSubMenuMap(req);
    var resultMap = {};
    var unshiftName;
    let MenusAll = _getLeftMenus(req);
    treeWalk.preorder(MenusAll, function (value, key, parent) {
        if (key === "showPrivileges" && value && value.length) {
            var privileges = value;
            var list = [];
            var target = parent;
            unshiftName = function () {
                if (target) {
                    var id = target.id;
                    var name = target.name;

                    list.unshift({
                        routePath: target.routePath,
                        name: name
                    });

                    var parentId = parentMap[id];

                    if (parentId) {
                        target = _getObjectById(parentId, req);
                        unshiftName();
                    }

                }
            }
            unshiftName();
            _.each(privileges, function (privilege) {
                resultMap[privilege] = list;
            });
        }
    });
    return resultMap;
}

//根据权限获取左侧菜单
function getSidebarMenus(req) {
    var userInfo = auth.getUser(req);
    var userPrivileges = userInfo.privileges;
    var menus = _getMenuChained(req);
    menus = _.filter(menus, function (value, key) {
        return userPrivileges.indexOf(key) >= 0;
    });
    var values = _.values(menus);
    values = _.map(values, function (item) {
        return item[0]
    });
    var groups = _.indexBy(values, 'routePath');
    values = _.values(groups);

    var filteredGroupMap = {};
    values = _.filter(values, function (obj) {
        var name = obj.name;
        if (filteredGroupMap[name]) {
            return false;
        }
        filteredGroupMap[name] = true;
        return true;
    });
    return values;
}

//获取第一层菜单的顺序
function _getModulesAllOrderMap(req) {
    var orderMap = {}, count = 0;
    let MenusAll = _getLeftMenus(req);
    _.each(MenusAll, function (item) {
        if (item.subMenu) {
            orderMap[item.routePath] = ++count;
        } else {
            orderMap[item.id.toLowerCase()] = ++count;
        }
    });
    return orderMap;
}

//获取第二层菜单的顺序
function _getSubModulesAllOrderMap(routePath, req) {
    var orderMap = {}, count = 0;
    let MenusAll = _getLeftMenus(req);
    var target = _.find(MenusAll, function (item) {
        if (item.subMenu && item.routePath === routePath) {
            return true;
        }
    });
    if (target && Array.isArray(target.subMenu)) {
        _.each(target.subMenu, function (item) {
            orderMap[item.routePath] = ++count;
        });
    }
    return orderMap;
}

//根据权限获取用户需要加载的脚本
function getModulesByUser(req) {
    var userInfo = auth.getUser(req);
    var userPrivileges = userInfo.privileges;
    var menusAll = _getMenuChained(req);
    var privilegeModuleMap = _getPrivilegeModuleMap(req);
    var set = new Set();

    _.each(userPrivileges, function (privilege) {
        var to_menu = menusAll[privilege];
        if (to_menu && to_menu.length === 1) {
            set.add(privilegeModuleMap[privilege]);
        } else if (to_menu && to_menu[0]) {
            set.add(to_menu[0].routePath);
        }
    });

    var orderMap = _getModulesAllOrderMap(req);
    var result = Array.from(set);
    result = _.sortBy(result, function (str) {
        return orderMap[str];
    });
    return result;
}

//根据权限获取二级菜单对应关系
function getSubModulesByUser(req) {
    var userInfo = auth.getUser(req);
    var userPrivileges = userInfo.privileges;
    var menusAll = _getMenuChained(req);
    var result = new Map();
    _.each(userPrivileges, function (privilege) {
        var to_menu = menusAll[privilege];
        if (to_menu && to_menu.length > 1) {
            var menuEntry = to_menu[0];
            if (!result.has(menuEntry.routePath)) {
                result.set(menuEntry.routePath, []);
            }
            var list = result.get(menuEntry.routePath);
            list.push(to_menu[1]);
            list = _.uniq(list, 'routePath');
            result.set(menuEntry.routePath, list);
        }
    });
    //对result中的数据进行排序
    for (var key of result.keys()) {
        var orderMap = _getSubModulesAllOrderMap(key, req);
        var list = result.get(key);
        list = _.sortBy(list, function (item) {
            return orderMap[item.routePath];
        });
        result.set(key, list);
    }

    return mapToObj(result);
}


//获取用户权限
function getPrivileges(req) {
    var userInfo = auth.getUser(req);
    var userPrivileges = userInfo.privileges;
    return userPrivileges;
}

//获取数据的promise
function getDataPromise(req, res, url, pathParams, queryObj) {
    //url中的参数处理
    if (pathParams) {
        for (let key in pathParams) {
            url += "/" + pathParams[key];
        }
    }
    let resultObj = {error: null, success: null};
    return new Promise((resolve, reject) => {
        return restUtil.authRest.get(
            {
                url: url,
                req: req,
                res: res
            }, queryObj, {
                success: function (eventEmitter, data) {
                    resultObj.success = data;
                    resolve(resultObj);
                },
                error: function (eventEmitter, errorObj) {
                    resultObj.error = errorObj;
                    resolve(resultObj);
                }
            });
    });
}

//获取用户信息
exports.getUserInfo = function (req, res, userId) {
    var emitter = new EventEmitter();
    //with_extentions:去掉额外信息的获取，只取基本信息，这样速度快
    var queryObj = {with_extentions: false};
    //获取登录用户的基本信息
    let getUserBasicInfo = getDataPromise(req, res, userInfoRestApis.getUserInfo, {userId: userId}, queryObj);
    //获取登录用户的角色信息
    let getUserRole = getDataPromise(req, res, userInfoRestApis.getMemberRoles);
    //获取团队信息

    Promise.all([getUserBasicInfo, getUserRole]).then(resultList => {
        let userInfoResult = resultList[0] ? resultList[0] : {};
        //成功获取用户信息
        if (userInfoResult.success) {
            let userData = userInfoResult.success;
            //角色
            userData.roles = _.isArray(resultList[1].success) ? resultList[1].success : [];
            emitter.emit("success", userData);
        } else if (userInfoResult.error) {//只有用户信息获取失败时，才返回失败信息
            emitter.emit("error", userInfoResult.error);
        }
    }).catch(errorObj => {
        emitter.emit("error", errorObj);
    });
    return emitter;
};

//邮箱激活接口，用于发邮件时，点击激活连接的跳转
exports.activeEmail = function (req, res, activeCode) {
    return restUtil.baseRest.get(
        {
            url: userInfoRestApis.activeEmail,
            req: req,
            res: res,
            json: false,
            headers: {accept: "text/html"}
        }, {code: activeCode});
};
//获取用户语言
exports.getUserLanguage = function (req, res) {
    return restUtil.authRest.get(
        {
            url: userInfoRestApis.getUserLanguage,
            req: req,
            res: res
        }, null);
};
/**
 * 记录日志
 * @param req
 * @param res
 * @param message
 */
exports.recordLog = function (req, res, message) {
    pageLogger.info(message);
};
var userInfoRestApis = {
    getUserInfo: "/rest/base/v1/user/id",
    getMemberRoles: "/rest/base/v1/user/member/roles",
    activeEmail: "/rest/base/v1/user/email/confirm",
    getUserLanguage: "/rest/base/v1/user/member/language/setting",
    getMyTeamWithSubTeam:"",
};

exports.getSidebarMenus = getSidebarMenus;
exports.getModulesByUser = getModulesByUser;
exports.getSubModulesByUser = getSubModulesByUser;
exports.getPrivileges = getPrivileges;
