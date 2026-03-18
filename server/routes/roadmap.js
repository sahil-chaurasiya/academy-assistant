const express = require('express');
const router = express.Router();
const { getRoadmap, startModule, completeModule, resetModule } = require('../controllers/roadmapController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/:studentId', getRoadmap);
router.post('/start', startModule);
router.post('/complete', completeModule);
router.post('/reset', resetModule);

module.exports = router;
