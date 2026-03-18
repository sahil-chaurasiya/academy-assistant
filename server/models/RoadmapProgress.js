const mongoose = require('mongoose');

const roadmapProgressSchema = new mongoose.Schema({
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  module:     { type: mongoose.Schema.Types.ObjectId, ref: 'RoadmapModule', required: true },
  status:     { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  completedAt:{ type: Date, default: null },
}, { timestamps: true });

roadmapProgressSchema.index({ student: 1, module: 1 }, { unique: true });

module.exports = mongoose.model('RoadmapProgress', roadmapProgressSchema);
