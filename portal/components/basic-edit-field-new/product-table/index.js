/**
 * 产品展示、编辑组件

 * 适应场景：用在需要以表格形式展示数据，并能直接在表格内编辑、删除数据的情况下
 * 
 * 用法：
 * 支持antd表格的所有属性
 * 另外增加了两个属性：
 *   isEdit - 表格是否处于编辑状态，默认为false。若设置为true，则列定义中包含editable为true属性的列会显示为输入框，同时在每一行的后面会出现一个删除按钮
 *   onEdit - 表格数据被修改后触发的回调函数，会将改变后的表格数据整体传出去。通过将传出去的值再通过dataSource属性的方式回传回该组件，可实现表格展示与变化后的数据的同步。
 * 
 * 列定义中增加了一个属性：
 *   editable - 控制该列是否可编辑，若设置为true，则在表格的isEdit属性为true的情况下，该列会显示成输入框的形式，里面的值可以被编辑
 */
require('./style.less');
import PropTypes from 'prop-types'; 
import { AntcEditableTable } from 'antc';
import {DetailEditBtn} from '../../rightPanel';
import SaveCancelButton from '../../detail-card/save-cancel-button';
import SelectAppList from '../../select-app-list';
import { num as antUtilsNum } from 'ant-utils';
const parseAmount = antUtilsNum.parseAmount;
// 开通应用，默认的数量和金额
const APP_DEFAULT_INFO = {
    COUNT: 1,
    PRICE: 1000
};

class ProductTable extends React.Component {
    static defaultProps = {
        appList: [],
        columns: [],
        dataSource: [],
        bordered: true,
        isAdd: false,
        isEdit: false,
        isEditBtnShow: false,
        onChange: function() {},
        onSave: function() {},
    };

    static propTypes = {
        appList: PropTypes.array,
        columns: PropTypes.array,
        dataSource: PropTypes.array,
        bordered: PropTypes.bool,
        isAdd: PropTypes.bool,
        isEdit: PropTypes.bool,
        isEditBtnShow: PropTypes.bool,
        onChange: PropTypes.func,
        onSave: PropTypes.func,
    };

    constructor(props) {
        super(props);
        this.state = {
            isEdit: this.props.isEdit || this.props.isAdd,
            columns: this.getColumns(),
            data: this.props.dataSource,
        };
    }

    getColumns() {
        let columns = this.props.columns;

        if (_.isEmpty(columns)) {
            columns = [
                {
                    title: Intl.get('crm.contract.product.name', '产品名称'),
                    dataIndex: 'name',
                    key: 'name',
                    render: (text, record, index) => {
                        return <span className='app-info'>{this.renderAppIconName(text, record.id)}</span>;
                    }
                },
                {
                    title: Intl.get('crm.contract.account.count', '账号数量'),
                    dataIndex: 'count',
                    editable: true,
                    key: 'count'
                },
                {
                    title: Intl.get('crm.contract.money', '金额(元)'),
                    dataIndex: 'total_price',
                    editable: true,
                    key: 'total_price',
                    render: (text) => {
                        return <span>{parseAmount(text.toFixed(2))}</span>;
                    }
                }
            ];
        }

        return columns;
    }

    componentWillReceiveProps(nextProps) {
    }

    handleChange = data => {
        this.setState({data}, () => {
            if (this.props.isAdd) {
                this.props.onChange(data);
            }
        });
    }

    handleCancel = () => {
        this.setState({
            isEdit: false
        });
    }

    handleSubmit = () => {
        const data = _.cloneDeep(this.state.data);


        this.props.onSave(data);
    }

    showEdit = () => {
        this.setState({
            isEdit: true
        });
    }

    renderAppIconName(appName, appId) {
        let appList = this.props.appList;
        let matchAppObj = _.find( appList, (appItem) => {
            return appItem.client_id === appId;
        });
        return (
            <span className='app-icon-name'>
                {appName ? (
                    matchAppObj && matchAppObj.client_image ? (
                        <span className='app-self'>
                            <img src={matchAppObj.client_image} />
                        </span>
                    ) : (
                        <span className='app-default'>
                            <i className='iconfont icon-app-default'></i>
                        </span>
                    )
                ) : null}
                <span className='app-name' title={appName}>{appName}</span>
            </span>
        );
    }
    getSelectAppList = selectedAppIds => {
        let data = _.cloneDeep(this.state.data);

        _.each(selectedAppIds, appId => {
            const selectedApp = _.find(this.props.appList, app => app.client_id === appId);

            data.push({
                id: selectedApp.client_id,
                name: selectedApp.client_name,
                count: APP_DEFAULT_INFO.COUNT,
                total_price: APP_DEFAULT_INFO.PRICE,
            });
        });

        this.setState({data}, () => {
            if (this.props.isAdd) {
                this.props.onChange(data);
            }
        });
    }
    render() {
        const appNames = _.map(this.state.data, 'name');

        const appList = _.filter(this.props.appList, app => appNames.indexOf(app.client_name) === -1);

        return (
            <div className="product-table">
                {this.state.isEdit || !this.props.isEditBtnShow ? null : (
                    <DetailEditBtn
                        onClick={this.showEdit}
                    /> 
                )}
                {this.props.isAdd && _.isEmpty(this.state.data) ? null : (
                    <AntcEditableTable
                        isEdit={this.state.isEdit}
                        onEdit={this.handleChange}
                        columns={this.state.columns}
                        dataSource={this.state.data}
                        bordered={this.props.bordered}
                    /> 
                )}
                {this.state.isEdit ? (
                    <div>
                        <SelectAppList
                            appList={appList}
                            getSelectAppList={this.getSelectAppList}
                        /> 
                        {this.props.isAdd ? null : (
                            <SaveCancelButton
                                handleSubmit={this.handleSubmit}
                                handleCancel={this.handleCancel}
                            /> 
                        )}
                    </div>
                ) : null}
            </div>
        );
    }
}

export default ProductTable;
