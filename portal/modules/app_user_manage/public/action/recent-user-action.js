var callAnalysisAjax = require('MOD_DIR/call_record/public/ajax/call-analysis-ajax');
import {altAsyncUtil} from 'ant-utils';
const {asyncDispatcher} = altAsyncUtil;

function RecentUserAction() {
    this.generateActions(

    );
    // 成员信息
    this.getSaleMemberList = asyncDispatcher( callAnalysisAjax.getSaleMemberList);
}
module.exports = alt.createActions(RecentUserAction);