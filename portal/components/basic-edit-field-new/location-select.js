import Trace from "LIB_DIR/trace";
import {AntcAreaSelection} from "antc";
import {DetailEditBtn} from "../rightPanel";
import SaveCancelButton from "../detail-card/save-cancel-button";
const LocationSelectField = React.createClass({
    getDefaultProps: function () {
        return {
            id: "",
            hasEditPrivilege: false,
            province: "",
            city: "",
            county: "",
            //编辑按钮的提示文案
            editBtnTip: Intl.get("crm.175", "设置地域"),
            onChange: function () {
            },
            onModifySuccess: function () {
            }
        };
    },
    getInitialState: function () {
        return {
            loading: false,//正在保存
            displayType: "text",
            id: this.props.id,
            province: this.props.province,
            city: this.props.city,
            county: this.props.county,
            submitErrorMsg: ''
        };
    },
    componentWillReceiveProps: function (nextProps) {
        if (nextProps.id != this.state.id) {
            //切换客户时,重新设置state数据
            let stateData = this.getInitialState();
            stateData.id = nextProps.id;
            stateData.province = nextProps.province;
            stateData.city = nextProps.city;
            stateData.county = nextProps.county;
            this.setState(stateData);
        }
    },
    changeDisplayType: function (type) {
        if (type === 'text') {
            Trace.traceEvent(this.getDOMNode(), "取消对地域的修改");
            this.setState({
                province: this.props.province,
                city: this.props.city,
                county: this.props.county,
                displayType: type,
                submitErrorMsg: ''
            });
        } else {
            Trace.traceEvent(this.getDOMNode(), "点击设置地域按钮");
            this.setState({
                loading: false,
                displayType: type,
                submitErrorMsg: ''
            });
        }
    },
    //回到展示状态
    backToDisplay: function () {
        this.setState({
            loading: false,
            displayType: 'text',
            submitErrorMsg: ''
        });
    },
    handleSubmit: function () {
        if (this.state.loading) return;
        if (this.state.province == this.props.province
            && this.state.city == this.props.city
            && this.state.county == this.props.county) {
            this.backToDisplay();
            return;
        }
        let submitData = {
            id: this.state.id,
            province: this.state.province,
            city: this.state.city,
            county: this.state.county
        };
        Trace.traceEvent(this.getDOMNode(), "保存对地域的修改");
        this.props.saveEditLocation(submitData, () => {
            this.backToDisplay();
        }, (errorMsg) => {
            this.setState({
                loading: false,
                submitErrorMsg: errorMsg || Intl.get("common.edit.failed", "修改失败")
            });
        });
    },
    handleCancel: function (e) {
        Trace.traceEvent(e, "取消对地域的修改");
        this.changeDisplayType("text");
    },
    //更新地址
    updateLocation: function (address) {
        var location = address.split('/');
        this.state.province = location[0] || "";
        this.state.city = location[1] || "";
        this.state.county = location[2] || "";
        Trace.traceEvent(this.getDOMNode(), "修改地域");
    },
    render: function () {
        var location = [];
        if (this.state.province) {
            location.push(this.state.province);
        }
        if (this.state.city) {
            location.push(this.state.city);
        }
        if (this.state.county) {
            location.push(this.state.county);
        }
        if (this.state.displayType === 'text') {
            return (
                <div className="basic-location-field basic-edit-field">
                    <span className="inline-block basic-info-text">{location.join('/')}</span>
                    {this.props.hasEditPrivilege ? (
                        <DetailEditBtn title={this.props.editBtnTip}
                                       onClick={this.changeDisplayType.bind(this, "edit")}/>) : null
                    }
                </div>
            );
        }
        return (<div className="basic-edit-field location-edit-field">
            <AntcAreaSelection labelCol="0" wrapperCol="24"
                               placeholder={Intl.get("crm.address.placeholder", "请选择地域")}
                               prov={this.state.province}
                               city={this.state.city}
                               county={this.state.county} updateLocation={this.updateLocation}/>
            <SaveCancelButton loading={this.state.loading}
                              saveErrorMsg={this.state.submitErrorMsg}
                              handleSubmit={this.handleSubmit}
                              handleCancel={this.handleCancel}
            />
        </div>);
    }
});

module.exports = LocationSelectField;