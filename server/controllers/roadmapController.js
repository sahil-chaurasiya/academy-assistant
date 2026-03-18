const RoadmapProgress = require('../models/RoadmapProgress');
const RoadmapModule   = require('../models/RoadmapModule');

// GET /api/roadmap/:studentId — returns full module list with student's progress merged in
exports.getRoadmap = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const [modules, progress] = await Promise.all([
      RoadmapModule.find({ isActive: true }).sort({ order: 1 }),
      RoadmapProgress.find({ student: studentId }).populate('module'),
    ]);

    const progressMap = {};
    progress.forEach((p) => { if (p.module) progressMap[p.module._id.toString()] = p; });

    const roadmap = modules.map((mod) => {
      const p = progressMap[mod._id.toString()];
      return {
        module: mod,
        progressId: p?._id || null,
        status: p?.status || 'pending',
        completedAt: p?.completedAt || null,
      };
    });

    res.json(roadmap);
  } catch (err) { next(err); }
};

exports.startModule = async (req, res, next) => {
  try {
    const { studentId, moduleId } = req.body;
    if (!studentId || !moduleId) return res.status(400).json({ message: 'studentId and moduleId required' });
    const p = await RoadmapProgress.findOneAndUpdate(
      { student: studentId, module: moduleId },
      { status: 'in_progress' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('module');
    res.json(p);
  } catch (err) { next(err); }
};

exports.completeModule = async (req, res, next) => {
  try {
    const { studentId, moduleId } = req.body;
    if (!studentId || !moduleId) return res.status(400).json({ message: 'studentId and moduleId required' });
    const p = await RoadmapProgress.findOneAndUpdate(
      { student: studentId, module: moduleId },
      { status: 'completed', completedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('module');
    res.json(p);
  } catch (err) { next(err); }
};

exports.resetModule = async (req, res, next) => {
  try {
    const { studentId, moduleId } = req.body;
    await RoadmapProgress.findOneAndUpdate(
      { student: studentId, module: moduleId },
      { status: 'pending', completedAt: null },
      { upsert: true, new: true }
    );
    res.json({ message: 'Reset to pending' });
  } catch (err) { next(err); }
};
