var React = require('react');
const PropTypes = require('prop-types');
import { getSelected } from '../../../../lib/utils/filter-utils';
var FilterStore = require('../store/filter-store');
var FilterAction = require('../action/filter-actions');
import Trace from 'LIB_DIR/trace';
import { administrativeLevels, CUSTOMER_TAGS } from '../utils/crm-util';
import { hasPrivilege } from 'CMP_DIR/privilege/checker';
import userData from 'PUB_DIR/sources/user-data';
import { FilterList } from 'CMP_DIR/filter';
import { FILTER_RANGE, STAGE_OPTIONS, DAY_TIME, UNKNOWN, COMMON_OTHER_ITEM } from 'PUB_DIR/sources/utils/consts';
//行政级别筛选项
let filterLevelArray = [{ id: '', level: Intl.get('common.all', '全部') }].concat(administrativeLevels);


const otherFilterArray = [
    {
        name: Intl.get('common.all', '全部'),
        value: ''
    }, {
        name: Intl.get('crm.never.contact.customer', '从未联系客户'),
        value: 'never_contact'
    },{
        name: Intl.get('crm.over.day.without.contact', '超{day}天未联系', { day: 30 }),
        value: 'thirty_uncontact'
    }, {
        name: Intl.get('crm.over.day.without.contact', '超{day}天未联系', { day: 15 }),
        value: 'fifteen_uncontact'
    }, {
        name: Intl.get('crm.over.day.without.contact', '超{day}天未联系', { day: 7 }),
        value: 'seven_uncontact'
    }, {
        name: Intl.get('crm.over.day.no.connection', '近{day}天拨打未接通', { day: 30 }),
        value: 'thirty_no_connection'
    }, {
        name: Intl.get('crm.over.day.no.phone', '超{day}天未打过电话', { day: 30 }),
        value: 'thirty_no_call'
    }, {
        name: Intl.get('crm.no.contact.way', '无联系方式客户'),
        value: 'no_contact_way'
    }, {
        name: Intl.get('crm.call.no.remark', '最后联系但未写跟进记录'),
        value: 'last_call_no_record'
    }, {
        name: Intl.get('crm.call.no.remark.over', '超{day}天未写跟进记录', {day: 30}),
        value: 'thirty_no_last_trace'
    }, {
        name: Intl.get('crm.call.no.remark.over', '超{day}天未写跟进记录', {day: 15}),
        value: 'fifteen_no_last_trace'
    }, {
        name: Intl.get('crm.call.no.remark.over', '超{day}天未写跟进记录', {day: 7}),
        value: 'seven_no_last_trace'
    }, {
        name: Intl.get('crm.concerned.customer', '被关注的客户'),
        value: 'interest_member_ids'
    }, {
        name: Intl.get('crm.my.concerned.customer', '我关注的客户'),
        value: 'my_interest'
    }, {
        name: Intl.get('crm.order.more.customer', '多个订单的客户'),
        value: 'multi_order'
    }, {
        name: Intl.get('crm.available.customer', '有效客户'),
        value: 'availability'
    }, {
        name: Intl.get('crm.recent.week.active', '近一周的活跃客户'),
        value: 'seven_login'
    }, {
        name: Intl.get('crm.recent.month.active', '近一个月的活跃客户'),
        value: 'month_login'
    }, {
        name: Intl.get('crm.filter.team.customer', '团队客户'),
        value: 'team_customer'
    },{
        name: Intl.get('crm.this.week.contact', '本周联系过的客户'),
        value: 'this_week_contacted'
    },{
        name: Intl.get('crm.filter.extract.from.customer.pool', '从客户池中提取的客户'),
        value: 'extract_time'
    }
];
//只有管理员可以过滤未分配的客户
if (userData.hasRole(userData.ROLE_CONSTANS.REALM_ADMIN)) {
    otherFilterArray.push({
        name: Intl.get('crm.213', '未分配客户'),
        value: 'undistributed'
    });
}
//合格标签的筛选
const qualifiedTagList = [{
    name: CUSTOMER_TAGS.QUALIFIED, value: '1'
}, {
    name: CUSTOMER_TAGS.HISTORY_QUALIFIED, value: '2'
}, {
    name: CUSTOMER_TAGS.NEVER_QUALIFIED, value: '3'
}];

class CrmFilterPanel extends React.Component {
    state = FilterStore.getState();

    onStoreChange = () => {
        this.setState(FilterStore.getState());
    };

    componentDidMount() {
        FilterStore.listen(this.onStoreChange);
        FilterAction.getTeamList();
        FilterAction.getSalesRoleList();
        FilterAction.getStageList();
        //获取系统标签的列表
        FilterAction.getSystemTagList();
        FilterAction.getTagList();
        FilterAction.getStageTagList();
        //获取竞品的列表
        FilterAction.getCompetitorList();
        FilterAction.getIndustries();
        //负责任人名称列表
        FilterAction.getUserList();
        FilterAction.getFilterProvinces();
        setTimeout(() => {
            this.getCommonFilterList();
        });
    }

    componentDidUpdate(prevProps) {
        var filterPanelHeight = $('.crm-filter-panel').outerHeight(true);
        if (prevProps.filterPanelHeight !== filterPanelHeight) {
            // this.props.changeTableHeight(filterPanelHeight);
        }
    }

    componentWillUnmount() {
        FilterAction.setInitialCondition();
        FilterStore.unlisten(this.onStoreChange);
    }

    getCommonFilterList() {
        const paramsObj = {
            params: {
                type: FILTER_RANGE.USER.value,
                order: 'descend',
                sort_field: 'operate_time',
                page_size: 1000
            },
            //post请求不传body参数会报415
            data: { emptyFix: '' }

        };
        FilterAction.getCommonFilterList(paramsObj);
    }

    handleFilterChange = (data) => {
        const condition = {};
        if (!data.find(group => group.groupId === COMMON_OTHER_ITEM)) {
            condition[COMMON_OTHER_ITEM] = '';
        }
        data.forEach(item => {
            if (item.groupId) {
                if (item.groupId !== 'sales_opportunities') {
                    condition[item.groupId] = item.data.map(x => x.value);
                    if (['customer_label', 'province', 'industry', 'member_role', 'administrative_level', 'sales_team_id', COMMON_OTHER_ITEM].includes(item.groupId)) {
                        condition[item.groupId] = condition[item.groupId].join(',');
                    } else if (item.singleSelect) {
                        condition[item.groupId] = condition[item.groupId][0] || '';
                    }

                } else {
                    condition.sales_opportunities = [];
                    condition.sales_opportunities.push($.extend(true, {}, this.state.condition.sales_opportunities[0], {
                        sale_stages: item.data.map(x => x.value)
                    }));
                    condition.sales_opportunities[0].sale_stages = condition.sales_opportunities[0].sale_stages.join(',');
                }

            }
        });
        FilterAction.setCondition(condition);
        setTimeout(() => {
            this.props.search();
        });
    };
    onDelete(item) {
        return FilterAction.delCommonFilter({
            params: {
                id: item.id
            }
        });
    }
    //从团队树中递归遍历查找团队
    getTeamFromTree(teamList,teamId){
        let team = {};
        _.each(teamList, item => {
            if (item.group_id === teamId) {
                team = item;
            } else if (_.get(item, 'child_groups[0]')) {
                team = this.getTeamFromTree(item.child_groups, teamId);
            }
            //找到team就停止遍历
            if(!_.isEmpty(team)){
                return false;
            }
        });
        return team;
    }
    //递归遍历团队列表,获取团队及下级团队的人员id列表
    traverseTeamMember(teamList) {
        let memberIds = [];
        _.each(teamList, team => {
            //成员
            if (_.get(team, 'user_ids[0]')) {
                memberIds = _.concat(memberIds, team.user_ids);
            }
            //舆情秘书
            if(_.get(team, 'manager_ids[0]')){
                memberIds = _.concat(memberIds, team.manager_ids);
            }
            //主管
            if (_.get(team, 'owner_id')) {
                memberIds.push(team.owner_id);
            }
            if (_.get(team, 'child_groups[0]')) {
                let childMemberIds = this.traverseTeamMember(team.child_groups);
                memberIds = _.concat(memberIds, childMemberIds);
            }
        });
        return memberIds;
    }

    render() {
        const teams = this.state.condition.sales_team_id.split(',');
        //用Store.getState()方法获取存在store里的state时，若state下的某个属性所在层次较深且其值为空时，该属性会被丢掉
        //所以这个地方需要判断一下sale_stages属性是否存在，若不存在则用空值替代
        const currentStage = this.state.condition.sales_opportunities[0].sale_stages || '';
        const selectedStages = currentStage.split(',');
        const stageArray = STAGE_OPTIONS.concat(this.state.stageList);
        const industryArray = ['', Intl.get('user.unknown', '未知')].concat(this.state.industryList);
        const commonData = _.drop(otherFilterArray).map(x => {
            x.readOnly = true;
            x.groupId = COMMON_OTHER_ITEM;
            x.groupName = Intl.get('crm.186', '其他');
            x.data = [{
                name: x.name,
                value: x.value,
                groupId: COMMON_OTHER_ITEM,
                groupName: Intl.get('crm.186', '其他'),
                data: [{
                    name: x.name,
                    value: x.value,
                    groupId: COMMON_OTHER_ITEM,
                    groupName: Intl.get('crm.186', '其他'),
                }]
            }];
            x.plainFilterList = [{
                name: x.name,
                value: x.value
            }];
            return x;
        });
        //选中的客户阶段列表
        let selectedCustomerLabels = _.get(this.state, 'condition.customer_label', '').split(',');
        //选中的标签列表
        let selectedLabels = _.get(this.state, 'condition.labels', []);
        //选中的竞品列表
        let selectedCompetings = _.get(this.state, 'condition.competing_products', []);
        //选中的行政级别列表
        let selectedLevel = _.get(this.state, 'condition.administrative_level', '').split(',');
        const advancedData = [
            {
                groupName: Intl.get('crm.order.stage', '订单阶段'),
                groupId: 'sales_opportunities',
                singleSelect: true,
                data: _.drop(stageArray).map(x => ({
                    name: x.show_name,
                    value: x.name,
                    selected: x.name === _.get(this.state, 'condition.sales_opportunities[0].sale_stages', '')
                }))
            },
            {
                groupName: Intl.get('weekly.report.customer.stage', '客户阶段'),
                groupId: 'customer_label',
                data: _.drop(this.state.stageTagList).map(x => ({
                    name: x.show_name,
                    value: x.name,
                    selected: _.indexOf(selectedCustomerLabels, x.name) !== -1
                }))
            },
            {
                groupName: Intl.get('common.qualified', '合格'),
                groupId: 'qualify_label',
                singleSelect: true,
                data: _.map(qualifiedTagList, x => {
                    return {
                        name: x.name,
                        value: x.value,
                        selected: x.value === _.get(this.state, 'condition.qualify_label', '')
                    };
                })
            },
            {
                groupName: Intl.get('crm.system.labels', '系统标签'),
                groupId: 'immutable_labels',
                data: _.drop(this.state.systemTagList).map(x => {
                    const item = {
                        name: x.show_name,
                        value: x.name,
                        selected: _.indexOf(selectedLabels, x.name) !== -1
                    };
                    return item;
                })
            },
            {
                groupName: Intl.get('common.tag', '标签'),
                groupId: 'labels',
                data: _.drop(this.state.tagList).map(x => {
                    const item = {
                        name: x.show_name,
                        value: x.name,
                        selected: _.indexOf(selectedLabels, x.name) !== -1
                    };
                    if (x.name === Intl.get('crm.tag.unknown', '未打标签的客户')) {
                        item.selectOnly = true;
                    }
                    return item;
                })
            },
            {
                groupName: Intl.get('crm.competing.products', '竞品'),
                groupId: 'competing_products',
                data: _.drop(this.state.competitorList).map(x => ({
                    name: x.show_name,
                    value: x.name,
                    selected: _.indexOf(selectedCompetings, x.name) !== -1
                }))
            },
            {
                groupName: Intl.get('common.industry', '行业'),
                groupId: 'industry',
                singleSelect: true,
                data: _.drop(industryArray).map(x => ({
                    name: x,
                    value: x,
                    selected: x === _.get(this.state, 'condition.industry', '')
                }))
            },
            {
                groupName: Intl.get('crm.administrative.level', '行政级别'),
                groupId: 'administrative_level',
                data: _.drop(filterLevelArray).map(x => ({
                    name: x.level,
                    value: x.id,
                    selected: _.indexOf(selectedLevel, x.id) !== -1
                }))
            },
            {
                groupName: Intl.get('crm.96', '地域'),
                groupId: 'province',
                singleSelect: true,
                data: [Intl.get('user.unknown', '未知')]
                    .concat(this.state.provinceList)
                    .map(x => ({
                        name: x,
                        value: x,
                        selected: x === _.get(this.state, 'condition.province', '')
                    }))
            }
        ];
        //普通销售展示负责人和联合跟进人的筛选（用户来筛选销售是负责人还是联合跟进人）
        if (userData.getUserData().isCommonSales) {
            let loginUserName = userData.getUserData().nick_name;
            advancedData.unshift({
                groupName: Intl.get('crm.second.sales', '联合跟进人'),
                groupId: 'second_nickname',
                singleSelect: true,
                data: [{
                    name: loginUserName,
                    value: loginUserName,
                    selected: loginUserName === _.get(this.state, 'condition.second_nickname', '')
                }]
            });
            advancedData.unshift({
                groupName: Intl.get('crm.6', '负责人'),
                groupId: 'nickname',
                singleSelect: true,
                data: [{
                    name: loginUserName,
                    value: loginUserName,
                    selected: loginUserName === _.get(this.state, 'condition.nickname', '')
                }]
            });
        } else {//非普通销售才有销售角色和团队
            let salesTeamId = _.get(this.state, 'condition.sales_team_id', '');
            let userList = [];
            //如果选了团队，负责人列表为选中团队内的人
            if (salesTeamId) {
                let selectedTeamIds = salesTeamId.split(',');
                let memberIds = [];
                _.each(selectedTeamIds, teamId => {
                    let team = this.getTeamFromTree(this.state.teamTreeList, teamId);
                    //获取团队及下级团队的成员id
                    let curTeamMemberIds = this.traverseTeamMember([team]);
                    memberIds = _.concat(memberIds, curTeamMemberIds);
                });
                //去重，父子团队都选中时，会有重复的情况
                memberIds = _.uniq(memberIds);
                //过滤掉不是该团队内的成员
                userList = _.filter(this.state.userList, user => _.indexOf(memberIds, user.user_id) !== -1);
            } else {
                userList = this.state.userList;
            }
            userList = _.uniqBy(userList, 'nickname');
            if (_.get(userList, 'length')) {
                advancedData.unshift({
                    groupName: Intl.get('crm.second.sales', '联合跟进人'),
                    groupId: 'second_nickname',
                    singleSelect: true,
                    data: _.map(userList, x => ({
                        name: x.nickname,
                        value: x.nickname,
                        selected: x.nickname === _.get(this.state, 'condition.second_nickname', '')
                    }))
                });
                advancedData.unshift({
                    groupName: Intl.get('crm.6', '负责人'),
                    groupId: 'nickname',
                    singleSelect: true,
                    data: _.map(userList, x => ({
                        name: x.nickname,
                        value: x.nickname,
                        selected: x.nickname === _.get(this.state, 'condition.nickname', '')
                    }))
                });
            }
            //已选中的销售角色列表
            let selectedRoles = _.get(this.state, 'condition.member_role', '').split(',');
            advancedData.unshift(
                {
                    groupName: Intl.get('crm.detail.sales.role', '销售角色'),
                    groupId: 'member_role',
                    data: _.drop(this.state.salesRoleList).map(x => ({
                        name: x.show_name,
                        value: x.name,
                        selected: _.indexOf(selectedRoles, x.name) !== -1
                    }))
                },
                {
                    groupName: Intl.get('user.sales.team', '销售团队'),
                    groupId: 'sales_team_id',
                    data: _.drop(this.state.teamList).map(x => ({
                        name: x.group_name,
                        value: x.group_id,
                        selected: _.indexOf(salesTeamId.split(','), x.group_id) !== -1
                    }))
                }
            );
        }
        return (
            <div data-tracename="筛选">
                <div className="crm-filter-panel">
                    <FilterList
                        ref="filterlist"
                        style={this.props.style}
                        showSelectTip={this.props.showSelectTip}
                        commonLoading={this.state.commonFilterList.loading}
                        commonData={commonData.concat(this.state.commonFilterList.data)}
                        advancedData={advancedData}
                        onDelete={this.onDelete.bind(this)}
                        onFilterChange={this.handleFilterChange.bind(this)}
                    />
                </div>
            </div>
        );
    }
}
CrmFilterPanel.propTypes = {
    showSelectTip: PropTypes.bool,
    style: PropTypes.object,
    search: PropTypes.func
};
module.exports = CrmFilterPanel;

