var UserAjax = require('../ajax/app-user-ajax');
var scrollBarEmitter = require('../../../../public/sources/utils/emitters').scrollBarEmitter;
let userData = require('PUB_DIR/sources/user-data');
import ApplyApproveAjax from '../../../common/public/ajax/apply-approve';
/**
 * 用户审批界面使用的action
 */
function UserApplyActions() {
    this.generateActions(
        'getApplyList', //获取申请列表
        'setLastApplyId', //设置当前展示列表中最后一个id
        'changeApplyListType',//更改筛选类型
        'changeSearchInputValue',//修改搜索框的值
        'setSelectedDetailItem',//设置当前要查看详情的申请
        'setShowUpdateTip',//设置是否展示更新提示
        'getApplyById',//根据id获取申请（实际是获取申请的详情）
        'refreshUnreadReplyList',//刷新未读回复列表
        'clearUnreadReply',//清除未读回复列表中已读的回复
        'updateDealApplyError',//更新处理申请错误的状态
        'setIsCheckUnreadApplyList',//设置是否查看有未读回复的申请列表
        'backApplySuccess',
        'afterTransferApplySuccess'
    );
    //获取申请列表
    this.getApplyList = function(obj, callback) {
        this.dispatch({loading: true, error: false});
        if (_.includes(['all','false'], obj.approval_state)){
            ApplyApproveAjax.getMyUserApplyWorkList().sendRequest({keyword: obj.keyword}).success((workList) => {
                //如果是待我审批的列表，不需要在发获取全部列表的请求了
                if (obj.approval_state && obj.approval_state === 'false') {
                    //需要对全部列表都加一个可以审批的属性
                    workList.total = workList.list.length;
                    _.forEach(workList.list, (workItem) => {
                        workItem.showApproveBtn = true;
                        //如果是我申请的，除了可以审批之外，我也可以撤回
                        if (_.get(workItem, 'applicant.user_id') === userData.getUserData().user_id) {
                            workItem.showCancelBtn = true;
                        }
                    });
                    this.dispatch({error: false, loading: false, data: workList});
                    _.isFunction(callback) && callback(workList.total);
                    return;
                }
                getDiffTypeApplyList(this,obj,workList.list);
            }).error(xhr => {
                this.dispatch({
                    error: true,
                    loading: false,
                    errorMsg: xhr.responseJSON || Intl.get('apply.failed.get.my.worklist.application', '获取待我审批的{type}申请失败', {type: Intl.get('crm.detail.user', '用户')})
                });
            }
            );
        }else{
            getDiffTypeApplyList(this,obj);
        }
    };
    //根据id获取申请
    this.getApplyById = function(applyId) {
        this.dispatch({loading: true, error: false});
        var _this = this;
        //实际是获取详情组织申请项
        UserAjax.getApplyDetail(applyId).then(function(detail, apps) {
            scrollBarEmitter.emit(scrollBarEmitter.HIDE_BOTTOM_LOADING);
            _this.dispatch({loading: false, error: false, data: {detail: detail, apps: apps}});
        }, function(errorMsg) {
            _this.dispatch({loading: false, error: true, errorMsg: errorMsg});
        });
    };

}
function getDiffTypeApplyList(that,queryObj,workListArr) {
    UserAjax.getApplyList(queryObj).then((data) => {
        scrollBarEmitter.emit(scrollBarEmitter.HIDE_BOTTOM_LOADING);
        //需要对全部列表进行一下处理，知道哪些是可以审批的
        if (_.isArray(workListArr) && workListArr.length){
            _.forEach(workListArr,(item) => {
                var targetObj = _.find(data.list,(dataItem) => {
                    return item.id === dataItem.id;
                });
                if (targetObj){
                    targetObj.showApproveBtn = true;
                }
            });
        }
        //给 自己申请的并且是未通过的审批加上可以撤销的标识
        _.forEach(data.list,(item) => {
            if (item.status === 'false' && _.get(item,'applicant.user_id') === userData.getUserData().user_id){
                item.showCancelBtn = true;
            }
        });
        that.dispatch({error: false, loading: false, data: data});
    },(errorMsg) => {
        that.dispatch({
            error: true,
            loading: false,
            errorMsg: errorMsg || Intl.get('apply.failed.get.type.application', '获取全部{type}申请失败', {type: Intl.get('crm.detail.user', '用户')})
        });});
}

module.exports = alt.createActions(UserApplyActions);
