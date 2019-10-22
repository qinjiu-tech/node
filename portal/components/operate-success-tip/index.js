/**
 * Copyright (c) 2018-2019 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2018-2019 山东客套智能科技有限公司。保留所有权利。
 * Created by tangmaoqin on 2019/10/22.
 */
// 操作成功后的界面
import './style.less';
import FinishedSrc from './finished.svg';
import {Button} from 'antd';

function loop() {}

class OperateSuccessTip extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="operate-finished-wrapper" data-tracename="完成提示框">
                <img src={FinishedSrc}/>
                <div className="operate-finished-title">{this.props.title}</div>
                <div className="operate-finished-tip">{this.props.tip}</div>
                <div className="btn-wrapper">
                    <Button type="primary" onClick={this.props.continueFn} data-tracename="点击继续操作按钮">{this.props.continueText}</Button>
                    <Button onClick={this.props.goFn} data-tracename="点击其他操作按钮">{this.props.goText}</Button>
                </div>
            </div>
        );
    }
}
OperateSuccessTip.defaultProps = {
    title: '添加成功',
    tip: '',
    continueText: Intl.get('guide.continue.add', '继续添加'),//继续操作按钮提示文本
    goText: Intl.get('user.apply.check', '查看'),//其他操作按钮提示文本
    continueFn: loop,//继续操作事件
    goFn: loop,//其他操作事件
};
OperateSuccessTip.propTypes = {
    title: PropTypes.oneOfType[PropTypes.string, PropTypes.element],
    tip: PropTypes.oneOfType[PropTypes.string, PropTypes.element],
    continueText: PropTypes.string,
    goText: PropTypes.string,
    continueFn: PropTypes.func,
    goFn: PropTypes.func,
};

module.exports = OperateSuccessTip;