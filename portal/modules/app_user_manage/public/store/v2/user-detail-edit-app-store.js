import UserDetailEditAppActions from '../../action/v2/user-detail-edit-app-actions';
import AppUserPanelSwitchAction from '../../action/app-user-panelswitch-actions';
import AppUserDetailAction from '../../action/app-user-detail-actions';
import UserData from '../../../../../public/sources/user-data';
import AppUserDetailStore from '../../store/app-user-detail-store';

class UserDetailEditAppStore {
    constructor(){
        this.resetState();
        this.bindActions(UserDetailEditAppActions);
    }
    //重置store的值
    resetState() {
        //选中的应用列表的数组
        this.selectedApps = [];
        //单个应用的配置，传入到AppProperty的appSettingConfig属性上
        this.appSettingConfig = {};
        //提交结果
        this.submitResult = '';
        //提交错误信息
        this.submitErrorMsg = '';
        //提交人
        this.operator = UserData.getUserData().nick_name;
    }
    //选中的应用列表发生变化
    setInitialData(appInfo) {
        //修改单个应用，所以选中应用只有一个
        this.selectedApps = [_.pick(appInfo , 'app_id' , 'app_name')];
        //根据应用信息计算“开始时间、结束时间、周期”
        let start_time = appInfo.start_time,
            end_time = appInfo.end_time,
            range;

        if(appInfo.end_time === '0' || appInfo.end_time === 0) {
            range = 'forever';
        } else {
            var startMoment = moment(new Date(+start_time));
            var endMoment = moment(new Date(+end_time));
            startMoment.startOf("day");
            endMoment.startOf("day");
            var rangeDiffMonth = endMoment.diff(startMoment , "months") + '';
            if(["1","6","12"].indexOf(rangeDiffMonth) >= 0 && startMoment.format("D") === endMoment.format("D")) {
                range = rangeDiffMonth + "m";
            } else {
                //判断是7天(一周)还是15天(半个月)
                var rangeDiffDays = endMoment.diff(startMoment , "days") + "";
                if(rangeDiffDays === "7") {
                    range = "1w";
                } else if(rangeDiffDays === "15") {
                    range = "0.5m";
                } else {
                    range = "custom";
                }
            }
        }

        this.appSettingConfig[appInfo.app_id] = {
            //用户类型
            user_type:'user_type' in appInfo ? appInfo.user_type : '',
            over_draft:'over_draft' in appInfo ? appInfo.over_draft : '1',
            is_two_factor:'is_two_factor' in appInfo ? appInfo.is_two_factor + '' : '',
            multilogin : 'multilogin' in appInfo ? appInfo.multilogin + '' : '',
            time:{
                start_time : start_time,
                end_time : end_time,
                range : range
            },
            status : 'is_disabled' in appInfo ? appInfo.is_disabled + '' : '',
            roles : _.isArray(appInfo.roles) ? appInfo.roles : [],
            permissions : _.isArray(appInfo.permissions) ? appInfo.permissions : []
        };
    }
    //隐藏添加应用提示
    hideSubmitTip() {
        this.submitResult = '';
    }
    //修改应用完成
    editUserApps(result) {
        if(result.error) {
            this.submitResult = "error";
            this.submitErrorMsg = result.errorMsg;
        } else {
            this.submitErrorMsg = "";
            if(result.loading) {
                this.submitResult = "loading";
            } else {
                this.submitResult = "success";
                setTimeout(() => {
                    this.resetState();
                    AppUserPanelSwitchAction.resetState();
                    AppUserDetailAction.editAppSuccess(result.apps);
                } , 500);
            }
        }
    }
}

//使用alt导出store
export default alt.createStore(UserDetailEditAppStore , "UserDetailEditAppStoreV2");