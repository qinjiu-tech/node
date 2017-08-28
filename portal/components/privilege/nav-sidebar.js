require("./css/nav-sidebar.scss");
var userData = require("../../public/sources/user-data");
var Link = require("react-router").Link;
var Logo = require("../Logo/index.js");
var Avatar = require("../Avatar/index.js");
var LogOut = require("../../modules/logout/views/index.js");
var url = require("url");
var Popover = require("antd").Popover;
var classNames = require("classnames");
var insertStyle = require("../insert-style");
var Icon = require("antd").Icon;
var React = require('react');
var userInfoEmitter = require("../../public/sources/utils/emitters").userInfoEmitter;
var notificationEmitter = require("../../public/sources/utils/emitters").notificationEmitter;
var _ = require("underscore");
var UnreadMixin = require("./mixins/unread");

/**
 *[
 * {"routePath":"user","name":"用户管理"},
 * {"routePath":"analysis","name":"运营分析"}
 *]
 */
//获取菜单
function getMenus() {
    var userInfo = userData.getUserData();
    var sideBarMenus = userInfo.sideBarMenus;
    return sideBarMenus;
}
//获取用户logo
function getUserInfoLogo() {
    var userInfoLogo = userData.getUserData().user_logo;
    return userInfoLogo;
}
//获取用户名、昵称
function getUserName() {
    var nick_name = userData.getUserData().nick_name;
    var user_name = userData.getUserData().user_name;
    var userInfo = {
        nick_name: nick_name,
        user_name: user_name
    };
    return userInfo;
}

//不需要在左侧图标列表中输出的链接
var ExcludeLinkList = [
    {"name": Intl.get("menu.sales.homepage", "销售主页"), path: "sales/home"},
    {"name": Intl.get("common.my.app", "我的应用"), path: "my_app"},
    {"name": Intl.get("menu.userinfo.manage", "个人信息管理"), path: "user_info_manage"},
    {"name": Intl.get("menu.notification", "通知"), path: "notification"},
    {"name": Intl.get("menu.appuser.apply", "用户审批"), path: "apply"}
];

//通知类型
var NotificationLinkList = [
    {
        name: Intl.get("menu.customer.notification", "客户提醒"),
        href: "/notification/customer",
        key: "customer",
        privilege: 'NOTIFICATION_CUSTOMER_LIST'
    },
    {
        name: Intl.get("menu.apply.notification", "申请消息"),
        href: "/notification/applyfor",
        key: "apply",
        privilege: 'NOTIFICATION_APPLYFOR_LIST'
    },
    {
        name: Intl.get("menu.system.notification", "系统消息"),
        href: "/notification/system",
        key: "system",
        privilege: 'NOTIFICATION_SYSTEM_LIST'
    }
];
//审批入口
var applyentryLink = [
    {
        name: Intl.get("menu.appuser.apply", "用户审批"),
        href: "/apply",
        key: "apply", privilege: "APP_USER_APPLY_LIST"
    }
];

//左侧导航图标名称和路径列表
var NavSidebarLists = [];
//左侧响应式导航栏所用各部分高度
var responsiveLayout = {
    //logo 所占的高度
    logoHeight: 0,
    //图标的高度
    MenusHeight: 0,
    //通知、二维码、个人信息的总高度
    userInfoHeight: 0
};

var NavSidebar = React.createClass({
    mixins: [UnreadMixin],
    getInitialState: function () {
        return {
            menus: getMenus(),
            userInfoLogo: getUserInfoLogo(),
            userInfo: getUserName(),
            messages: {
                customer: 0,
                apply: 0,
                system: 0
            }
        };
    },
    //轮询获取未读数的清除器
    unreadTimeout: null,
    //动态添加未读数样式，以便在通知页面顶部显示未读数数字
    insertStyleForUnreadCount: function (unreadCountObj) {
        if (this.unreadStyle) {
            this.unreadStyle.destroy();
        }
        if (!_.isObject(unreadCountObj)) {
            return;
        }
        var styles = [];
        for (var message_type in unreadCountObj) {
            var count = unreadCountObj[message_type];
            var className = message_type === 'apply' ? 'applyfor' : message_type;
            styles.push(`.notification_${className}_ico a:before{
                display: ${count > 0 ? 'block' : 'none'};
                content : "${count > 99 ? '99+' : count}";
           }`);
        }
        this.unreadStyle = insertStyle(styles.join('\n'));
    },
    //刷新未读数
    refreshNotificationUnread: function () {
        if (Oplate && Oplate.unread) {
            var messages = Oplate.unread;
            this.setState({
                messages: messages
            });
            //插入样式，以便在客户提醒，系统消息，申请消息处显示未读数的小红点和未读数
            this.insertStyleForUnreadCount(messages);
        }
    },
    changeUserInfoLogo: function (userLogoInfo) {
        //修改名称
        if (userLogoInfo.nickName) {
            this.state.userInfo.nick_name = userLogoInfo.nickName;
            this.setState({
                userInfo: this.state.userInfo
            });
        }
        //logo
        if (userLogoInfo.userLogo) {
            this.setState({
                userInfoLogo: userLogoInfo.userLogo
            });
            //修改缓存中对应的图片信息
            userData.updateUserLogo(userLogoInfo)
        }
    },
    resizeFunction: function () {
        this.setState({});
    },
    //是否需要发送ajax请求获取"未读数"数据
    needSendNotificationRequest: false,
    componentDidMount: function () {
        userInfoEmitter.on(userInfoEmitter.CHANGE_USER_LOGO, this.changeUserInfoLogo);
        notificationEmitter.on(notificationEmitter.UPDATE_NOTIFICATION_UNREAD, this.refreshNotificationUnread);
        $(window).on('resize', this.resizeFunction);
        var notificationPrivileges = this.getNotificationByPrivilege();
        this.needSendNotificationRequest = notificationPrivileges.length >= 1;
        this.refreshNotificationUnread();
        //响应式设计 logo占据的实际高度
        responsiveLayout.logoHeight = $('.header-logo').outerHeight();
        //响应式设计 如果导航存在计算导航图标 占据的实际高度
        responsiveLayout.MenusHeight = $('.navbar-collapse').outerHeight();
        //计算 通知、二维码、个人信息 占据的实际高度
        responsiveLayout.userInfoHeight = $(this.refs.userInfo).outerHeight();
        this.calculateHeight();
        $(window).on('resize', this.calculateHeight);

        //重新渲染一次，需要使用高度
        this.setState({});
    },
    calculateHeight: function () {
        //>75  目的是左侧只有一个导航图标时不会出现汉堡包按钮
        //窗口高度小于 （logo高度+导航高度+个人信息高度）时，出现汉堡包按钮，隐藏导航图标
        if ($(window).height() < (responsiveLayout.logoHeight + responsiveLayout.MenusHeight + responsiveLayout.userInfoHeight) && (responsiveLayout.MenusHeight > 75)) {
            $('#hamburger').show();
            $('#menusLists').hide();
        } else {
            $('#hamburger').hide();
            $('#menusLists').show();
        }
    },
    componentWillUnmount: function () {
        userInfoEmitter.removeListener(userInfoEmitter.CHANGE_USER_LOGO, this.changeUserInfoLogo);
        notificationEmitter.removeListener(notificationEmitter.UPDATE_NOTIFICATION_UNREAD, this.refreshNotificationUnread);
        $(window).off('resize', this.resizeFunction);
        clearTimeout(this.unreadTimeout);
    },
    navContainerHeightFnc: function () {
        return $(window).height();
    },
    //是否有未读消息
    hasUnread: function () {
        var numbers = this.state.messages;
        for (var key in numbers) {
            if (numbers[key] > 0 && key !== 'approve') {
                return true;
            }
        }
        return false;
    },
    getNotificationClass: function () {
        var urlInfo = url.parse(window.location.href);
        if (/^\/notification\//.test(urlInfo.pathname)) {
            return "active";
        } else {
            return "";
        }
    },
    getNotificationByPrivilege: function () {
        var userPrivileges = userData.getUserData().privileges;
        return NotificationLinkList.filter(function (item) {
            if (userPrivileges.indexOf(item.privilege) >= 0) {
                return true;
            }
        });
    },
    getApplyByPrivilege: function () {
        var userPrivileges = userData.getUserData().privileges;
        return applyentryLink.filter(function (item) {
            if (userPrivileges.indexOf(item.privilege) >= 0) {
                return true;
            }
        });
    },
    getNotificationLinks: function (notifications) {
        var _this = this;
        var pathname = url.parse(window.location.href).pathname;
        return (
            <ul className="ul-unstyled">
                {
                    notifications.map(function (obj) {
                        var cls = classNames({
                            pad: _this.state.messages[obj.key] > 99
                        });
                        var extraClass = classNames({
                            active: obj.href === pathname
                        });
                        return (
                            <li className={cls} key={obj.key}>
                                <Link to={obj.href} activeClassName="active">
                                    {obj.name}
                                    {_this.state.messages[obj.key] > 0 ? (
                                        <em>{_this.state.messages[obj.key] > 99 ? '99+' : _this.state.messages[obj.key]}</em>) : null}
                                </Link>
                            </li>
                        );
                    })
                }
            </ul>
        );
    },
    //个人信息部分右侧弹框
    getUserInfoLinks: function () {
        //个人资料部分
        var UserInfoLinkList = [
            {
                name: Intl.get("user.info.user.info", "个人资料"),
                href: "/user_info_manage/user_info",
                key: "user_info"
            },
            {
                name: Intl.get("common.edit.password", "修改密码"),
                href: "/user_info_manage/user_pwd",
                key: "user_pwd"
            }
        ];
        return (
            <ul className="ul-unstyled">
                {
                    UserInfoLinkList.map(function (obj) {
                        return (
                            <li key={obj.key}>
                                <Link to={obj.href} activeClassName="active">
                                    {obj.name}
                                </Link>
                            </li>
                        );
                    })
                }
                <li>
                    <LogOut/>
                </li>
            </ul>
        );
    },
    getNotificationBlock: function () {
        var notificationLinks = this.getNotificationByPrivilege();
        if (!notificationLinks.length) {
            return null;
        }
        //是否含有未读数
        var hasUnread = this.hasUnread();
        var notificationList = this.getNotificationLinks(notificationLinks);
        var notificationCls = this.getNotificationClass();

        return (
            <div className="notification">
                <Popover overlay={notificationList} trigger="hover"
                         placement="rightBottom"
                         overlayClassName="nav-sidebar-notification">
                    <Link to={notificationLinks[0].href} activeClassName="active" extraClass={notificationCls}>
                        <i className="iconfont icon-tongzhi">
                            {hasUnread ? (<b></b>) : null}
                        </i>
                    </Link>
                </Popover>
            </div>
        );
    },
    getApplyBlock: function () {
        var applyLinks = this.getApplyByPrivilege();
        if (!applyLinks.length) {
            return null;
        }
        return (
            <div className="sidebar-applyentry">
                <Link to={applyLinks[0].href} activeClassName="active">
                    <i className="iconfont icon-applyentry" title={Intl.get("menu.appuser.apply","用户审批")}>
                    </i>
                </Link>

            </div>
        );
    },

    //侧边导航左下个人信息
    getUserInfoBlock: function () {
        var userinfoList = this.getUserInfoLinks();
        return (
            <div className="sidebar-userinfo">
                <Popover overlay={userinfoList} trigger="hover"
                         placement="rightBottom"
                         overlayClassName="nav-sidebar-userinfo">
                    <div className="avatar_container">
                        <Avatar className="avatar"
                                size="51"
                                src={this.state.userInfoLogo}
                                userName={this.state.userInfo.user_name}
                                nickName={this.state.userInfo.nick_name}
                                round="true" link="true" url="/user_info_manage"/>
                    </div>
                </Popover>
            </div>
        )
    },
    getNavbarLists: function () {
        //侧边导航高度减少后，出现汉堡包按钮，汉堡包按钮的弹出框
        return (
            <ul className="ul-unstyled">
                {NavSidebarLists.map(function (obj) {
                    return (
                        <li>
                            <Link to={`/${obj.routePath}`} activeClassName="active">
                                {obj.name}
                            </Link>
                        </li>
                    );
                })
                }
            </ul>
        );
    },
    render: function () {
        var windowHeight = this.navContainerHeightFnc();
        const pathName = location.pathname.replace(/^\/|\/$/g, "");
        var currentPageCategory = pathName.split("/")[0];
        //不在左侧循环输出的链接
        var excludePathList = _.pluck(ExcludeLinkList, 'path');
        var _this = this;
        return (
            <nav className="navbar">
                <div className="container">
                    <div className="logo-and-menus" ref="logoAndMenus"
                    >
                        <div className="header-logo">
                            <Logo />
                        </div>
                        <div className="collapse navbar-collapse">
                            <ul className="nav navbar-nav" id="menusLists">
                                {
                                    //过滤掉不显示的
                                    this.state.menus.filter(function (menu, i) {
                                        if (excludePathList.indexOf(menu.routePath) < 0) {
                                            return true;
                                        }
                                        return false;
                                    }).map(function (menu, i) {
                                        var category = menu.routePath.replace(/\/.*$/, '');
                                        var extraClass = currentPageCategory === category && pathName !== "contract/dashboard" ? 'active' : '';
                                        //将侧边导航图标的名称和路径放在数组NavSidebarLists中
                                        if (!(_.contains(NavSidebarLists, menu))) {
                                            NavSidebarLists.push(menu)
                                        }
                                        return (
                                            <li key={i} className={`ico ${menu.routePath.replace(/\//g,'_')}_ico`}>
                                                <Link to={`/${menu.routePath}`}
                                                      activeClassName={extraClass}
                                                      className={extraClass}
                                                >
                                                    <i title={menu.name}></i>
                                                    <span>{menu.name}</span>
                                                </Link>
                                            </li>
                                        );
                                    })
                                }
                            </ul>
                            <Popover overlay={this.getNavbarLists()} trigger="hover" placement="rightTop"
                                     overlayClassName="nav-sidebar-lists">
                                <div className="hamburger" id="hamburger">
                                    <span className="line"></span>
                                    <span className="line"></span>
                                    <span className="line"></span>
                                </div>
                            </Popover>
                        </div>

                    </div>

                    <div className="sidebar-user" ref="userInfo">
                        {_this.getApplyBlock()}
                        {_this.getNotificationBlock()}
                        {_this.getUserInfoBlock()}
                    </div>
                </div>
            </nav>
        );
    }
});

module.exports = NavSidebar;
