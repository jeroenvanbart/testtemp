var express = require('express');
var router = express.Router();
const ext_APIController = require('../api/controller/ext_APIController');

//App routes
router.post('/API_Login', ext_APIController.API_Login);
router.post('/API_Logout', ext_APIController.API_Logout);
router.post('/carriers', ext_APIController.GetCarriers);
router.post('/static_carriers', ext_APIController.GetStaticCarriers);
router.post('/locations', ext_APIController.GetLocations);
router.post('/history', ext_APIController.GetHistory);
router.post('/registrations', ext_APIController.GetRegistrations);

module.exports = router;
