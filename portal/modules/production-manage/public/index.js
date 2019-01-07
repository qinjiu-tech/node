/**
 * Copyright (c) 2015-2018 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2015-2018 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by liwenjun on 2018/10/30.
 */
let language = require('PUB_DIR/language/getLanguage');
if (language.lan() === 'es' || language.lan() === 'en') {
    require('./style/index-es_VE.less');
} else if (language.lan() === 'zh') {
    require('./style/index-zh_CN.less');
}
let ProductionStore = require('./store/production-store');
let ProductionAction = require('./action/production-actions');
let RightCardsContainer = require('../../../components/rightCardsContainer');
let Production = require('./views/production');
let PrivilegeChecker = require('../../../components/privilege/checker').PrivilegeChecker;
let Spinner = require('../../../components/spinner');
let openTimeout = null;//打开面板时的时间延迟设置
let hasPrivilege = require('CMP_DIR/privilege/checker').hasPrivilege;
let util = require('./utils/production-util');
import {Button, Select} from 'antd';
import Trace from 'LIB_DIR/trace';
import ButtonZones from 'CMP_DIR/top-nav/button-zones';
import {getIntegrationConfig} from 'PUB_DIR/sources/utils/common-data-util';
import {INTEGRATE_TYPES} from 'PUB_DIR/sources/utils/consts';

//用来存储获取的oplate\matomo产品列表，不用每次添加产品时都获取一遍
let productList = [];
class ProductionManage extends React.Component {
    state = {
        ...ProductionStore.getState(),
        integrateType: '', //集成类型uem、oplate、matomo
        productList: productList, //集成的oplate\matomo产品列表
        isAddingProduct: false,//正在导入产品
        addErrorMsg: ''//导入产品失败的提示
    };

    onChange = () => {
        this.setState(ProductionStore.getState());
    };

    componentDidMount() {
        $('body').css('overflow', 'hidden');
        ProductionStore.listen(this.onChange);
        //获取集成类型
        this.getIntegrationConfig();
    }

    componentWillUnmount() {
        $('body').css('overflow', 'auto');
        ProductionStore.unlisten(this.onChange);
    }

    getIntegrationConfig() {
        this.setState({isGettingIntegrateType: true});
        getIntegrationConfig(resultObj => {
            // 获取集成配置信息失败后的处理
            if (resultObj.errorMsg) {
                this.setState({isGettingIntegrateType: false, getItegrateTypeErrorMsg: resultObj.errorMsg});
            } else {
                //集成类型： uem、oplate、matomo
                let integrateType = _.get(resultObj, 'type');
                this.setState({isGettingIntegrateType: false, integrateType, getItegrateTypeErrorMsg: ''});
                //获取oplate\matomo产品列表
                if (this.isOplateOrMatomoType(integrateType)) {
                    this.getProductList(integrateType);
                }
            }
        });
    }

    //是否是oplate或matomo类型
    isOplateOrMatomoType(integration_type) {
        let typeList = [INTEGRATE_TYPES.OPLATE, INTEGRATE_TYPES.MATOMO];
        return typeList.indexOf(integration_type) !== -1;
    }

    getProductList(integrationType) {
        if (_.get(productList, '[0]')) {
            this.setState({productList: productList});
        } else {
            $.ajax({
                url: '/rest/product/' + integrationType,
                type: 'get',
                dataType: 'json',
                data: {page_num: 1, page_size: 1000},
                success: (result) => {
                    productList = result || [];
                    this.setState({productList: productList});
                },
                error: (xhr) => {
                    productList = [];
                    this.setState({productList: productList});
                }
            });
        }
    }

    //集成opalte、Matomo产品
    integrateProdcut = (productList) => {
        this.setState({isAddingProduct: true});
        $.ajax({
            url: '/rest/product/' + this.state.integrateType,
            type: 'post',
            dataType: 'json',
            data: {ids: productList.join(',')},
            success: (result) => {
                this.setState({
                    isAddingProduct: false,
                    addErrorMsg: ''
                });
                if (_.get(result, '[0]')) {
                    _.each(result, item => {
                        this.events_afterOperation(util.CONST.ADD, item);
                    });
                    this.events_closeRightPanel();
                }
            },
            error: (xhr) => {
                this.setState({
                    isAddingProduct: false,
                    addErrorMsg: xhr.responseJSON || Intl.get('crm.154', '添加失败')
                });
            }
        });
    }

    //展示产品信息
    events_showAddForm = (type) => {
        ProductionAction.showForm(type);
    };

    //切换页数时，当前页展示数据的修改
    events_onChangePage = (count, curPage) => {
        ProductionAction.updateCurPage(curPage);
        ProductionAction.getProductions({page_size: count, id: this.state.lastId});
    };

    events_showDetail = (production) => {
        Trace.traceEvent('产品管理', '点击查看产品详情');
        ProductionAction.setCurProduction(production.id);
        if ($('.right-panel-content').hasClass('right-panel-content-slide')) {
            $('.right-panel-content').removeClass('right-panel-content-slide');
            if (openTimeout) {
                clearTimeout(openTimeout);
            }
            openTimeout = setTimeout(function() {
                ProductionAction.showInfoPanel();
            }, 200);
        } else {
            ProductionAction.showInfoPanel();
        }
    };

    events_searchEvent = (searchContent) => {
    };

    //右侧面板的关闭
    events_closeRightPanel = () => {
        //将数据清空
        ProductionAction.setInitialData();
        ProductionAction.closeInfoPanel();
    };
    //添加产品后
    events_afterOperation = (type, production) => {
        if (type === util.CONST.ADD) {
            ProductionAction.addProduction(production);
        } else {
            ProductionAction.updateProduction(production);
        }
    };

    //由编辑页面返回信息展示页面
    events_returnInfoPanel = (newAddUser) => {
        ProductionAction.returnInfoPanel(newAddUser);
    };

    //一页展示多少
    events_updatePageSize = (count) => {
        ProductionAction.updatePageSize(count);
    };

    getCardList = () => {
        let productionList = _.isArray(this.state.productionList) ? this.state.productionList : [];
        return productionList.map(production => {
            return {
                id: production.id,
                name: production.name,
                full_image: production.full_image,
                image: production.preview_image,
                specifications: {
                    label: Intl.get('config.product.spec', '规格或版本') + ':',
                    value: production.specifications,
                    showOnCard: true
                },
                code: {
                    label: Intl.get('config.product.code', '产品编号') + ':',
                    value: production.code,
                    showOnCard: true
                },
                description: production.description,
                url: {
                    label: Intl.get('config.product.url', '访问地址') + ':',
                    value: production.url,
                    showOnCard: true
                },
                showDelete: production.integration_type ? false : true,//集成的产品不可以删除，自己加的普通产品可以删
                leftFlagDesc: this.getProductFlagDesc(production)
            };
        });

    };
    //获取产品标识的描述
    getProductFlagDesc(production) {
        let integration_type = _.get(production, 'integration_type');
        if (integration_type) {
            if (integration_type === 'uem') {
                return Intl.get('customer.ketao.app', '客套');
            } else {
                return integration_type.toUpperCase();
            }
        } else {
            return '';
        }
    }

    hasNoFilterCondition = () => {
        if (this.state.searchContent) {
            return false;
        } else {
            return true;
        }

    };
    renderAddAndImportBtns = () => {
        if (hasPrivilege('USER_MANAGE_ADD_USER')) {
            return (
                <div className="btn-containers">
                    <Button className='add-clue-btn btn-item btn-m-r-2'
                        onClick={this.events_showAddForm.bind(this, util.CONST.ADD)}> {Intl.get('config.product.add', '添加产品')}</Button>
                </div>
            );
        } else {
            return null;
        }

    };
    //删除item
    deleteItem = (itemId) => {
        ProductionAction.deleteItemById(itemId);
    };
    //渲染操作按钮区
    renderTopNavOperation = () => {
        return (<ButtonZones>
            <PrivilegeChecker check="PRODUCTS_MANAGE" className="block float-r btn-item-container"
                onClick={this.events_showAddForm.bind(this, util.CONST.ADD)}
                data-tracename="添加产品">
                <Button className="btn-item btn-m-r-2">
                    {Intl.get('config.product.add', '添加产品')}
                </Button>
            </PrivilegeChecker>
            {this.isOplateOrMatomoType(this.state.integrateType) && _.get(this.state, 'productList[0]') ? (
                <Select
                    mode="multiple"
                    placeholder={Intl.get('config.product.select.tip', '请选择产品（可多选）')}
                >
                    { _.map(this.state.productList, (item, idx) => {
                        return <Option key={idx} value={item.id}>{item.name}</Option>;
                    })}
                </Select>) : null}
            {/*<SaveCancelButton*/}
            {/*     loading={this.state.isAddingProduct}*/}
            {/*     saveErrorMsg={this.state.addErrorMsg}*/}
            {/*     handleSubmit={this.integrateProdcut}*/}
            {/*     handleCancel={this.handleCancel.bind(this)}*/}
            {/* />*/}
        </ButtonZones>);
    };

    render() {
        var firstLoading = this.state.isLoading;
        return (
            <div className="production_manage_style backgroundManagement_production_content" data-tracename="产品管理">
                {this.renderTopNavOperation()}
                {
                    firstLoading ? <div className="firstLoading">
                        <Spinner/>
                    </div> : null
                }
                <RightCardsContainer
                    currentCard={this.state.currentProduction}
                    cardListSize={this.state.userListSize}
                    curCardList={this.getCardList()}
                    listTipMsg={this.state.listTipMsg}
                    curPage={this.state.curPage}
                    pageSize={this.state.pageSize}
                    searchPlaceHolder={Intl.get('common.product.name', '产品名称')}
                    updatePageSize={this.events_updatePageSize.bind(this)}
                    changePageEvent={this.events_onChangePage.bind(this)}
                    showCardInfo={this.events_showDetail.bind(this)}
                    renderAddAndImportBtns={this.renderAddAndImportBtns}
                    showAddBtn={this.hasNoFilterCondition()}
                    deleteItem={this.deleteItem}
                >
                    {this.state.formShow ?
                        <Production
                            integrateType={this.state.integrateType}
                            formType={this.state.currentProduction.id ? util.CONST.EDIT : util.CONST.ADD}
                            info={this.state.currentProduction}
                            closeRightPanel={this.events_closeRightPanel}
                            afterOperation={this.events_afterOperation}
                        /> : null}
                    {this.state.deleteError ? (<message></message>) : null}
                </RightCardsContainer>
            </div>
        );
    }
}


module.exports = ProductionManage;
