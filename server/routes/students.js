const express = require('express');
const router  = express.Router();
const {
  getStudents, createStudent, getStudent, updateStudent, deleteStudent,
  updateTags, updateRatings, bulkAction, getDashboardStats, getThisMonthStudents
} = require('../controllers/studentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/stats',      getDashboardStats);
router.get('/this-month', getThisMonthStudents);
router.post('/bulk',      bulkAction);
router.route('/').get(getStudents).post(createStudent);
router.route('/:id').get(getStudent).put(updateStudent).delete(deleteStudent);
router.put('/:id/tags',    updateTags);
router.put('/:id/ratings', updateRatings);

module.exports = router;