/**
 * Created by wangliping on 2018/3/1.
 */
require('../action/sales-role-manage-controller');
module.exports = {
    module: 'config_manage/server/action/sales-role-manage-controller',
    routes: [{
        'method': 'get',
        'path': '/rest/sales/role_list',
        'handler': 'getSalesRoleList',
        'passport': {
            'needLogin': true
        },
        'privileges': []
    },{
        'method': 'get',
        'path': '/rest/sales/role',
        'handler': 'getSalesRoleByMemberId',
        'passport': {
            'needLogin': true
        },
        'privileges': []
    },{
        'method': 'post',
        'path': '/rest/sales/role',
        'handler': 'addSalesRole',
        'passport': {
            'needLogin': true
        },
        'privileges': [
            'TEAM_ROLE_MANAGE'
        ]
    },{
        'method': 'delete',
        'path': '/rest/sales/role/:role_id',
        'handler': 'deleteSalesRole',
        'passport': {
            'needLogin': true
        },
        'privileges': [
            'TEAM_ROLE_MANAGE'
        ]
    },{
        'method': 'put',
        'path': '/rest/sales/default_role/:role_id',
        'handler': 'setDefaultRole',
        'passport': {
            'needLogin': true
        },
        'privileges': [
            'TEAM_ROLE_MANAGE'
        ]
    },{
        'method': 'delete',
        'path': '/rest/sales/role/reset/:salesUserId',
        'handler': 'resetSalesRole',
        'passport': {
            'needLogin': false
        }, 'privileges': [
            'MEMBER_TEAM_ROLE_MANAGE'
        ]
    },{//修改销售的角色
        'method': 'post',
        'path': '/rest/sales/role/change',
        'handler': 'changeSalesRole',
        'passport': {
            'needLogin': true
        },
        'privileges': [
            'MEMBER_TEAM_ROLE_MANAGE'
        ]
    },{//设置某个角色的客户容量
        method: 'put',
        path: '/rest/sales/setting/customer',
        handler: 'setSalesRoleGoal',
        passport: {
            'needLogin': true
        },
        privileges: [
            'TEAM_ROLE_MANAGE'
        ]
    }
    ]
};