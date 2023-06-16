var express = require('express');
var router = express.Router();
const carrierController = require('../api/controller/carrierController')
var {apiUserAuthentication} = require('../config/auth')

// router.post('/verify', (req, res) => {
//     console.log('verifying')
//     if (req?.body?.devices) {
//         console.log(req.body.devices)
//         res.status(200).send({message: 'Devices successfully verified'})
//     } else {
//         res.status(400).send({message: 'Error verifying devices'})
//     }
// })
router.post('/verify', apiUserAuthentication, carrierController.verify)
router.post('/getscaninfo', apiUserAuthentication, carrierController.getscaninfo)
router.get('/createlist', apiUserAuthentication, carrierController.createMacList)

module.exports = router;