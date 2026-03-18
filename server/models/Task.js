const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:     { type: String, required: true, trim: true },
  notes:     { type: String, trim: true, default: '' },
  priority:  { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate:   { type: Date, default: null },
  done:      { type: Boolean, default: false },
  doneAt:    { type: Date, default: null },
}, { timestamps: true });

// Tasks are always scoped to a user — enforce it in queries
taskSchema.index({ user: 1, done: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);