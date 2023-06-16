var express = require('express');
var router = express.Router();
const userController = require('../api/controller/userController')
const apiController = require('../api/controller/apiController')

/* GET home page. */
router.get('/', (req, res) => {
    return res.render('layouts/index')
})
router.get('/link', (req, res) => { res.render('link')})
router.get('/policy', (req, res) => { return res.render('layouts/policy')})
router.get('/login', userController.login)
router.post('/login', userController.loginPost)
router.get('/register/:token', userController.register)
router.post('/register', userController.registerPost)
router.get('/forgot', userController.forgot)
router.post('/forgot', userController.forgotPost)
router.get('/reset/:token', userController.reset)
router.post('/reset', userController.resetPost)
router.get('/support', (req, res) => { return res.render('layouts/support')})
router.post('/support', apiController.supportPostApp)

module.exports = router;
