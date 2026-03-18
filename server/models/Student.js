const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  joiningDate: { type: Date, required: true, default: Date.now },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  goal: { type: String, trim: true },
  notes: { type: String, trim: true },
  weaknessTags: { type: [String], default: [] },   // free strings, validated against Tag collection at app level
  ratings: {
    confidence: { type: Number, min: 1, max: 10, default: null },
    fluency:    { type: Number, min: 1, max: 10, default: null },
    grammar:    { type: Number, min: 1, max: 10, default: null },
  },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
