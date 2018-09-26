/**
 * Copyright (c) 2015-2018 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2015-2018 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by zhangshujuan on 2018/9/26.
 */
const PropTypes = require('prop-types');
var React = require('react');
/**
 * Copyright (c) 2015-2018 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2015-2018 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by zhangshujuan on 2018/8/27.
 */
var classNames = require('classnames');
require('./index.less');
class ApplyListItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedDetailItem: this.props.selectedDetailItem,
            selectedDetailItemIdx: this.props.selectedDetailItemIdx

        };
    }

    onStoreChange = () => {

    };
    componentDidMount = () => {

    };
    componentWillReceiveProps = (nextProps) => {
        this.setState({
            selectedDetailItem: nextProps.selectedDetailItem,
            selectedDetailItemIdx: nextProps.selectedDetailItemIdx,

        });
    };
    componentWillUnmount = () => {

    };

    render() {
        var obj = this.props.obj;
        var index = this.props.index;
        var btnClass = classNames({
            processed: obj.status !== this.props.processedStatus
        });
        var currentClass = classNames('apply-list-item',{
            current: obj.id === this.state.selectedDetailItem.id && index === this.state.selectedDetailItemIdx
        });
        return (
            <li key={obj.id} className={currentClass}
                onClick={this.props.clickShowDetail.bind(this, obj, index)}
            >
                <dl>
                    <dt>
                        <span>{this.props.getApplyTopicText(obj)}</span>
                        <em className={btnClass}>{this.props.getApplyStateText(obj)}</em>
                    </dt>
                    <dd className="clearfix" title={_.get(obj, 'detail.customer_name')}>
                        <span>{_.get(obj, 'detail.customer_name')}</span>
                    </dd>
                    <dd className="clearfix">
                        <span>{Intl.get('user.apply.presenter', '申请人')}:{_.get(obj, 'applicant.user_name')}</span>
                        <em>{this.props.getTimeStr(obj.create_time, oplateConsts.DATE_TIME_WITHOUT_SECOND_FORMAT)}</em>
                    </dd>
                </dl>
            </li>
        );


    }
}
ApplyListItem.defaultProps = {
    selectedDetailItem: {},
    obj: {},
    index: '',
    selectedDetailItemIdx: '',
    getApplyTopicText: function() {

    },
    getApplyStateText: function() {

    },
    getTimeStr: function() {

    },
    clickShowDetail: function() {

    },
    processedStatus: '',
};
ApplyListItem.propTypes = {
    selectedDetailItem: PropTypes.object,
    obj: PropTypes.object,
    index: PropTypes.string,
    selectedDetailItemIdx: PropTypes.string,
    getApplyTopicText: PropTypes.func,
    getApplyStateText: PropTypes.func,
    getTimeStr: PropTypes.func,
    clickShowDetail: PropTypes.func,
    processedStatus: PropTypes.string,

};

export default ApplyListItem;
