const express = require('express');
const router = express.Router();
const tripController = require('../../../controllers/shared/tripController');

router.get('/', tripController.getAllTrips);

module.exports = router;