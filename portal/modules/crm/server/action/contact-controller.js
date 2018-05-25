var contactService = require("../service/contact-service");

exports.getContactList = function (req, res) {
    contactService.getContactList(req, res, req.body)
        .on("success", function (data) {
            res.status(200).json(data);
        }).on("error", function (err) {
        res.status(500).json(err && err.message);
    });
};


/**
 * 删除联系人
 */
exports.deleteContact = function (req, res) {
    contactService.deleteContact(req, res, req.params.contactId)
        .on("success", function (data) {
            res.json(data);
        }).on("error", function (err) {
        res.json(err.message);
    });
};

/**
 * 添加联系人
 */
exports.addContact = function (req, res) {
    var customer_id = req.body.customer_id;
    var name = req.body.name;
    var position = req.body.position;
    var department = req.body.department;
    var role = req.body.role;
    var phone = req.body.phone ? JSON.parse(req.body.phone) : [];
    var qq = req.body.qq ? JSON.parse(req.body.qq) : [];
    var weChat = req.body.weChat ? JSON.parse(req.body.weChat) : [];
    var email = req.body.email ? JSON.parse(req.body.email) : [];
    var contact = {
        customer_id: customer_id,
        customer_name: req.body.customer_name,
        name: name,
        position: position,
        department: department,
        role: role,
        //phone: phone,
        //qq: qq,
        //weChat: weChat,
        //email: email,
        def_contancts: "false"
    };
    if (phone.length > 0) {
        contact.phone = phone;
    }
    if (qq.length > 0) {
        contact.qq = qq;
    }
    if (weChat.length > 0) {
        contact.weChat = weChat;
    }
    if (email.length > 0) {
        contact.email = email;
    }
    contactService.addContact(req, res, contact)
        .on("success", function (data) {
            res.json(data);
        }).on("error", function (err) {
        res.status(500).json(err.message);
    });
};

/**
 * 修改联系人
 */
exports.editContact = function (req, res) {
    var customer_id = req.body.customer_id;
    var name = req.body.name;
    var position = req.body.position;
    var role = req.body.role;
    var phone = req.body.phone ? JSON.parse(req.body.phone) : [];
    var qq = req.body.qq ? JSON.parse(req.body.qq) : [];
    var weChat = req.body.weChat ? JSON.parse(req.body.weChat) : [];
    var email = req.body.email ? JSON.parse(req.body.email) : [];
    var def_contancts = req.body.def_contancts;
    var id = req.body.id;
    var department = req.body.department;
    var contact = {
        id: id,
        department: department,
        customer_id: customer_id,
        name: name,
        position: position,
        role: role,
        phone: phone,
        qq: qq,
        weChat: weChat,
        email: email,
        def_contancts: def_contancts
    };
    let editType = req.params.editType;
    switch (editType) {
        case "phone"://只修改了电话
            contact = {
                customer_id: customer_id,
                id: id,
                phone: phone
            };
            break;
        case "no_phone"://修改了除电话外的其他信息
            delete contact.phone;
            break;
        case "all"://电话和其他信息都有修改
            break;
    }
    contactService.updateContact(req, res, contact).on("success", function (data) {
        res.status(200).json(contact);
    }).on("error", function (err) {
        res.status(500).json(err.message);
    });
};

/**
 * 设置默认联系人
 */
exports.setDefault = function (req, res) {
    var contactId = req.params.contactId;
    contactService.setDefault(req, res, contactId)
        .on("success", function (data) {
            res.json(data);
        }).on("error", function (err) {
        res.json(err.message);
    });
};
