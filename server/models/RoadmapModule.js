const mongoose = require('mongoose');

const roadmapModuleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'All'], default: 'All' },
  order: { type: Number, required: true, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

roadmapModuleSchema.index({ order: 1 });

module.exports = mongoose.model('RoadmapModule', roadmapModuleSchema);
