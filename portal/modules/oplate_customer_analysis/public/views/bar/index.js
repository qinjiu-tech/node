/**
 * 线图
 */
var echarts = require("echarts-eefung");
require("./index.less");
var Color = require("color");
var emitter = require("../../utils/emitter");
var Spinner = require("../../../../../components/spinner");
var echartsTooltipCssText = require("../../../../../lib/utils/echarts-tooltip-csstext");
var immutable = require("immutable");
const querystring = require("querystring");
import macronsTheme from "CMP_DIR/echarts-theme/macrons";
import { packageTry } from 'LIB_DIR/func';

var COLORSINGLE = '#1790cf';
var COLORMULTIPLE = ['#1790cf', '#1bb2d8'];

var BarChart = React.createClass({
    echartInstance: null,
    getDefaultProps: function() {
        return {
            list: [],
            title: Intl.get("oplate_customer_analysis.4", "团队统计"),
            width: '100%',
            height: 214,
            resultType: 'loading',
            startDate: '',
            endDate: '',
            /**
             * [
             *  {name : '正式',key : 'formal'}
             * ]
             */
            legend: null,
            showLabel: false//是否展示柱状图上的数据
        };
    },
    getLegend: function() {
        if (!this.props.legend) {
            return {
                show: false,
                data: []
            };
        }
        return {
            show: false,
            data: _.pluck(this.props.legend, 'name')
        };
    },
    getCategorys: function() {
        return _.pluck(this.props.list, 'name');
    },
    getSeries: function() {
        var _this = this;
        var series = [];
        _.each(this.props.legend, function(legendInfo, idx) {
            var currentColor = COLORMULTIPLE[idx];
            var line = {
                name: legendInfo.name,
                type: 'bar',
                barMaxWidth: 40,
                barMinWidth: 4,
                stack: 'stack',
                data: _.pluck(_this.props.list, legendInfo.key),
                itemStyle: {
                    normal: {
                        color: currentColor,
                        label: {show: _this.props.showLabel, position: 'top'}
                    }
                }
            };
            series.push(line);
        });
        return series;
    },
    getTooltip: function() {
        var _this = this;
        return {
            trigger: 'item',
            enterable: true,
            extraCssText: echartsTooltipCssText,
            formatter: function(obj) {
                var value = obj.value;
                var name = obj.name;

                var target = _.find(_this.props.list, function(obj) {
                    return name === obj.name;
                });

                var allTotal = _.reduce(_this.props.list, function(sum, obj) {
                    return sum + obj.total;
                }, 0);

                var list = [];

                var currentTotal = 0, colorList;
                _this.props.legend.map(function(legendInfo, idx) {
                    var value = target[legendInfo.key];
                    var percent = (value * 100 / allTotal).toFixed(2);
                    colorList = COLORMULTIPLE;
                    var color = colorList[idx];
                    currentTotal += value;
                    list.push(`<li><span style="background:${color}"></span><i>${legendInfo.name}</i><i class="number_text">${value}</i></li>`);
                });
                if (_this.props.legend && _this.props.legend.length > 1) {
                    list.unshift(`<li><span style="background:${colorList[0]}"><b style="background:${colorList[1]}"></b></span><i><ReactIntl.FormattedMessage id="oplate_customer_analysis.2" defaultMessage="总数" /></i><i class="number_text">${currentTotal}</i></li>`);
                }

                var displayName = name;
                if (!name) {
                    displayName = 'null';
                } else if (name === 'unknown') {
                    displayName = Intl.get("user.unknown", "未知");
                }
                let timeDesc = Intl.get("oplate_customer_analysis.12", "至{time}为止", {time: _this.props.endDate});
                if (_this.props.startDate) {
                    if (_this.props.startDate == _this.props.endDate) {
                        timeDesc = _this.props.startDate;
                    } else {
                        timeDesc = _this.props.startDate + Intl.get("common.time.connector", "至") + _this.props.endDate;
                    }
                }
                return `<div class="echarts-tooltip">
                            <div class="title">${timeDesc}<span>${displayName}</span></div>
                            <ul class="list-unstyled">
                                ${list.join('')}
                            </ul>
                        </div>`;
            }
        };
    },
    getEchartOptions: function() {
        var option = {
            title: null,
            animation: false,
            tooltip: this.getTooltip(),
            legend: this.getLegend(),
            toolbox: {
                show: false
            },
            calculable: false,
            grid: {
                x: 50,
                y: 20,
                x2: 30,
                y2: 30,
                borderWidth: 0
            },
            xAxis: [
                {
                    type: 'category',
                    data: this.getCategorys(),
                    splitLine: false,
                    axisLine: {
                        lineStyle: {
                            width: 1,
                            color: '#d1d1d1'
                        }
                    },
                    axisTick: {
                        show: false
                    },
                    axisLabel: {
                        textStyle: {
                            color: '#939393',
                            align: 'center'
                        },
                        formatter: function(text) {
                            if (text === 'unknown') {
                                text = Intl.get("user.unknown", "未知");
                            } else if (!text) {
                                text = 'null';
                            }
                            return text;
                        }
                    }
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    splitLine: false,
                    axisLine: {
                        lineStyle: {
                            width: 1,
                            color: '#d1d1d1'
                        }
                    },
                    axisLabel: {
                        textStyle: {
                            color: '#939393'
                        }
                    }
                }
            ],
            series: this.getSeries()
        };
        return option;
    },
    renderChart: function() {
        var _this = this;
        if (this.echartInstance) {
            packageTry(() => {
                this.echartInstance.clear();
            });
        }
        if (this.props.resultType === 'loading') {
            return;
        }
        this.echartInstance = echarts.init(this.refs.chart,macronsTheme);
        if (!this.props.list.length) {
            if (this.echartInstance) {
                packageTry(() => {
                    this.echartInstance.dispose();
                });
                this.echartInstance = null;
            }
            $(this.refs.chart).html("<div class='nodata'>" + Intl.get("common.no.data", "暂无数据") + "</div>");
        } else {
            $(this.refs.chart).find(".nodata").remove();
            var options = this.getEchartOptions();
            this.echartInstance.setOption(options, true);
            const startTime = _this.props.startDate, endTime = _this.props.endDate;
            if (_this.props.getJumpProps) {
                this.echartInstance.on("click", params => {    
                    const jumpProps = _this.props.getJumpProps();
                    let filterVal = params.name;
                    if(jumpProps && jumpProps.query){
                        if(jumpProps.query.analysis_filter_field == "user_id"){
                            filterVal = _this.props.getSaleIdByName(params.name);
                        } else if(jumpProps.query.analysis_filter_field == "sales_team_id"){
                            filterVal = _this.props.getTeamIdByName(params.name);
                        }
                    }
                    let query = {
                        start_date: startTime,
                        end_date: endTime,
                        analysis_filter_value: filterVal||""
                    };
                    if (jumpProps.query) _.extend(query, jumpProps.query);
                    //跳转到客户列表
                    window.open(jumpProps.url + "?" + querystring.stringify(query));
                });
            }
        }
    },
    componentDidMount: function() {
        this.renderChart();
    },
    componentDidUpdate: function(prevProps) {
        if (
            this.props.list.length &&
            prevProps.list.length &&
            immutable.is(this.props.list, prevProps.list) &&
            this.props.width === prevProps.width
        ) {
            return;
        }
        this.renderChart();
    },
    componentWillUnmount: function() {
        if (this.echartInstance) {
            packageTry(() => {
                this.echartInstance.dispose();
            });
            this.echartInstance = null;
        }
    },
    render: function() {
        var _this = this;
        return (
            <div className="analysis_bar_chart" ref="wrap">
                {this.props.resultType === 'loading' ?
                    (
                        <div className="loadwrap" style={{height:this.props.height}}>
                            <Spinner/>
                        </div>
                    ) :
                    (
                        <div>
                            <div ref="chart" style={{width:this.props.width,height:this.props.height}} className="chart"
                                data-title={this.props.title}></div>
                        </div>
                    )
                }
            </div>
        );
    }
});

module.exports = BarChart;