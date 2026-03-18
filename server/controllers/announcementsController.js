const Announcement = require('../models/Announcement');

exports.createAnnouncement = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });
    const announcement = await Announcement.create({ message, createdBy: req.user._id });
    res.status(201).json(await announcement.populate('createdBy', 'name'));
  } catch (err) { next(err); }
};

exports.getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find().populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) { next(err); }
};

exports.updateAnnouncement = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'message is required' });
    const ann = await Announcement.findByIdAndUpdate(req.params.id, { message }, { new: true }).populate('createdBy', 'name');
    if (!ann) return res.status(404).json({ message: 'Announcement not found' });
    res.json(ann);
  } catch (err) { next(err); }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const ann = await Announcement.findByIdAndDelete(req.params.id);
    if (!ann) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};
