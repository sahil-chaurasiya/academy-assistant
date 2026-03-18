const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  visitedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Visit', visitSchema);
