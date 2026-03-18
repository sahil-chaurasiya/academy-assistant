const Student = require('../models/Student');
const Visit   = require('../models/Visit');

exports.getStudents = async (req, res, next) => {
  try {
    const { search, tags, level, ratingMin, ratingMax, joinedFrom, joinedTo } = req.query;
    const query = {};

    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }];
    if (tags)  { const ta = tags.split(',').map(t => t.trim()).filter(Boolean); if (ta.length) query.weaknessTags = { $in: ta }; }
    if (level) query.level = level;
    if (ratingMin || ratingMax) {
      const rMin = ratingMin ? parseInt(ratingMin) : 1;
      const rMax = ratingMax ? parseInt(ratingMax) : 10;
      query.$or = [
        { 'ratings.confidence': { $gte: rMin, $lte: rMax } },
        { 'ratings.fluency':    { $gte: rMin, $lte: rMax } },
        { 'ratings.grammar':    { $gte: rMin, $lte: rMax } },
      ];
    }
    if (joinedFrom || joinedTo) {
      query.joiningDate = {};
      if (joinedFrom) query.joiningDate.$gte = new Date(joinedFrom);
      if (joinedTo)   query.joiningDate.$lte = new Date(joinedTo + 'T23:59:59');
    }

    const students = await Student.find(query).sort({ createdAt: -1 });
    res.json(students);
  } catch (err) { next(err); }
};

exports.createStudent = async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) { next(err); }
};

exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) { next(err); }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) { next(err); }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted' });
  } catch (err) { next(err); }
};

exports.updateTags = async (req, res, next) => {
  try {
    const { tags } = req.body;
    if (!Array.isArray(tags)) return res.status(400).json({ message: 'tags must be an array' });
    const student = await Student.findByIdAndUpdate(req.params.id, { weaknessTags: tags }, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) { next(err); }
};

exports.updateRatings = async (req, res, next) => {
  try {
    const { confidence, fluency, grammar } = req.body;
    const update = {};
    if (confidence !== undefined) update['ratings.confidence'] = confidence;
    if (fluency    !== undefined) update['ratings.fluency']    = fluency;
    if (grammar    !== undefined) update['ratings.grammar']    = grammar;
    const student = await Student.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) { next(err); }
};

// POST /api/students/bulk — bulk actions
exports.bulkAction = async (req, res, next) => {
  try {
    const { ids, action, payload } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'ids array required' });

    if (action === 'delete') {
      await Student.deleteMany({ _id: { $in: ids } });
      return res.json({ message: `${ids.length} students deleted` });
    }
    if (action === 'addTags') {
      const { tags } = payload || {};
      if (!Array.isArray(tags)) return res.status(400).json({ message: 'payload.tags required' });
      await Student.updateMany({ _id: { $in: ids } }, { $addToSet: { weaknessTags: { $each: tags } } });
      return res.json({ message: 'Tags added' });
    }
    if (action === 'removeTags') {
      const { tags } = payload || {};
      if (!Array.isArray(tags)) return res.status(400).json({ message: 'payload.tags required' });
      await Student.updateMany({ _id: { $in: ids } }, { $pullAll: { weaknessTags: tags } });
      return res.json({ message: 'Tags removed' });
    }
    if (action === 'assignTopic') {
      const { topicId } = payload || {};
      if (!topicId) return res.status(400).json({ message: 'payload.topicId required' });
      const StudentTopic = require('../models/StudentTopic');
      const ops = ids.map((sid) => ({
        updateOne: {
          filter: { student: sid, topic: topicId },
          update: { $setOnInsert: { student: sid, topic: topicId, status: 'pending', assignedAt: new Date() } },
          upsert: true,
        },
      }));
      await StudentTopic.bulkWrite(ops);
      return res.json({ message: `Topic assigned to ${ids.length} students` });
    }
    return res.status(400).json({ message: `Unknown action: ${action}` });
  } catch (err) { next(err); }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const total = await Student.countDocuments();
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const addedThisMonth = await Student.countDocuments({ createdAt: { $gte: startOfMonth } });
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const endOfDay   = new Date(); endOfDay.setHours(23,59,59,999);
    const todayVisits   = await Visit.find({ visitedAt: { $gte: startOfDay, $lte: endOfDay } }).populate('student','name level');
    const recentStudents = await Student.find().sort({ updatedAt: -1 }).limit(5);
    res.json({ total, addedThisMonth, todayVisits, recentStudents });
  } catch (err) { next(err); }
};

exports.getThisMonthStudents = async (req, res, next) => {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const students = await Student.find({ createdAt: { $gte: startOfMonth } }).sort({ createdAt: -1 });
    res.json(students);
  } catch (err) { next(err); }
};