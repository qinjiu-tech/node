/**
 * 客户列表面板
 *
 * 包含客户列表的右侧面板，用于点击统计数字时滑出右侧面板显示详细的客户列表等场景
 */

//require('./style.less');
import ListPanel from 'CMP_DIR/list-panel';
import UserList from './';

function UserListPanel(props) { 
    return (
        <ListPanel listType='user'>
            <UserList {...props}/>
        </ListPanel>
    );
}

export default UserListPanel;
