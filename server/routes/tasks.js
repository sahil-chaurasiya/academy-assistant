const express = require('express');
const router  = express.Router();
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/tasksController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getTasks).post(createTask);
router.route('/:id').put(updateTask).delete(deleteTask);

module.exports = router;