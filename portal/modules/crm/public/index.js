var React = require('react');
var util = require('./utils/contact-util');
let CustomerRepeat = require('./views/customer-repeat');
let CrmList = require('./crm-list');
import Trace from 'LIB_DIR/trace';
import CustomerRecycleBin from './views/customer-recycle-bin';
//各视图类型常量
const VIEW_TYPE = {
    CUSTOMER: 'customer',//客户列表视图
    REPEAT_CUSTOMER: 'repeat_customer',//重复客户视图
    RECYCLE_BIN_CUSTOMER: 'recycle_bin_customer'//回收站视图
};
class CrmIndex extends React.Component {
    state = {
        customerViewType: VIEW_TYPE.CUSTOMER//客户展示的视图
    };

    componentDidMount() {
        $('body').css('overflow', 'hidden');
    }

    componentWillUnmount() {
        $('body').css('overflow', 'auto');
    }

    //展示重复客户界面的设置
    showRepeatCustomer = () => {
        Trace.traceEvent($(ReactDOM.findDOMNode(this)).find('.filter-block .customer-repeat-btn'), '点击客户查重按钮');
        this.setState({
            customerViewType: VIEW_TYPE.REPEAT_CUSTOMER
        });
    };
    //展示客户回收站
    showCustomerRecycleBin = () => {
        Trace.traceEvent($(ReactDOM.findDOMNode(this)).find('.filter-block .customer-recycle-btn'), '点击客户回收站');
        this.setState({
            customerViewType: VIEW_TYPE.RECYCLE_BIN_CUSTOMER
        });
    };

    //返回客户列表视图
    returnCustomerView = () => {
        this.setState({
            customerViewType: VIEW_TYPE.CUSTOMER
        });
    };

    render() {
        let currView = null;
        switch (this.state.customerViewType) {
            case VIEW_TYPE.CUSTOMER:
                currView = (
                    <div data-tracename="客户管理">
                        <CrmList {...this.props} showRepeatCustomer={this.showRepeatCustomer}
                            showCustomerRecycleBin={this.showCustomerRecycleBin}/>
                    </div>);
                break;
            case VIEW_TYPE.REPEAT_CUSTOMER:
                currView = (
                    <div data-tracename="重复客户列表">
                        <CustomerRepeat closeRepeatCustomer={this.returnCustomerView}/>
                    </div>);
                break;
            case VIEW_TYPE.RECYCLE_BIN_CUSTOMER:
                currView = (
                    <div data-tracename="客户回收站">
                        <CustomerRecycleBin closeRepeatCustomer={this.returnCustomerView}/>
                    </div>);
                break;
        }
        return currView;
    }
}

module.exports = CrmIndex;

