const Task = require('../models/Task');

// All queries scoped to req.user._id — other users' tasks are never visible

exports.getTasks = async (req, res, next) => {
  try {
    const { done } = req.query;
    const filter = { user: req.user._id };
    if (done === 'true')  filter.done = true;
    if (done === 'false') filter.done = false;
    const tasks = await Task.find(filter).sort({ done: 1, priority: -1, createdAt: -1 });
    res.json(tasks);
  } catch (err) { next(err); }
};

exports.createTask = async (req, res, next) => {
  try {
    const { title, notes, priority, dueDate } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'title is required' });
    const task = await Task.create({ user: req.user._id, title, notes, priority, dueDate });
    res.status(201).json(task);
  } catch (err) { next(err); }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const { title, notes, priority, dueDate, done } = req.body;
    if (title    !== undefined) task.title    = title;
    if (notes    !== undefined) task.notes    = notes;
    if (priority !== undefined) task.priority = priority;
    if (dueDate  !== undefined) task.dueDate  = dueDate;
    if (done     !== undefined) {
      task.done   = done;
      task.doneAt = done ? new Date() : null;
    }
    await task.save();
    res.json(task);
  } catch (err) { next(err); }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};