import ajax from 'ant-ajax';
import { message, Button } from 'antd';
import { isCurtao, getOrganization } from 'PUB_DIR/sources/utils/common-method-util';
import { detailPanelEmitter, dailyReportEmitter } from 'PUB_DIR/sources/utils/emitters';
import { VIEW_TYPE } from './consts';

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

//获取模板列表
export function getReportConfigList(paramObj) {
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

//保存模板
export function saveReportConfig(data, paramObj = {}) {
    const { callback, isChangeStatus } = paramObj;

    ajax.send({
        url: REPORT_CONFIG_URL,
        type: 'post',
        data
    })
        .done(result => {
            const msg = isChangeStatus ? '修改报告启停状态成功' : '保存报告规则设置成功';
            message.success(msg);
            if (_.isFunction(callback)) callback(result);
            if (isChangeStatus) dailyReportEmitter.emit(dailyReportEmitter.CHANGE_STATUS);
        })
        .fail(err => {
            message.error(err);
        });
}

//获取模板数值
export function getReportConfigValues(callback) {
    if (!_.isFunction(callback)) return;

    ajax.send({
        url: REPORT_CONFIG_URL + '/values'
    })
        .done(result => {
            callback(result);
        })
        .fail(err => {
            message.error(err);
            callback();
        });
}

//获取报告列表
export function getReportList(callback, query) {
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
            const list = _.get(result, 'daily_reports', []);
            callback(list);
        })
        .fail(err => {
            message.error(err);
            callback();
        });
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
            message.success('保存报告成功');
            callback(result);
        })
        .fail(err => {
            message.error(err);
            callback();
        });
}

//显示数字详情
export function showNumberDetail(record, name, e) {
    if (true) return; //因数字详情面板样式还没调好，暂时不让打开详情模板
    //只有单个销售的数据允许点击查看详情
    if (!record.nickname) return;

    if (e && _.isFunction(e.stopPropagation)) e.stopPropagation();

    const itemValues = _.get(record, 'item_values');
    const itemValue = _.find(itemValues, item => item.name === name);
    const numberDetail = _.get(itemValue, 'detail');

    showReportPanel({
        currentView: VIEW_TYPE.NUMBER_DETAIL,
        reportDetail: record,
        numberDetail,
    });
}

//是否显示日报功能
export function isShowDailyReport() {
    const org = getOrganization();
    const versionName = _.get(org, 'version.name');
    const isValidVersion = _.includes(['专业版', '企业版'], versionName);

    if (isCurtao() || !isValidVersion) {
        return false;
    } else {
        return true;
    }
}
