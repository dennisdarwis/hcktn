var express = require('express');
var router = express.Router();
const balanceinquiry = require('../routes/balanceinquiry');

router.use('/api', balanceinquiry);

module.exports = router;
