/**
 * 报告页面左侧菜单
 */

require('./style.less');
import {NavLink} from 'react-router-dom';
import { Menu } from 'antd';
const MoreButton = require('CMP_DIR/more-btn');

const menuUtil = require('PUB_DIR/sources/utils/menu-util');

//获取第二层路径，用于获取第三层路由
function getCategory() {
    //获取路径，去掉开头的/
    let pathname = window.location.pathname.replace(/^\//, '');
    let firstLevelPathes = pathname.split('/');
    if (firstLevelPathes && firstLevelPathes[1]) {
        return '/' + firstLevelPathes[0] + '/' + firstLevelPathes[1];
    } else {
        return '';
    }
}

class ReportLeftMenu extends React.Component {
    render() {
        //获取第二层路由
        var category = getCategory();
        //获取当前界面的子模块
        var subMenus = menuUtil.getSubMenus(category);

        return (
            <div className='report-left-menu'>
                <ul>
                    {_.map(subMenus, menuItem => (
                        <li>
                            <NavLink
                                to={menuItem.routePath}
                                activeClassName="active"
                            >
                                {menuItem.name}
                            </NavLink>

                            {menuItem.routePath === '/analysis/report/daily-report' ? (
                                <MoreButton
                                    topBarDropList={() => (
                                        <Menu onClick={this.onOpMenuClick}>
                                            <Menu.Item key="status">
                                                状态
                                            </Menu.Item>
                                        </Menu>
                                    )}
                                />
                            ) : null }
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    onOpMenuClick = (e) => {
        console.log(e.key);
    }
}

export default ReportLeftMenu;
