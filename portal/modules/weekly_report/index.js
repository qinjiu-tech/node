/**
 * Copyright (c) 2016-2017 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2016-2017 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by zhangshujuan on 2018/2/5.
 */
import Bundle from '../../public/sources/route-bundle';

const WeeklyReportPage = (props) => (
    <Bundle load={() => import('./public')}>
        {(WeeklyReportPage) => <WeeklyReportPage {...props}/>}
    </Bundle>
);


module.exports = {
    path: '/analysis/user1',
    component: WeeklyReportPage
};
