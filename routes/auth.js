const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Reminder = require('../models/Reminder');
const router = express.Router();
const auth = require('../middleware/auth');

// Helper: create reminders automatically
async function createDailyReminders(user) {
  if (!user.wakeTime || !user.bedTime) return; // skip if times not set
  const wake = user.wakeTime.split(':').map(Number);
  const bed = user.bedTime.split(':').map(Number);
  const totalMinutes = (bed[0]*60 + bed[1]) - (wake[0]*60 + wake[1]);
  if (totalMinutes <= 0) return;

  const numberOfGlasses = Math.max(Math.ceil(user.dailyWaterLiters / 0.25), 1);
  const interval = Math.floor(totalMinutes / numberOfGlasses);

  const today = new Date();
  today.setHours(0,0,0,0);

  for (let i = 0; i < numberOfGlasses; i++) {
    const nextAt = new Date(today);
    const minutes = wake[0]*60 + wake[1] + i*interval;
    nextAt.setHours(Math.floor(minutes/60), minutes%60, 0, 0);

    await Reminder.create({
      user: user._id,
      title: 'Drink water',
      message: `Drink ${(user.dailyWaterLiters/numberOfGlasses).toFixed(2)} L water`,
      nextAt,
      frequency: 'once'
    });
  }
}

// Reset consumedToday at start of each day (use cron or call on server start)
async function resetDailyConsumed() {
  const today = new Date();
  today.setHours(0,0,0,0);
  await User.updateMany({}, { consumedToday: 0 });
}

// Register
router.post('/register', async (req,res)=>{
  const { name,email,password,height,weight,wakeTime,bedTime } = req.body;
  try {
    let user = await User.findOne({ email });
    if(user) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const dailyWaterLiters = weight ? (weight*35)/1000 : 2;

    user = await User.create({ 
      name, email, password: hashed, height, weight, wakeTime, bedTime, dailyWaterLiters, consumedToday:0
    });

    await createDailyReminders(user);

    const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Login
router.post('/login', async (req,res)=>{
  const { email,password } = req.body;
  try {
    const user = await User.findOne({ email });
    if(!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name: user.name, email: user.email, dailyWaterLiters: user.dailyWaterLiters, consumedToday: user.consumedToday } });
  } catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// GET /auth/me
router.get('/me', auth, async (req,res)=>{
  try {
    const user = await User.findById(req.user.id).select('-password');
    if(!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch(err) { res.status(500).send('Server error'); }
});

// GET /auth/profile
router.get('/profile', auth, async (req,res)=>{
  try {
    const user = await User.findById(req.user.id).select('-password');
    if(!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      height: user.height,
      weight: user.weight,
      wakeTime: user.wakeTime,
      sleepTime: user.bedTime,
      dailyGoal: user.dailyWaterLiters,
      consumedToday: user.consumedToday
    });
  } catch(err) { res.status(500).send('Server error'); }
});

// PUT /auth/profile
router.put('/profile', auth, async (req,res)=>{
  try {
    const { height, weight, wakeTime, sleepTime, dailyGoal, consumedToday } = req.body;
    const user = await User.findById(req.user.id);
    if(!user) return res.status(404).json({ message: 'User not found' });

    if(height !== undefined) user.height = Number(height);
    if(weight !== undefined) {
      user.weight = Number(weight);
      user.dailyWaterLiters = parseFloat(((weight*35)/1000).toFixed(2));
    }
    if(wakeTime) user.wakeTime = wakeTime;
    if(sleepTime) user.bedTime = sleepTime;
    if(dailyGoal) user.dailyWaterLiters = Number(dailyGoal);
    if(consumedToday !== undefined) user.consumedToday = Number(consumedToday);

    await user.save();
    res.json({ message: 'Profile updated', dailyWaterLiters: user.dailyWaterLiters, consumedToday: user.consumedToday });
  } catch(err){ res.status(500).send('Server error'); }
});

// Endpoint to mark water consumed
router.put('/drink', auth, async (req,res)=>{
  try {
    const { liters } = req.body;
    const user = await User.findById(req.user.id);
    if(!user) return res.status(404).json({ message: 'User not found' });

    user.consumedToday += Number(liters);
    if(user.consumedToday > user.dailyWaterLiters) user.consumedToday = user.dailyWaterLiters;

    await user.save();
    res.json({ consumedToday: user.consumedToday, dailyWaterLiters: user.dailyWaterLiters });
  } catch(err){ res.status(500).send('Server error'); }
});


// PUT /auth/drink
router.put('/drink', auth, async (req, res) => {
  try {
    const { liters } = req.body; // amount drank
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update consumedToday but do not exceed dailyWaterLiters
    user.consumedToday = Math.min(user.consumedToday + liters, user.dailyWaterLiters);
    await user.save();

    res.json({ consumedToday: user.consumedToday, remaining: user.dailyWaterLiters - user.consumedToday });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
