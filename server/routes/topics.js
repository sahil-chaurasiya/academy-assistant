const express = require('express');
const router = express.Router();
const { createTopic, getTopics, updateTopic, deleteTopic } = require('../controllers/topicsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getTopics).post(createTopic);
router.route('/:id').put(updateTopic).delete(deleteTopic);

module.exports = router;