const express = require('express');
const router = express.Router();
const { getModules, createModule, updateModule, deleteModule, reorderModules } = require('../controllers/roadmapModuleController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getModules).post(createModule);
router.post('/reorder', reorderModules);
router.route('/:id').put(updateModule).delete(deleteModule);

module.exports = router;
