const express = require('express');
const router = express.Router();
const { createNote, getNotesByStudent, updateNote, deleteNote } = require('../controllers/notesController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', createNote);
router.get('/:studentId', getNotesByStudent);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
