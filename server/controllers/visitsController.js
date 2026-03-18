const Visit = require('../models/Visit');

exports.checkIn = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ message: 'studentId required' });

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(); endOfDay.setHours(23, 59, 59, 999);

    const existing = await Visit.findOne({
      student: studentId,
      visitedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existing) {
      // Return 200 with alreadyCheckedIn flag — not an error
      return res.status(200).json({ alreadyCheckedIn: true, visit: existing });
    }

    const visit = await Visit.create({ student: studentId });
    res.status(201).json({ alreadyCheckedIn: false, visit });
  } catch (err) { next(err); }
};

exports.getTodayVisits = async (req, res, next) => {
  try {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(); endOfDay.setHours(23, 59, 59, 999);
    const visits = await Visit.find({ visitedAt: { $gte: startOfDay, $lte: endOfDay } })
      .populate('student', 'name level phone')
      .sort({ visitedAt: -1 });
    res.json(visits);
  } catch (err) { next(err); }
};

// GET /api/visits/check/:studentId — has this student checked in today?
exports.checkTodayStatus = async (req, res, next) => {
  try {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(); endOfDay.setHours(23, 59, 59, 999);
    const visit = await Visit.findOne({
      student: req.params.studentId,
      visitedAt: { $gte: startOfDay, $lte: endOfDay },
    });
    res.json({ checkedIn: !!visit });
  } catch (err) { next(err); }
};