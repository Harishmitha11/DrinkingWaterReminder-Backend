const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Reminder = require('../models/Reminder');

// get user's reminders
router.get('/', auth, async (req,res) => {
  try {
    const reminders = await Reminder.find({ user: req.user.id }).sort({ nextAt: 1 });
    res.json(reminders);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// create
router.post('/', auth, async (req,res) => {
  try {
    const { title, message, nextAt, frequency } = req.body;
    const r = new Reminder({
      user: req.user.id,
      title,
      message,
      nextAt: new Date(nextAt),
      frequency: frequency || 'once'
    });
    await r.save();
    res.json(r);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// update (pause/resume, edit)
router.put('/:id', auth, async (req,res) => {
  try {
    const rem = await Reminder.findOne({ _id: req.params.id, user: req.user.id });
    if (!rem) return res.status(404).json({ message: 'Not found' });
    const { title, message, nextAt, frequency, active } = req.body;
    if (title !== undefined) rem.title = title;
    if (message !== undefined) rem.message = message;
    if (nextAt !== undefined) rem.nextAt = new Date(nextAt);
    if (frequency !== undefined) rem.frequency = frequency;
    if (active !== undefined) rem.active = active;
    await rem.save();
    res.json(rem);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// delete
router.delete('/:id', auth, async (req,res) => {
  try {
    const rem = await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!rem) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

module.exports = router;
