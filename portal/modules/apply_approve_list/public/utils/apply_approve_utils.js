import {Button} from 'antd';

export const APPLY_TYPE = {
    APPLY_BY_ME: 'apply_by_me',
    APPROVE_BY_ME: 'approve_by_me',
    APPLY_BY_TEAM: 'apply_by_team',
};
export const APPLY_APPROVE_TAB_TYPES = [{
    value: APPLY_TYPE.APPLY_BY_ME,
    name: Intl.get('apply.approve.list.start.by.me', '我申请的')
}, {
    value: APPLY_TYPE.APPROVE_BY_ME,
    name: Intl.get('apply.approve.list.approved.by.me', '我审批的')
}, {
    value: APPLY_TYPE.APPLY_BY_TEAM,
    name: Intl.get('apply.approve.list.approved.by.team', '团队申请')
}];
export const APPLY_LIST_LAYOUT_CONSTANTS = {
    TOP_DELTA: 64,
    BOTTOM_DELTA: 48,
    APPLY_LIST_WIDTH: 336,
    DETAIL_BOTTOM_DELTA: 14
};
export const getApplyListDivHeight = function() {
    if ($(window).width() < Oplate.layout['screen-md']) {
        return 'auto';
    }
    return $(window).height() - APPLY_LIST_LAYOUT_CONSTANTS.TOP_DELTA - APPLY_LIST_LAYOUT_CONSTANTS.BOTTOM_DELTA;
};
export const transferBtnContent = function() {
    return (<Button className='assign-btn'>
        <i className='iconfont icon-transfer'></i>
        {Intl.get('apply.view.transfer.candidate','转审')}</Button>);
};
export const SEARCH = 'search';
export const FILTER = 'filter';
export const getStatusNum = function(state) {
    let statusNum = '';
    switch (state) {
        case 'ongoing':
            statusNum = '0';
            break;
        case 'pass':
            statusNum = '1';
            break;
        case 'reject':
            statusNum = '2';
            break;
        case 'cancel':
            statusNum = '3';
            break;
    }
    return statusNum;
};
//将用户申请的新数据和旧数据进行统一
export const UnitOldAndNewUserInfo = function(userInfo) {
    //0 代表待审批 1代表已通过，2代表已驳回，3 代表已撤销
    var oldUserInfo = {
        id: _.get(userInfo,'id'),
        producer: _.get(userInfo,'applicant'),
        presenter: _.get(userInfo,'applicant.nick_name'),
        approval_state: getStatusNum(_.get(userInfo,'status')),
        customer_name: _.get(userInfo,'detail.customers[0].name'),
        topic: _.get(userInfo,''),
        approval_person: _.get(userInfo,''),
    };
    return oldUserInfo;
};
//将申请审批的数据统一一下
export const UnitOldAndNewUserDetail = function(detail) {
    return {
        type: _.get(detail,'detail.user_apply_type'),
        sales_name: _.get(detail,'applicant.nick_name'),
        sales_team_name: _.get(detail,''),
        presenter_id: _.get(detail,'applicant.user_id'),
        customer_name: _.get(detail,'detail.customer_name'),
        customer_id: _.get(detail,'detail.customer_id'),
        user_names: _.map(_.get(detail,'detail.user_grants_apply',[]),'user_name'),
        user_ids: _.map(_.get(detail,'detail.user_grants_apply',[]),'user_id'),
        comment: _.get(detail,'remarks',''),
        approval_comment: '',
        approval_state: '1',
        approval_person: '张淑娟',
        time: 1582094471651,
        approval_time: 1582096984760,
        id: _.get(detail,'id'),
        isConsumed: 'true',
        presenter: _.get(detail,'applicant.nick_name'),
        topic: _.get(detail,'detail.user_apply_name'),
        last_contact_time: 1581326993094,
        immutable_labels: _.get(detail,'detail.immutable'),
        customer_label: _.get(detail,'detail.customer_label'),
        apps: _.get(detail,'detail.user_grants_apply'),
    };
};