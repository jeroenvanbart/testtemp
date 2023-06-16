var express = require('express');
var router = express.Router();
const apiController = require('../api/controller/apiController')
const userController = require('../api/controller/userController')

//App routes
router.post('/login', apiController.loginPostApp)
router.post('/forgot', apiController.forgotPostApp)
router.post('/loggedin', userController.loggedIn)

module.exports = router;
