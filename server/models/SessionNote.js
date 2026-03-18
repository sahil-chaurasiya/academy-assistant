const mongoose = require('mongoose');

const sessionNoteSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: Date, default: Date.now },
  observation: { type: String, required: true, trim: true },
  rating: { type: Number, min: 1, max: 5, required: true },
}, { timestamps: true });

module.exports = mongoose.model('SessionNote', sessionNoteSchema);
