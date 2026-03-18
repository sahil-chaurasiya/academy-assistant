const mongoose = require('mongoose');

const studentTopicSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  assignedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
}, { timestamps: true });

studentTopicSchema.index({ student: 1, topic: 1 }, { unique: true });

module.exports = mongoose.model('StudentTopic', studentTopicSchema);
