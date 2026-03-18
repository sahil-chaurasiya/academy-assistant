const SessionNote = require('../models/SessionNote');

exports.createNote = async (req, res, next) => {
  try {
    const { studentId, observation, rating, date } = req.body;
    if (!studentId || !observation || !rating) return res.status(400).json({ message: 'studentId, observation, and rating are required' });
    const note = await SessionNote.create({ student: studentId, observation, rating, date: date || Date.now() });
    res.status(201).json(note);
  } catch (err) { next(err); }
};

exports.getNotesByStudent = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, rating } = req.query;
    const filter = { student: req.params.studentId };
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo)   filter.date.$lte = new Date(dateTo + 'T23:59:59');
    }
    if (rating) filter.rating = parseInt(rating);
    const notes = await SessionNote.find(filter).sort({ date: -1 });
    res.json(notes);
  } catch (err) { next(err); }
};

exports.updateNote = async (req, res, next) => {
  try {
    const { observation, rating, date } = req.body;
    const update = {};
    if (observation !== undefined) update.observation = observation;
    if (rating !== undefined)      update.rating = rating;
    if (date !== undefined)        update.date = date;
    const note = await SessionNote.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) { next(err); }
};

exports.deleteNote = async (req, res, next) => {
  try {
    const note = await SessionNote.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (err) { next(err); }
};
