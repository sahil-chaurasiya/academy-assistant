const express = require('express');
const router = express.Router();
const { createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcementsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getAnnouncements).post(createAnnouncement);
router.route('/:id').put(updateAnnouncement).delete(deleteAnnouncement);

module.exports = router;
