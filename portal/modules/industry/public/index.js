require('./index.less');
const Spinner = require('CMP_DIR/spinner');
import {Icon, Alert, Input, Button} from 'antd';
const AlertTimer = require('CMP_DIR/alert-timer');
import Trace from 'LIB_DIR/trace';
import {BACKGROUG_LAYOUT_CONSTANTS} from 'PUB_DIR/sources/utils/consts';
import {ajustTagWidth} from 'PUB_DIR/sources/utils/common-method-util';
import GeminiScrollBar from 'CMP_DIR/react-gemini-scrollbar';
const PAGE_SIZE = 1000;

class Industry extends React.Component {
    state = {
        isLoading: true, // 获取行业列表的loading，初始状态为true
        TagLists: [], //行业标签列表
        isAddloading: -1, //点击行业添加按钮的loading效果是否显示 否 -1 是 0
        DeletingItemId: -1, //当前正在删除的标签的id值 默认 -1
        isGetInforcorrect: -1, //能否正常获取数据 否 -1 是 0
        getErrMsg: '', //加载失败的提示信息
        addErrMsg: '', //添加失败的信息
        deleteErrMsg: '', // 删除行业失败
        inputValue: '', // 添加行业，input框中的值
    };

    //获取初始行业列表
    getInitialData = () => {
        $.ajax({
            url: '/rest/industries',
            type: 'get',
            dateType: 'json',
            data: {page_size: PAGE_SIZE},
            success: (list) => {
                this.setState({
                    TagLists: list,
                    isGetInforcorrect: 0,
                    isLoading: false
                });
            },
            error: (errorMsg) => {
                this.setState({
                    isGetInforcorrect: -1,
                    getErrMsg: errorMsg.responseJSON,
                    isLoading: false
                });
            }
        });

    };
    componentWillMount() {
        this.getInitialData();
    }

    //删除行业标签
    handleDeleteItem = (item) => {
        //当前正在删除的标签的id
        let id = _.get(item, 'id');
        this.setState({
            DeletingItemId: id
        });
        $.ajax({
            url: '/rest/delete_industries/' + id,
            type: 'delete',
            dateType: 'json',
            success: (result) => {
                if (result) {
                    //在数组中删除当前正在删除的行业
                    let TagLists = _.filter(this.state.TagLists, (industry) => industry.id !== id);
                    this.setState({
                        DeletingItemId: -1,
                        TagLists: TagLists
                    });
                } else {
                    this.setState({
                        DeletingItemId: -1,
                        deleteErrMsg: Intl.get('crm.139','删除失败')
                    });
                }
            },
            error: (errorInfo) => {
                this.setState({
                    DeletingItemId: -1,
                    deleteErrMsg: errorInfo.responseJSON
                });
            }
        });

    };

    //增加行业标签
    handleSubmit = (e) => {
        Trace.traceEvent(e, '点击添加行业按钮');
        e.preventDefault();
        //输入的行业名称去左右空格
        let inputValue = _.trim(this.state.inputValue);
        // 判断是否是空格
        if(!inputValue) {
            return;
        }
        //显示添加的loading效果
        this.setState({
            isAddloading: 0
        });
        $.ajax({
            url: '/rest/add_industries',
            type: 'post',
            dateType: 'json',
            data: {industry: inputValue},
            success: (result) => {
                //数组开头添加输入的标签
                this.state.TagLists.unshift(result);
                this.setState({
                    TagLists: this.state.TagLists,
                    isAddloading: -1,
                    inputValue: ''
                });
            },
            error: (errorInfo) => {
                this.setState({
                    isAddloading: -1,
                    addErrMsg: errorInfo.responseJSON || Intl.get('config.manage.add.industry.error','添加行业失败')
                });
            }
        });

    };

    //增加行业失败
    handleAddIndustryFail = () => {
        let hide = () => {
            this.setState({
                addErrMsg: '',
                isAddloading: -1
            });
            $('#addIndustrySaveBtn').removeAttr('disabled');
        };
        return (
            <div className="add-config-fail">
                <AlertTimer
                    time={4000}
                    message={this.state.addErrMsg}
                    type="error"
                    showIcon
                    onHide={hide}
                />
            </div>
        );
    };

    handleDeleteIndustryFail = () => {
        var hide = () => {
            this.setState({
                deleteErrMsg: ''
            });
        };
        return (
            <div className="delete_ip_config_err_tips">
                <AlertTimer
                    time={4000}
                    message={this.state.deleteErrMsg}
                    type="error"
                    showIcon
                    onHide={hide}
                />
            </div>
        );
    };

    handleInputChange = (event) => {
        let value = _.get(event, 'target.value');
        this.setState({
            inputValue: value
        });
    };

    renderTopNavOperation = () => {
        return (
            <div className='condition-operator'>
                <div className='pull-left'>
                    <Input
                        placeholder={Intl.get('crm.basic.add.industry', '添加行业')}
                        value={this.state.inputValue}
                        onChange={this.handleInputChange}
                        onPressEnter={this.handleSubmit}
                        className='add-input'
                    />
                    <Button
                        className='add-btn'
                        onClick={this.handleSubmit}
                        disabled={this.state.isAddloading === 0}
                    >
                        <Icon type="plus" />
                        {
                            this.state.isAddloading === 0 ?
                                <Icon type="loading" style={{marginLeft: 12}}/> : null
                        }
                    </Button>
                    {
                        this.state.addErrMsg !== '' ? this.handleAddIndustryFail() : null
                    }
                </div>
            </div>
        );
    };

    renderIndustryConfig = () => {
        let TagLists = this.state.TagLists;
        let length = _.get(TagLists, 'length');
        // 内容区宽度
        let contentWidth = $(window).width() - BACKGROUG_LAYOUT_CONSTANTS.FRIST_NAV_WIDTH -
            BACKGROUG_LAYOUT_CONSTANTS.NAV_WIDTH - 2 * BACKGROUG_LAYOUT_CONSTANTS.PADDING_WIDTH;
        let tagWidth = ajustTagWidth(contentWidth);
        return (
            <div className="industry-content-zone">
                <div className="msg-tips">
                    {
                        this.state.deleteErrMsg !== '' ? this.handleDeleteIndustryFail() : null
                    }
                    {
                        length === 0 && !this.state.isLoading ? (
                            <Alert
                                type="info"
                                showIcon
                                message={Intl.get('config.manage.no.industry', '暂无行业配置，请添加！')}
                            />
                        ) : null
                    }
                    {
                        this.state.getErrMsg ? <Alert type="error" showIcon message={this.state.getErrMsg}/> : null
                    }
                </div>
                <div className="content-zone">
                    {
                        this.state.isLoading ? <Spinner/> : null
                    }

                    <ul className="mb-taglist">
                        {
                            _.map(TagLists, (item, index) => {
                                let content = _.get(item, 'industry');
                                return (
                                    <li className="mb-tag" key={index} style={{width: tagWidth}}>
                                        <div className="mb-tag-content">
                                            <span className="tag-content" title={content}>{content}</span>
                                            <span
                                                onClick={this.handleDeleteItem.bind(this, item)}
                                                data-tracename="点击删除某个行业按钮"
                                                className="ant-btn"
                                            >
                                                <i className="iconfont icon-delete handle-btn-item "></i>
                                            </span>
                                            { this.state.DeletingItemId === item.id ? (
                                                <span ><Icon type="loading"/></span>
                                            ) : null
                                            }
                                        </div>
                                    </li>
                                );
                            }
                            )}
                    </ul>
                </div>
            </div>
        );
    };

    render = () => {
        let height = $(window).height() - BACKGROUG_LAYOUT_CONSTANTS.PADDING_HEIGHT;
        let contentHeight = height - BACKGROUG_LAYOUT_CONSTANTS.TOP_ZONE_HEIGHT;
        return (
            <div className="industry-container" data-tracename="行业" style={{height: height}}>
                <div className="industry-content-wrap" style={{height: height}}>
                    <div className="industry-top-nav">
                        {this.renderTopNavOperation()}
                    </div>
                    <GeminiScrollBar style={{height: contentHeight}}>
                        <div className="industry-content">
                            {this.renderIndustryConfig()}
                        </div>
                    </GeminiScrollBar>
                </div>
            </div>
        );
    }
}

module.exports = Industry;
