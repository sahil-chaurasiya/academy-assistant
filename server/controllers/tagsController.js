const Tag = require('../models/Tag');

const SELECTED_MAP = {
  'bg-orange-100 text-orange-700 border-orange-200': 'bg-orange-500 text-white',
  'bg-blue-100 text-blue-700 border-blue-200':       'bg-blue-600 text-white',
  'bg-purple-100 text-purple-700 border-purple-200': 'bg-purple-600 text-white',
  'bg-rose/10 text-rose border-rose/20':             'bg-rose text-white',
  'bg-emerald/10 text-emerald border-emerald/20':    'bg-emerald text-white',
  'bg-yellow-100 text-yellow-700 border-yellow-200': 'bg-yellow-500 text-white',
  'bg-indigo-100 text-indigo-700 border-indigo-200': 'bg-indigo-600 text-white',
  'bg-pink-100 text-pink-700 border-pink-200':       'bg-pink-600 text-white',
};

exports.getTags = async (req, res, next) => {
  try {
    const filter = req.query.type ? { type: req.query.type } : {};
    const tags = await Tag.find(filter).sort({ createdAt: 1 });
    res.json(tags);
  } catch (err) { next(err); }
};

exports.createTag = async (req, res, next) => {
  try {
    const { name, type, color } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    const chosenColor = color || 'bg-orange-100 text-orange-700 border-orange-200';
    const tag = await Tag.create({
      name: name.toLowerCase().trim(),
      type: type || 'weakness',
      color: chosenColor,
      colorSelected: SELECTED_MAP[chosenColor] || 'bg-orange-500 text-white',
    });
    res.status(201).json(tag);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Tag already exists' });
    next(err);
  }
};

exports.updateTag = async (req, res, next) => {
  try {
    const { name, type, color } = req.body;
    const update = {};
    if (name) update.name = name.toLowerCase().trim();
    if (type) update.type = type;
    if (color) { update.color = color; update.colorSelected = SELECTED_MAP[color] || 'bg-orange-500 text-white'; }
    const tag = await Tag.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!tag) return res.status(404).json({ message: 'Tag not found' });
    res.json(tag);
  } catch (err) { next(err); }
};

exports.deleteTag = async (req, res, next) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);
    if (!tag) return res.status(404).json({ message: 'Tag not found' });
    // Remove this tag from all students
    const Student = require('../models/Student');
    await Student.updateMany({ weaknessTags: tag.name }, { $pull: { weaknessTags: tag.name } });
    res.json({ message: 'Tag deleted' });
  } catch (err) { next(err); }
};
