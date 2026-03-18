const express = require('express');
const router  = express.Router();
const { checkIn, getTodayVisits, checkTodayStatus } = require('../controllers/visitsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/checkin', checkIn);
router.get('/today', getTodayVisits);
router.get('/check/:studentId', checkTodayStatus);

module.exports = router;