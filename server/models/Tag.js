const mongoose = require('mongoose');

// Predefined palette so tags always render consistently
const COLOR_PALETTE = [
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-rose/10 text-rose border-rose/20',
  'bg-emerald/10 text-emerald border-emerald/20',
  'bg-yellow-100 text-yellow-700 border-yellow-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-pink-100 text-pink-700 border-pink-200',
];

const tagSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true, lowercase: true },
  type: { type: String, enum: ['weakness', 'custom'], default: 'weakness' },
  color: { type: String, default: COLOR_PALETTE[0] },
  colorSelected: { type: String, default: 'bg-orange-500 text-white' },
}, { timestamps: true });

module.exports = mongoose.model('Tag', tagSchema);
module.exports.COLOR_PALETTE = COLOR_PALETTE;
