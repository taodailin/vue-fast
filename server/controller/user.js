const express = require('express')
const model = require('../db/db.js')
const router = express.Router()
const moment = require('moment')
const objectIdToTimestamp = require('objectid-to-timestamp')
const createToken = require('../middleware/createToken.js')
const sha1 = require('sha1')
const checkToken = require('../middleware/checkToken.js')

const code_Ok = 200;
const code_ERR = 600;

// 注册
const Register = (req, res) => {
    let body = req.body;
    let userRegister = new model.User({
        userName: body.userName,
        password: body.password,
        confirm_pwd: body.confirm_pwd,
        recheck: body.recheck,
        token: createToken(this.userName),
    })
    // 将 objectid 转换为 用户创建时间
    userRegister.create_time = moment(objectIdToTimestamp(userRegister._id));

    let reg = /(?!^[0-9]+$)(?!^[A-z]+$)(?!^[^A-z0-9]+$)^[^\s\u4e00-\u9fa5]{6,16}$/;
    if(!reg.test(userRegister.password)){
        res.json({
            code: code_ERR,
            msg: '密码长度需6-16位，且包含字母和字符',
        })
    } else if(userRegister.password !== userRegister.confirm_pwd){
        res.json({
            code: code_ERR,
            msg: '两次输入密码不一致!',
        })
    }else {
        model.User.findOne({userName: (userRegister.userName).toLowerCase()}, (err, doc) => {
            if(err) console.log(err)

            // 用户名已存在，不能注册
            if(doc) {
                res.json({
                    code: code_ERR,
                    msg: '用户名已存在',
                })
            } else {
                userRegister.password = sha1(userRegister.password);
                userRegister.confirm_pwd = sha1(userRegister.confirm_pwd);
                userRegister.save(err => {
                    if(err) console.log(err)
                    console.log('register success')
                    res.json({
                        code: code_Ok,
                        msg: '注册成功',
                    })
                })
            }
        })
    }

}

// 登录
const Login = (req, res) => {
    let userLogin = new model.User({
        userName: req.body.userName,
        password: sha1(req.body.password),
        token: createToken(this.userName)
    })
    model.User.findOne({ userName: userLogin.userName }, (err, doc) => {
        if(err) console.log(err)
        if(!doc) {
            console.log("账号不存在");
            res.json({
                code: code_ERR,
                msg: '账号不存在'
            })
        } else if(userLogin.password === doc.password) {
            console.log('登录成功')
            var userName = req.body.userName;
            res.json({
                code: code_Ok,
                userName: doc.userName,
                // 账户创建日期
                time: moment(objectIdToTimestamp(doc._id)).format('YYYY-MM-DD HH:mm:ss'),
                // token 信息验证
                token: createToken(userName)
            })
        } else {
            res.json({
                code: code_ERR,
                msg: '密码错误'
            })
        }
    })
}

// 所有用户打印
const User = (req, res) => {
    model.User.find({}, (err, doc) => {
        if(err) console.log(err)
        res.send({
            code: code_Ok,
            data: doc,
            msg: '获取成功'
        })
    })
}

// 删除用户
const delUser = (req, res) => {
    model.User.findOneAndRemove({ _id: req.body.id }, err => {
        if(err) console.log(err)
        console.log('删除用户成功')
        res.json({
            success: true
        })
    })
}

module.exports = (router) => {
    router.post('/register', Register),
    router.post('/login', Login),
    router.get('/user', checkToken, User),
    router.post('/delUser', checkToken, delUser)
}