const StudentTopic = require('../models/StudentTopic');

exports.assignTopic = async (req, res, next) => {
  try {
    const { studentId, topicId } = req.body;
    if (!studentId || !topicId) return res.status(400).json({ message: 'studentId and topicId required' });

    // upsert: re-assign resets to pending
    const st = await StudentTopic.findOneAndUpdate(
      { student: studentId, topic: topicId },
      { assignedAt: new Date(), status: 'pending' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const populated = await st.populate('topic');
    res.status(201).json(populated);
  } catch (err) { next(err); }
};

exports.getStudentTopics = async (req, res, next) => {
  try {
    const topics = await StudentTopic.find({ student: req.params.studentId })
      .populate('topic')
      .sort({ assignedAt: -1 });
    res.json(topics);
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'completed'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const st = await StudentTopic.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('topic');
    if (!st) return res.status(404).json({ message: 'Assignment not found' });
    res.json(st);
  } catch (err) { next(err); }
};
