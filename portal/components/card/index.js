/**
 * Created by wangliping on 2015/12/23.
 */
let React = require('react');
let language = require('../../public/language/getLanguage');
if (language.lan() === 'es' || language.lan() === 'en') {
    require('./card-es_VE.less');
} else if (language.lan() === 'zh') {
    require('./card-zh_CN.less');
}
let CardItem = require('./cardItem');
let DefaultUserLogoTitle = require('../default-user-logo-title');
const DELETE_CREATEREALM_DELAYTIME = 4000;//超时时间
import Trace from 'LIB_DIR/trace';

class Card extends React.Component {
    static defaultProps = {
        cardWidth: 'auto'
    };

    selectCardEvent = () => {
        let cardId = this.props.curCard.id;
        if (this.props.isSelect) {
            //之前选中，则取消选中
            this.props.unselectCard(cardId);
        } else {
            //    之前未选中，则选中
            this.props.selectCard(cardId);
        }
    };

    showCardInfo = (event) => {
        Trace.traceEvent(event, '查看应用详情');
        let curCard = this.props.curCard;
        //curCard.id =='' 如果是在创建中的安全域card是不能点击的
        if (event.target.className.indexOf('icon-role-auth-config') >= 0 || curCard.id === '') {
            return;
        }
        this.props.showCardInfo(curCard);
    };

    showRightFullScreen = (event) => {
        event.stopPropagation();
        Trace.traceEvent($(ReactDOM.findDOMNode(this)).find('.icon-role-auth-config'), '查看应用角色列表和权限列表');
        this.props.showRightFullScreen(this.props.curCard);
    };
    //删除card
    deleteItem = (id, event) => {
        event.stopPropagation();
        this.props.deleteItem && this.props.deleteItem(id);
    };

    render() {
        //当前要展示的卡片
        let card = this.props.curCard;
        let imgUrl = this.props.imgUrl;
        //用户卡片列表
        let cardItems = [];

        for (let key in card) {
            if (card[key] instanceof Object && card[key].showOnCard) {
                if (key === 'date') {
                    cardItems.push(<CardItem key={key} cardItem={card[key]} noRihtValue={true}/>);
                } else {
                    cardItems.push(<CardItem key={key} cardItem={card[key]}/>);
                }
            }
        }
        // 选择图标的样式设置
        let iconClass = 'select-icon';
        if (this.props.isSelect) {
            iconClass += ' active';
        }
        //禁用卡片的样式设置
        if (!card.status) {
            iconClass += ' select-icon-stop';
        }
        if (card.createMsg === 'error') {
            //右上角通知DELETE_CREATEREALM_DELAYTIME 秒后关闭，在通知关闭后再在页面上移除创建失败的安全域card
            setTimeout(() => {
                this.props.removeFailRealm(card.taskId);
            }, DELETE_CREATEREALM_DELAYTIME);
        }
        let userName = card.userName ? card.userName.value : '';
        let deleteClassName = 'iconfont icon-delete';
        let deleteTitle = Intl.get('common.delete', '删除');
        return (
            <div className="card-layout-container " style={{width: this.props.cardWidth}}>
                <div className="card-box" onClick={this.showCardInfo}>
                    <div className="card-stop-layer" style={{display: card.status === 0 ? 'block' : 'none'}}>
                        <div className="card-stop-bg"></div>
                        <div className="stop-icon">
                            <ReactIntl.FormattedMessage id="common.stop" defaultMessage="停用"/>
                        </div>
                        <div className="stop-triangle"></div>
                    </div>
                    {card.id ? null : (
                        <div className="card-stop-layer">
                            <div className="card-stop-bg"></div>
                            <div className="building-icon">
                                <ReactIntl.FormattedMessage id="member.is.building" defaultMessage="创建中"/>
                            </div>
                            <div className="stop-triangle"></div>
                        </div>
                    )}
                    <div className="single-card">
                        <div className="img-container">
                            <DefaultUserLogoTitle
                                userName={userName}
                                nickName={card.name}
                                userLogo={imgUrl}
                            >
                            </DefaultUserLogoTitle>
                        </div>
                        <div className="card-content">
                            <div className="card-title" title={card.name}>{card.name}</div>
                            {cardItems}
                        </div>

                        <span className="card-btn-bar">
                            <div className="attention-icon">
                                {this.props.showDelete ? <div>
                                    <i className={deleteClassName} title={deleteTitle}
                                       onClick={this.deleteItem.bind(this, card.id)}
                                    ></i>
                                </div> : null}
                            </div>
                        </span>
                    </div>
                </div>
            </div>
        );
    }
}

Card.propTypes = {
    cardWidth: PropTypes.string,
    curCard: PropTypes.object,
    isSelect: PropTypes.bool,
    unselectCard: PropTypes.func,
    selectCard: PropTypes.func,
    removeFailRealm: PropTypes.func,
    showCardInfo: PropTypes.func,
    showRightFullScreen: PropTypes.func,
    deleteItem: PropTypes.func,
    imgUrl: PropTypes.string,
    showDelete: PropTypes.bool,
    removeFailRealm: PropTypes.func
};
module.exports = Card;
