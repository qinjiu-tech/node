/**
 * 二步认证选择
 */
import {Form,Radio,Checkbox} from 'antd';
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
function merge(obj1,obj2) {
    obj1 = obj1 || {};
    obj2 = obj2 || {};
    for(var key in obj2) {
        obj1[key] = obj2[key];
    }
}
const UserTwoFactorField = { 
    renderUserTwoFactorBlock(config) {

        config = $.extend({
            isCustomSetting: false,
            appId: '',
            globalTwoFactor: '1'
        } , config);

        if(config.isCustomSetting && !config.appId) {
            return null;
        }

        let currentValue;
        if(!config.isCustomSetting) {
            currentValue = this.state.formData.is_two_factor;
        } else {
            const appPropSettingsMap = this.state.appPropSettingsMap;
            currentValue = appPropSettingsMap[config.appId].is_two_factor.value;
        }

        const onChange = !config.isCustomSetting ? (e) => {
            const target = e && e.target;
            const value = e.target.checked ? '1' : '0';            
            const newFormData = {};
            newFormData.is_two_factor = value;
            merge(this.state.formData, newFormData);
            this.setState({
                formData: this.state.formData,
            });
        } : (event) => {
            const value = event.target.checked ? '1' : '0';
            const appPropSettingsMap = this.state.appPropSettingsMap;
            const formData = appPropSettingsMap[config.appId] || {};
            formData.is_two_factor.value = value;
            if(value !== config.globalTwoFactor) {
                formData.is_two_factor.setted = true;
            }
            this.setState({appPropSettingsMap});
        };

        const formData = this.state.formData;
        if (config.showCheckbox) {
            return (
                <Checkbox checked={currentValue === '1'} onChange={onChange}>{Intl.get('user.two.step.certification', '二步认证')}</Checkbox>
            );
        }
        return (
            <FormItem
                label=""
                labelCol={{span: 0}}
                wrapperCol={{span: 24}}
            >
                <RadioGroup onChange={onChange}
                    value={currentValue}>
                    <Radio key="1" value="1"><ReactIntl.FormattedMessage id="common.app.status.open" defaultMessage="开启" /></Radio>
                    <Radio key="0" value="0"><ReactIntl.FormattedMessage id="common.app.status.close" defaultMessage="关闭" /></Radio>
                </RadioGroup>
            </FormItem>
        );
    }
};

export default UserTwoFactorField;