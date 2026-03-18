const express = require('express');
const router  = express.Router();
const { chat, getContext, exportData } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/chat',    chat);
router.get('/context',  getContext);
router.get('/export',   exportData);

module.exports = router;