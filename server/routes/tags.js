const express = require('express');
const router = express.Router();
const { getTags, createTag, updateTag, deleteTag } = require('../controllers/tagsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getTags).post(createTag);
router.route('/:id').put(updateTag).delete(deleteTag);

module.exports = router;
