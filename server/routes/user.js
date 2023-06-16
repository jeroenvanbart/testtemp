var express = require('express');
var router = express.Router();
var {userAuthentication} = require('../config/auth')

/* GET users listing. */
router.get('/download', userAuthentication, (req, res) => {
  res.render('users/download')
})
module.exports = router;
