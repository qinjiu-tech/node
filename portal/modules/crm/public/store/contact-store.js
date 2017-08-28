var ContactActions = require("../action/contact-action");
var ContactUtils = require("../utils/contact-util");

function ContactStore() {

    //是否显示添加联系人表单
    this.isShowAddContactForm = false;
    //联系人列表
    /**
     * [
     {
         isShowEditContactForm : false,//是否显示修改的表单
        //是否显示确认删除联系人的confirm
        isShowDeleteContactConfirm : false,
         contact : {//联系人
             id : '',
             name : '',//联系人名称
             position : '',//职位
             role : '',//角色
             phone : '',//电话
             email : '',//邮箱
             qq : '',//qq
             weChat : '',//微信
             isDefault : false //默认联系人
         },
         contactWayAddState : {
             phone : false,//添加“电话”联系方式
             email : false,//添加“邮箱”联系方式
             qq : false,//添加“qq”联系方式
             weChat : false,//添加“微信”联系方式
         }
     }
     ]
     */
    this.contactList = [];
    //获取联系人列表出错的提示，默认不出错
    this.getContactListErrorMsg = "";
    //添加联系人出错的提示，默认不出错
    this.submitAddContactErrorMsg = "";
    //绑定action方法
    this.bindListeners({
        //通过ajax获取联系人列表
        'getContactList': ContactActions.getContactList
        //展示添加联系人表单
        , 'showAddContactForm': ContactActions.showAddContactForm
        //隐藏添加联系人表单
        , 'hideAddContactForm': ContactActions.hideAddContactForm
        //提交添加联系人表单
        , 'submitAddContact': ContactActions.submitAddContact
        //展示修改联系人表单
        , 'showEditContactForm': ContactActions.showEditContactForm
        //隐藏修改联系人表单
        , 'hideEditContactForm': ContactActions.hideEditContactForm
        //提交修改联系人表单
        , 'submitEditContact': ContactActions.submitEditContact
        //添加一个联系方式
        , 'addContactWay': ContactActions.addContactWay
        //去掉一个联系方式
        , 'removeContactWay': ContactActions.removeContactWay
        //显示删除一个联系人的对话框
        , 'showDeleteContactConfirm': ContactActions.showDeleteContactConfirm
        //隐藏删除一个联系人的对话框
        , 'hideDeleteContactConfirm': ContactActions.hideDeleteContactConfirm
        //删除一个联系人
        , 'deleteContact': ContactActions.deleteContact
        //设置为默认联系人
        , 'toggleDefaultContact': ContactActions.toggleDefaultContact
    });
    //绑定view方法
    this.exportPublicMethods({
        getContactListFromView: this.getContactListFromView,
        getIsShowAddContactForm: this.getIsShowAddContactForm
    });

}

//ToView-获取联系人列表
ContactStore.prototype.getContactListFromView = function () {
    return this.getState().contactList;
};
//ToView-是否显示添加联系人的表单
ContactStore.prototype.getIsShowAddContactForm = function () {
    return this.getState().isShowAddContactForm;
};

//FromAction-通过ajax获取联系人列表
ContactStore.prototype.getContactList = function (list) {
    if (typeof list === 'string') {
        this.getContactListErrorMsg = list;
        this.contactList = [];
    } else {
        this.getContactListErrorMsg = '';
        var viewList = [];
        _.each(list, function (contact) {
            viewList.push(ContactUtils.newViewContactObject(contact));
        });
        this.contactList = viewList;
    }
};

//FromAction-展示添加联系人表单
ContactStore.prototype.showAddContactForm = function () {
    this.isShowAddContactForm = true;
};

//FromAction-隐藏添加联系人表单
ContactStore.prototype.hideAddContactForm = function () {
    this.isShowAddContactForm = false;
};

//FromAction-提交添加联系人表单
ContactStore.prototype.submitAddContact = function (contact) {
    if (typeof contact === 'string') {
        this.submitAddContactErrorMsg = contact;
    } else {
        this.hideAddContactForm();
        this.submitAddContactErrorMsg = '';
        var newContact = ContactUtils.newViewContactObject(contact);
        this.contactList.unshift(newContact);
    }
};

//FromAction-展示修改联系人表单
ContactStore.prototype.showEditContactForm = function (contact) {
    contact.isShowEditContactForm = true;
    //["phone", "qq", "weChat", "email"].forEach(function (type) {
    //    contact.contactWayAddObj[type] = contact.contact[type];
    //});
};

//FromAction-隐藏修改联系人表单
ContactStore.prototype.hideEditContactForm = function (contact) {
    contact.isShowEditContactForm = false;
};

//FromAction-提交修改联系人表单
ContactStore.prototype.submitEditContact = function (contact) {
    var targetContact = ContactUtils.getContactFromContactListView(this.contactList, contact);
    if (typeof contact === 'string') {
        targetContact.submitEditContactErrorMsg = contact;
    } else {
        this.hideEditContactForm(targetContact);
        targetContact.submitEditContactErrorMsg = "";
        _.extend(targetContact.contact, contact);
    }
};

//FromAction-添加一个联系方式
ContactStore.prototype.addContactWay = function (array) {
    var obj = array[0], type = array[1];
    obj.contactWayAddObj[type].push("");
};

//FromAction-去掉一个联系方式
ContactStore.prototype.removeContactWay = function (array) {
    var obj = array[0], type = array[1], index = array[2];
    var contactArray = obj.contactWayAddObj[type];
    if (_.isArray(contactArray) && contactArray.length >= (index + 1)) {
        obj.contactWayAddObj[type].splice(index, 1);
    }
};

//FromAction-显示删除一个联系人的对话框
ContactStore.prototype.showDeleteContactConfirm = function (contact) {
    contact.isShowDeleteContactConfirm = true;
};

//FromAction-隐藏删除一个联系人的对话框
ContactStore.prototype.hideDeleteContactConfirm = function (contact) {
    contact.isShowDeleteContactConfirm = false;
};

//FromAction-删除一个联系人
ContactStore.prototype.deleteContact = function (contactData) {
    ContactUtils.deleteContactFromContactListView(this.contactList, contactData.contact);
    contactData.isShowDeleteContactConfirm = false;
};

//FromAction-设置为默认联系人
ContactStore.prototype.toggleDefaultContact = function (contact) {
    //var def_contancts = contact.def_contancts;
    ContactUtils.unsetDefaultContacts(this.contactList);
    contact.def_contancts = "true";
};

module.exports = alt.createStore(ContactStore, 'ContactStore');