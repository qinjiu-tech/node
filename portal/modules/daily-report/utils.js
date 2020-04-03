import ajax from 'ant-ajax';
import { message, Button } from 'antd';
import { isCurtao, getOrganization } from 'PUB_DIR/sources/utils/common-method-util';
import { detailPanelEmitter, dailyReportEmitter } from 'PUB_DIR/sources/utils/emitters';
import { VIEW_TYPE, REPORT_LIST_DATA_FIELD } from './consts';
import { hasPrivilege } from 'CMP_DIR/privilege/checker';
import publicPrivilegeConst from 'PUB_DIR/privilege-const';
const { CRM_DAILY_REPORT } = publicPrivilegeConst;

const { getLocalWebsiteConfig, setWebsiteConfig } = require('LIB_DIR/utils/websiteConfig');
const SITE_CONGFIG_KEY = 'is_no_longer_show_daily_report_notice';
const DAILY_REPORT_URL = '/rest/customer/v3/dailyreport';
const REPORT_CONFIG_LIST_URL = DAILY_REPORT_URL + '/templates';
const REPORT_CONFIG_URL = DAILY_REPORT_URL + '/template';
const REPORT_URL = DAILY_REPORT_URL + '/report';

//获取是否不再显示查看报告的工作通知
export function getIsNoLongerShowDailyReportNotice() {
    return _.get(getLocalWebsiteConfig(), SITE_CONGFIG_KEY);
}

//设置是否不再显示查看报告的工作通知
export function setIsNoLongerShowDailyReportNotice(cb) {
    let configData = {};
    configData[SITE_CONGFIG_KEY] = true;

    setWebsiteConfig(configData, result => {
        if (_.isFunction(cb)) cb();
    }, err => {
        message.error(err);
    });
}

//显示报告面板
export function showReportPanel(props) {
    detailPanelEmitter.emit(detailPanelEmitter.SHOW, props);
}

//隐藏报告面板
export function hideReportPanel() {
    detailPanelEmitter.emit(detailPanelEmitter.HIDE);
}

//渲染按钮区域
export function renderButtonZoneFunc(buttons) {
    return (
        <div className="btn-zone">
            {_.map(buttons, item => {
                if (item.hide) {
                    return null;
                } else {
                    return (
                        <Button
                            onClick={item.func}
                            type={item.type || 'default'}
                        >
                            {item.name}
                        </Button>
                    );
                }
            })}
        </div>
    );
}

//获取报告配置列表
export function getReportConfigList(paramObj) {
    //不需要显示日报功能时，直接返回
    if (!isShowDailyReport()) return;

    const { callback, query = {} } = paramObj;

    if (!_.isFunction(callback)) return;

    ajax.send({
        url: REPORT_CONFIG_LIST_URL,
        query
    })
        .done(result => {
            result = _.unionBy(result, 'name');
            result = _.filter(result, item => item.name);
            callback(result);
        })
        .fail(err => {
            message.error(err);
            callback();
        });
}

//保存报告配置
export function saveReportConfig(data, paramObj = {}) {
    const { callback, isChangeStatus } = paramObj;

    ajax.send({
        url: REPORT_CONFIG_URL,
        type: 'post',
        data
    })
        .done(result => {
            const msg = isChangeStatus ? Intl.get('analysis.changed.report.status.successfully', '修改报告启停状态成功') : Intl.get('analysis.changed.report.rule.setting.successfully', '修改报告规则设置成功');
            message.success(msg);
            if (_.isFunction(callback)) callback(result);
            if (isChangeStatus) dailyReportEmitter.emit(dailyReportEmitter.CHANGE_STATUS, result);
        })
        .fail(err => {
            message.error(err);
        });
}

//获取报告列表
export function getReportList(paramObj) {
    let { callback, query, reportConfigId } = paramObj;

    if (!_.isFunction(callback)) return;

    if (!query) {
        query = {
            start_time: moment().startOf('day').valueOf(),
            end_time: moment().valueOf(),
        };
    }

    ajax.send({
        url: REPORT_URL,
        query
    })
        .done(result => {
            const data = processReportListData(reportConfigId, result);
            callback(data);
        })
        .fail(err => {
            message.error(err);
            callback();
        });
}

export function processReportListData(reportConfigId, data, chart) {
    if (!reportConfigId) reportConfigId = _.get(location.href.match(/id=(.*)/), [1]);

    let reportData = _.find(data, item => item.template_id === reportConfigId);

    if (reportData) {
        if (chart) chart.title = reportData.template_name;
        reportData = _.get(reportData, REPORT_LIST_DATA_FIELD);
    } else {
        if (chart) chart.title = '';
        return [];
    }

    _.each(reportData, item => {
        _.each(item.item_values, obj => {
            const { name, value, value_str } = obj;

            switch (name) {
                case '通话时长':
                    obj.value = value + Intl.get('user.time.second', '秒');
                    item[name] = obj.value;
                    break;
                case '其他':
                    item[name] = value_str;
                    break;
                default:
                    item[name] = value;
            }
        });
    });

    return reportData;
}

//保存报告
export function saveReport(data, callback) {
    if (!_.isFunction(callback)) return;

    ajax.send({
        url: REPORT_URL,
        type: 'post',
        data
    })
        .done(result => {
            message.success(Intl.get('analysis.report.saved.successfully', '保存报告成功'));
            callback(result);
        })
        .fail(err => {
            message.error(err);
            callback();
        });
}

//显示数字详情
export function showNumberDetail(record, name, e) {
    Trace.traceEvent(e, '查看数字详情');

    //只有单个销售的数据允许点击查看详情
    if (!record.nickname) return;

    if (e && _.isFunction(e.stopPropagation)) e.stopPropagation();

    const itemValues = _.get(record, 'item_values');
    const numberDetail = _.find(itemValues, item => item.name === name);

    showReportPanel({
        currentView: VIEW_TYPE.NUMBER_DETAIL,
        reportDetail: record,
        numberDetail,
    });
}

//是否显示日报功能
export function isShowDailyReport() {
    if (true) return true;
    const org = getOrganization();
    const versionName = _.get(org, 'version.name');
    const isValidVersion = _.includes(['专业版', '企业版'], versionName);

    if (isCurtao() || !isValidVersion || !hasPrivilege(CRM_DAILY_REPORT)) {
        return false;
    } else {
        return true;
    }
}

export function handleReportStatusChange(reportConfig) {
    let reportConfigList = _.cloneDeep(this.state.reportConfigList);
    const index = _.findIndex(reportConfigList, item => item.id === reportConfig.id);

    if (index === -1) {
        reportConfigList.push(reportConfig);
    } else {
        reportConfigList.splice(index, 1, reportConfig);
    }

    this.setState({ reportConfigList });
}

export function numberRender(name, value = 0, record = {}) {
    if (_.isString(value)) {
        const matched = value.match(/^\d+/);

        if (matched) {
            value = _.toInteger(matched[0]);
        } else {
            value = 0;
        }
    }

    if (value === 0 || !record.nickname) {
        return value;
    } else {
        return <span className='clickable' onClick={showNumberDetail.bind(this, record, name)}>{value}</span>;
    }
}
