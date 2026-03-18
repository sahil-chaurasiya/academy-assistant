const RoadmapModule = require('../models/RoadmapModule');

exports.getModules = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.activeOnly === 'true') filter.isActive = true;
    const modules = await RoadmapModule.find(filter).sort({ order: 1, createdAt: 1 });
    res.json(modules);
  } catch (err) { next(err); }
};

exports.createModule = async (req, res, next) => {
  try {
    const { title, description, level, order, isActive } = req.body;
    if (!title) return res.status(400).json({ message: 'title is required' });
    // auto-assign order if not provided
    const maxOrder = await RoadmapModule.findOne().sort({ order: -1 }).select('order');
    const mod = await RoadmapModule.create({
      title, description, level: level || 'All',
      order: order !== undefined ? order : (maxOrder ? maxOrder.order + 1 : 0),
      isActive: isActive !== undefined ? isActive : true,
    });
    res.status(201).json(mod);
  } catch (err) { next(err); }
};

exports.updateModule = async (req, res, next) => {
  try {
    const mod = await RoadmapModule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!mod) return res.status(404).json({ message: 'Module not found' });
    res.json(mod);
  } catch (err) { next(err); }
};

exports.deleteModule = async (req, res, next) => {
  try {
    const mod = await RoadmapModule.findByIdAndDelete(req.params.id);
    if (!mod) return res.status(404).json({ message: 'Module not found' });
    // clean up any progress records referencing this module
    const RoadmapProgress = require('../models/RoadmapProgress');
    await RoadmapProgress.deleteMany({ module: req.params.id });
    res.json({ message: 'Module deleted' });
  } catch (err) { next(err); }
};

exports.reorderModules = async (req, res, next) => {
  try {
    // body: [{ id, order }]
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ message: 'items array required' });
    await Promise.all(items.map(({ id, order }) =>
      RoadmapModule.findByIdAndUpdate(id, { order })
    ));
    const modules = await RoadmapModule.find().sort({ order: 1 });
    res.json(modules);
  } catch (err) { next(err); }
};
