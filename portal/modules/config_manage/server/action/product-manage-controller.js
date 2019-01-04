/**
 * Copyright (c) 2015-2018 EEFUNG Software Co.Ltd. All rights reserved.
 * 版权所有 (c) 2015-2018 湖南蚁坊软件股份有限公司。保留所有权利。
 * Created by wangliping on 2018/9/21.
 */
const productService = require('../service/product-manage-service');
// 获取产品
exports.getProduct = function(req, res) {
    productService.getProduct(req, res).on('success', function(data) {
        res.json(data);
    }).on('error', function(codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};
// 添加产品
exports.addProduct = function(req,res) {
    productService.addProduct(req, res, req.body).on('success', function(data) {
        res.json(data);
    }).on('error', function(codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};
// 删除产品
exports.deleteProduct = function(req,res) {
    var product = req.params.product;
    productService.deleteProduct(req, res, product).on('success', function(data) {
        res.json(data);
    }).on('error', function(codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};
// 修改产品
exports.updateProduct = function(req,res) {
    productService.updateProduct(req, res, req.body).on('success', function(data) {
        res.json(data);
    }).on('error', function(codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};

// 添加产品
exports.addUemProduct = function(req,res) {
    productService.addUemProduct(req, res).on('success', function(data) {
        res.status(200).json(data);
    }).on('error', function(codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};

// 测试
exports.testUemProduct = function(req,res) {
    productService.testUemProduct(req, res).on('success', function(data) {
        res.status(200).json(data);
    }).on('error', function(codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};

// 获取js代码
exports.getUemJsCode = function(req,res) {
    productService.getUemJsCode(req, res).on('success', function(data) {
        res.status(200).json(data);
    }).on('error', function(codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};

// 获取oplate\matomo产品列表
exports.getProductList = function(req,res) {
    productService.getProductList(req, res).on('success', function(data) {
        res.status(200).json(data);
    }).on('error', function(codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};

//集成oplate\matomo产品
exports.integrateProduct = function(req,res) {
    productService.integrateProduct(req, res).on('success', function(data) {
        res.status(200).json(data);
    }).on('error', function(codeMessage) {
        res.status(500).json(codeMessage && codeMessage.message);
    });
};