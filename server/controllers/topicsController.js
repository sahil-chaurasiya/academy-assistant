const Topic = require('../models/Topic');

exports.createTopic = async (req, res, next) => {
  try {
    const { title, description, level } = req.body;
    if (!title || !level) return res.status(400).json({ message: 'title and level are required' });
    const topic = await Topic.create({ title, description, level, createdBy: req.user._id });
    res.status(201).json(topic);
  } catch (err) { next(err); }
};

exports.getTopics = async (req, res, next) => {
  try {
    const { level } = req.query;
    const query = level ? { level } : {};
    const topics = await Topic.find(query).sort({ createdAt: -1 });
    res.json(topics);
  } catch (err) { next(err); }
};

exports.updateTopic = async (req, res, next) => {
  try {
    const { title, description, level } = req.body;
    if (!title || !level) return res.status(400).json({ message: 'title and level are required' });
    const topic = await Topic.findByIdAndUpdate(
      req.params.id,
      { title, description, level },
      { new: true, runValidators: true }
    );
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    res.json(topic);
  } catch (err) { next(err); }
};

exports.deleteTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    res.json({ message: 'Topic deleted' });
  } catch (err) { next(err); }
};