const express = require('express');
const router = express.Router();
const { assignTopic, getStudentTopics, updateStatus } = require('../controllers/studentTopicsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/assign', assignTopic);
router.get('/:studentId', getStudentTopics);
router.put('/:id', updateStatus);

module.exports = router;
