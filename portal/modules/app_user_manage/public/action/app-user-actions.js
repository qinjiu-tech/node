/**
 * 应用用户的action
 */
//联系人的ajax
var AppUserAjax = require("../ajax/app-user-ajax");
var AppUserUtil = require("../util/app-user-util");
var UserData = require("../../../../public/sources/user-data");
var ShareObj = require("../util/app-id-share-util");
var rolesAjax = require("../../../common/public/ajax/role");

function AppUserAction() {

    this.generateActions(
        //获取App列表
        'getAppList',
        //获取客户列表
        'getCustomers',
        //获取App的用户列表
        'getAppUserList',
        //设置App的用户页数
        'setAppUserPage',
        //更改每页显示多少条
        'setAppPageSize',
        //设置选中的appid
        'setSelectedAppId',
        //显示用户详情
        'showUserDetail',
        //显示批量操作
        'showBatchOperate',
        //显示加入组织
        'showAddOrganizeMember',
        //显示App用户的表单
        'showAppUserForm',
        //显示申请用户的表单
        'showApplyUserForm',
        //隐藏右侧面板
        'closeRightPanel',
        //隐藏提交的提示
        'hideSubmitTip',
        //设置选中的用户列表
        'setSelectedUserRows',
        //搜索框中的值改变
        'keywordValueChange',
        //显示没有用户数据(当应用管理员，没有属于自己的应用的时候，直接显示没有数据)
        //当域管理员，没有应用的时候，直接显示没有数据
        'showNoUserData',
        //更新用户信息(从右侧面板更改（昵称，备注），同步到用户列表中)
        'updateUserInfo',
        //更新“属于”信息（从右侧面板更改“属于”，同步到用户列表中）
        'updateCustomerInfo',
        //切换过滤区域展开状态
        'toggleFilterExpanded',
        //切换某个过滤条件
        'toggleSearchField',
        //更新一个用户的一个应用成功后，同步列表中的数据
        'updateAppInfo',
        //全部停用之后，更新用户列表中的数据
        'updateDisableAllApps',
        //添加应用之后，更新用户列表中的数据
        'updateAddAppInfo',
        //修改应用单个字段之后，更新用户列表中的数据
        'updateAppField',
        //表格排序改变
        'changeTableSort',
        //批量推送，修改所属客户，更新用户列表
        'batchPushChangeCustomer',
        //批量推送，修改用户类型，更新用户列表
        'batchPushChangeGrantType',
        //批量推送，修改开通状态，更新开通状态
        'batchPushChangeGrantStatus',
        //批量推送，修改开通时间，更新用户列表
        'batchPushChangeGrantPeriod',
        //批量推送，批量延期，更新用户列表
        'batchPushChangeGrantDelay',
        //批量推送，开通产品，更新用户列表
        'batchPushChangeGrantUpdate',
        //批量推送，添加用户，更新用户列表
        'batchPushChangeUserCreate',
		//根据应用id，获取应用角色信息
        'getRolesByAppId',
        //根据角色过滤用户
        'filterUserByRole',
        //获取团队列表,用于页面展示
        'getTeamLists',
        // 获取安全域列表
        'getRealmList',
        //设置是否展示近期登录用户列表的标识
        'setRecentLoginPanelFlag',
        //恢复初始数据
        'setInitialData',
        //用户生成线索客户后，更新apps中的clue_created属性
        'updateUserAppsInfo'
    );

    //关闭右侧面板
    this.closeRightPanel = function() {
        AppUserUtil.emitter.emit(AppUserUtil.EMITTER_CONSTANTS.REMOVE_CURRENT_ROW_CLASS);
        this.dispatch();
    };
    //获取App列表
    this.getAppList = function(opts) {
        var _this = this;
        _this.dispatch({loading:true});
        AppUserAjax.getApps().then(function(list) {
            //默认选中第一个
            var selectedAppId = ShareObj.app_id || "";
            _this.dispatch({error:false,result:list,selected_app_id:selectedAppId});
        } , function(errorMsg) {
            _this.dispatch({error:true,result:errorMsg});
        });
    };

    //获取销售列表
    this.getSales = function() {
        var _this = this;
        AppUserAjax.getSales().then(function(list) {
            _this.dispatch(list);
        } , function(errorMsg) {
            _this.dispatch(errorMsg);
        });
    };

    //获取应用角色信息
    this.getRolesByAppId = function(app_id) {
        this.dispatch({error:false , loading:true});
        rolesAjax.getRolesByAppId().resolvePath({
            app_id : app_id
        }).sendRequest().success((data) => {
            this.dispatch({error:false , loading:false , roleList : data});
        }).error((xhr) => {
            this.dispatch({error:true , loading:false , errorMsg : xhr.responseJSON});
        }).timeout( (xhr) => {
            this.dispatch({error:true , loading:false , errorMsg : xhr.responseJSON});
        });
    };

    //获取App的用户列表
    this.getAppUserList = function(UserItem,callback) {
       
        var _this = this;
        _this.dispatch({
                            loading:true,
                            error:false,
                            customer_id : UserItem && UserItem.customer_id || ''
                        });
        AppUserAjax.getAppUserList(UserItem).then(function(data) {
            //-----java端偶尔传过来的是一个json字符串-----
            if(typeof data === 'string' && data.indexOf('{') === 0) {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.log(JSON.stringify(e));
                }
            }
            //----------
            if (UserItem && ('stopScroll' in UserItem)){
                    data.app_id = UserItem.app_id;
                _this.dispatch({loading:false,error:false,data:data, stopScroll: 'false'});
            }else{
                _this.dispatch({loading:false,error:false,data:data});
            }

            typeof callback === 'function' && callback(data);
        } , function(errorMsg) {
            _this.dispatch({loading:false,error:true,errorMsg:errorMsg});
        });
    };
    //获取用于展示的团队列表
    this.getTeamLists = function (cb) {
        this.dispatch({error:false , loading:true});
        var _this = this;
        AppUserAjax.getTeamLists().then(function(teamLists) {
            _this.dispatch({loading:false,error:false,teamLists:teamLists});
            if (_.isFunction(cb)) cb(teamLists);
        } , function(errorMsg) {
            _this.dispatch({loading:false,error:true,errorMsg:errorMsg});
        });
    };

    this.getRealmList = function () {
        AppUserAjax.getRealmList().then( (list) => {
            this.dispatch({error: false, list: list});
        },()=>{
            this.dispatch({error: true});
        });
    };
}

module.exports = alt.createActions(AppUserAction);
