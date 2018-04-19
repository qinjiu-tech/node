var echarts = require("echarts-eefung");
var immutable = require("immutable");
//macrons主题
import macronsTheme from "CMP_DIR/echarts-theme/macrons";
var TimeSeriesLinechart = React.createClass({
    echartInstance : null,
    getDefaultProps : function() {
        return {
            dataList : [],
            tooltip : function() {}
        };
    },
    componentDidMount : function() {
        this.renderChart();
        $(window).on('resize', this.windowResize);
    },
    componentDidUpdate : function(prevProps) {
        if(
            this.props.dataList &&
            prevProps.dataList &&
            immutable.is(this.props.dataList , prevProps.dataList) &&
            this.props.width === prevProps.width && this.props.lineType === prevProps.lineType && this.props.height === prevProps.height
        ) {
            return;
        }
        this.renderChart();
    },
    componentWillUnmount : function() {
        $(window).off('resize', this.windowResize);
        if(this.echartInstance) {
            var _this = this;
            try {_this.echartInstance.clear();}catch(e){}
            this.echartInstance = null;
        }
    },
    windowResize: function () {
        clearTimeout(this.resizeTimeout);
        var _this = this;
        this.resizeTimeout = setTimeout(() => {
           this.renderChart();
        }, 300);
    },
    renderChart : function() {
        var _this = this;
        if(this.echartInstance) {
            try {_this.echartInstance.clear()} catch(e){}
        }
        this.echartInstance = echarts.init(this.refs.chart,macronsTheme);
        var options = this.getEchartOptions();
        this.echartInstance.setOption(options,true);
    },
    getCategorys: function () {
        var data = [];
        if (this.props.isMutileLine) {
            var dataType = this.props.lineType;
            var dataList = this.props.dataList[0];
            _.each(dataList[dataType], (item) => {
                data.push(new Date(item.timestamp));
            });
        } else {
            this.props.dataList.forEach((item) => {
                data.push(new Date(item.timestamp));
            });
        }
        return data;
    },
    getLegendData: function () {
        var data = [];
        if (this.props.isMutileLine) {
            var dataList = this.props.dataList;
            _.each(dataList, (dataItem) => {
                data.push(dataItem.teamName);
            })
        }
        return data;
    },
    getDataSerise: function () {
        if (this.props.isMutileLine) {
            var lineType = this.props.lineType;
            var dataList = this.props.dataList;
            var serise = [];
            _.each(dataList, (dataItem) => {
                var seriseItem = {
                    name: dataItem.teamName,
                    data: [],
                    type: 'line',
                    symbolSize: 6
                };
                _.each(dataItem[lineType], (item) => {
                    seriseItem.data.push(item.count);
                });
                serise.push(seriseItem);
            });
            return serise;
        } else {
            var serise = [{
                name: '',
                type: 'line',
                symbolSize: 6,
                itemStyle: {
                    normal: {
                        color: '#4d96d1'
                    }
                },
                data: []
            }];
            this.props.dataList.forEach((item) => {
                serise[0].data.push(item.count);
            });
        }
        return serise;
    },
    getEchartOptions: function () {
        return {
            title : null,
            toolbox: {
                show : false
            },
            calculable : false,
            tooltip : { // 图表中的提示数据信息
                trigger: 'axis',
                formatter : (params) =>{
                    if (_.isArray(params) && params.length == 1) {
                        var params = params[0];
                        var timeText = moment(params.name || Date.now()).format(oplateConsts.DATE_FORMAT);
                        var count = params.data;
                        return this.props.tooltip(timeText, count);
                    } else if (_.isArray(params) && params.length > 1) {
                        var timeTextArr = [], countArr = [], teamArr = [];
                        _.each(params, (paramsItem) => {
                            timeTextArr.push(moment(paramsItem.name || Date.now()).format(oplateConsts.DATE_FORMAT));
                            countArr.push(paramsItem.data || 0);
                            teamArr.push(paramsItem.seriesName)
                        });
                        return this.props.tooltip(timeTextArr, countArr, teamArr);
                    }
                }
            },
            legend : {
                data: this.getLegendData()
            },
            grid: {
                x : 50,
                y : 20,
                x2 : 30,
                y2 : 30,
                borderWidth : 0
            },
            xAxis : [
                {
                    type: 'category',  // 类型为time，时间轴
                    splitLine: false,
                    splitArea: false,
                    axisLine: {
                        lineStyle: {
                            width: 1,
                            color: '#d1d1d1'
                        }
                    },
                    axisTick : {
                        show : false
                    },
                    axisLabel : {
                        textStyle : {
                            color:'#939393',
                            align:'center'
                        },
                        formatter: () => { // 不显示x轴数值
                            return "";
                        }
                    },
                    data: this.getCategorys(),
                }
            ],
            yAxis : [
                {
                    minInterval: 1,
                    type : 'value',
                    splitLine : false,
                    splitArea : false,
                    axisLine : {
                        lineStyle : {
                            width:1,
                            color:'#d1d1d1'
                        }
                    },
                    axisLabel : {
                        textStyle : {
                            color:'#939393'
                        },
                        formatter: () => { // 不显示y轴数值
                            return "";
                        }
                    },
                    axisTick: { // y轴不显示刻度
                        show:false
                    }
                }
            ],
            series: this.getDataSerise()
        };
    },
    render : function() {
        return (
            <div className="echart_wrap" ref="chart" style={{width:this.props.width, height:this.props.height}}></div>
        );
    }
});

module.exports = TimeSeriesLinechart;