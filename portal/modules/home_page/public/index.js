/**
 * Copyright (c) 2015-2018 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2015-2018 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by wangliping on 2019/6/11.
 */
import './css/index.less';
import MyWorkColumn from './views/my-work-column';
import MyInsterestColumn from './views/my-insterest-column';
import TeamDataColumn from './views/team-data-column';
import {Row, Col} from 'antd';
import Trace from 'LIB_DIR/trace';

class HomePage extends React.Component {
    constructor(props) {
        super(props);
    }
    
    returnOldPage = (event) => {
        if (event) {
            Trace.traceEvent(event, '返回旧版首页');
        }
        this.props.history && this.props.history.push('/sales/home');
    };

    render() {
        let realm = window.location.hostname;
        return (
            <Row className='home-page-container' data-tracename="新版首页">
                <Col span={10}><MyWorkColumn/></Col>
                <Col span={7}><TeamDataColumn/></Col>
                <Col span={7}><MyInsterestColumn/></Col>
                {/*判断所处域名，curtao下不显示返回旧版 */}
                {!realm.indexOf("curtao")> -1 ?<div onClick={this.returnOldPage} className='return-old-btn'>{Intl.get('home.page.return.old', '返回旧版')}</div>:null}          
            </Row>);
    }
}
HomePage.propTypes = {
    history: PropTypes.obj
};
export default HomePage;