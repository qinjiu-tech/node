/**
 * 客户、用户、电话、合同统计总数
 * Created by wangliping on 2016/11/14.
 */
let Icon = require("antd").Icon;
let classNames = require("classnames");
let SalesHomeAction = require("../action/sales-home-actions");
let viewConstant = require("../util/constant").VIEW_CONSTANT;//视图常量
let TimeUtil = require("../../../../public/sources/utils/time-format-util");
let StatisticTotal = React.createClass({
    //渲染等待效果、暂无数据的提示
    renderTooltip: function (totalObj) {
        if (totalObj.resultType == "loading") {
            return (<Icon type="loading"/>);
        } else if (totalObj.resultType == "error") {
            return (<div className="no-total-data">{Intl.get("sales.home.get.data.failed", "获取数据失败")}</div>);
        }
    },
    renderCustomerContent: function () {
        const customerTotalObj = this.props.customerTotalObj;
        const customerData = customerTotalObj.data;
        if (customerTotalObj.resultType) {
            //渲染等待效果或暂无数据的提示
            return this.renderTooltip(customerTotalObj);
        }
        return (<div className="statistic-total-content">
            <span className="crm-add-data add-data-style">
                <span className="total-data-desc">{Intl.get("sales.home.new.add", "新增")}&nbsp;</span>
                {customerData.added || 0}
            </span>
            <span className="crm-total-data total-data-style">
                <ReactIntl.FormattedMessage
                    id="sales.home.total.count"
                    defaultMessage={`共{count}个`}
                    values={{"count":customerData.total || 0}}
                />
            </span>
        </div>);

    },
    renderUserContent: function () {
        var userTotalObj = this.props.userTotalObj;
        const userData = userTotalObj.data;
        if (userTotalObj.resultType) {
            //渲染等待效果或暂无数据的提示
            return this.renderTooltip(userTotalObj);
        }
        return (<div className="statistic-total-content">
            <span className="user-add-data add-data-style">
                <span className="total-data-desc">{Intl.get("sales.home.new.add", "新增")}&nbsp;</span>
                {userData.added || 0}
            </span>
            <span className="user-total-data total-data-style">
                <ReactIntl.FormattedMessage
                    id="sales.home.total.count"
                    defaultMessage={`共{count}个`}
                    values={{"count":userData.total || 0}}
                />
            </span>
        </div>);
    },
    renderPhoneContent: function () {
        var phoneTotalObj = this.props.phoneTotalObj;
        const phoneData = phoneTotalObj.data;
        if (phoneTotalObj.resultType) {
            //渲染等待效果或暂无数据的提示
            return this.renderTooltip(phoneTotalObj);
        }
        let time = TimeUtil.secondsToHourMinuteSecond(phoneData.totalTime || 0);
        return (<div className="statistic-total-content">
                    <span className="phone-total-time phone-total-data">
                        {time.hours > 0 ? <span>{time.hours}<span
                            className="total-data-desc">{Intl.get("user.time.hour", "小时")} </span></span> : null}
                        {time.minutes > 0 ?
                            <span>{time.minutes}<span
                                className="total-data-desc">{Intl.get("user.time.minute", "分")} </span></span> : null}
                        {time.second > 0 ? <span>{time.second}<span
                            className="total-data-desc">{Intl.get("user.time.second", "秒")} </span></span> : null}
                        {time.timeDescr == 0 ? time.timeDescr : null}
                    </span>

                    <span className="phone-total-count total-data-style">
                         <ReactIntl.FormattedMessage
                             id="sales.home.count"
                             defaultMessage={`{count}个`}
                             values={{"count":phoneData.totalCount || 0}}
                         />
                    </span>
        </div>);
    },
    renderContractContent: function () {
        return (<div className="statistic-total-content">
            <span className="contract-add-data add-data-style">新增8个</span>
            <span className="contract-total-data total-data-style">共6909个</span>
        </div>);
    },
    renderCallBackContent () {
        let callBackTotalObj = this.props.callBackTotalObj;
        if (callBackTotalObj.resultType) {
            // 渲染等待效果或暂无数据的提示
            return this.renderTooltip(callBackTotalObj);
        }
        return (
            <div className={'statistic-total-content'}>
                <span className='add-data-style'>
                    <span className='total-data-desc'>{Intl.get('common.total', '共')}</span>
                    {callBackTotalObj.data.total || '0'}
                    <span className='total-data-desc'>{Intl.get('common.one.unit', '个')}</span>
                </span>
            </div>
        );
    },
    //设置当前要展示的视图
    setActiveView: function (view) {
        SalesHomeAction.setActiveView(view);
    },

    render: function () {
        //响应式样式 col-xs-12 col-sm-6 col-md-6 col-lg-3（四个框时的样式）
        const autoResizeCls = "total-data-item col-xs-12 col-sm-6 col-md-6 col-lg-3";
        let activeView = this.props.activeView;
        return (
            <div className="statistic-total-data">
                <div className={autoResizeCls}>
                    <div onClick={this.setActiveView.bind(this,viewConstant.CUSTOMER)}
                         data-tracename="查看客户统计"
                         className={classNames("total-data-container", {"total-data-item-active":activeView==viewConstant.CUSTOMER})}>
                        <p>{Intl.get("sales.home.customer", "客户")}</p>
                        {this.renderCustomerContent()}
                    </div>
                </div>
                <div className={autoResizeCls}>
                    <div onClick={this.setActiveView.bind(this,viewConstant.USER)}
                         data-tracename="查看用户统计"
                         className={classNames("total-data-container", {"total-data-item-active":activeView==viewConstant.USER})}>
                        <p>{Intl.get("sales.home.user", "用户")}</p>
                        {this.renderUserContent()}
                    </div>
                </div>
                <div className={autoResizeCls}>
                    <div onClick={this.setActiveView.bind(this,viewConstant.PHONE)}
                         data-tracename="查看电话统计"
                         className={classNames("total-data-container", {"total-data-item-active":activeView==viewConstant.PHONE})}>
                        <p>{Intl.get("common.phone", "电话")}</p>
                        {this.renderPhoneContent()}
                    </div>
                </div>  
                <div className={autoResizeCls}>
                    <div onClick={this.setActiveView.bind(this,viewConstant.CALL_BACK)}
                         data-tracename='查看回访统计'
                         className={classNames('total-data-container', {'total-data-item-active': activeView === viewConstant.CALL_BACK})}>
                        <p>{Intl.get('common.callback', '回访')}</p>
                        {this.renderCallBackContent()}
                    </div>
                </div>
            </div>);
    }
});

module.exports = StatisticTotal;