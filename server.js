// const express = require("express");
const mongoose = require("mongoose");
// const cors = require("cors");
// require("dotenv").config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // MongoDB connection
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => console.log("MongoDB Connected"))
// .catch(err => console.log(err));

// // Schema
// const reminderSchema = new mongoose.Schema({
//   time: String,
//   message: String
// });
// const Reminder = mongoose.model("Reminder", reminderSchema);

// // Routes
// app.get("/reminders", async (req, res) => {
//   const reminders = await Reminder.find();
//   res.json(reminders);
// });

// app.post("/reminders", async (req, res) => {
//   const { time, message } = req.body;
//   const reminder = new Reminder({ time, message });
//   await reminder.save();
//   res.json(reminder);
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const reminderRoutes = require('./routes/reminders');
const startReminderChecker = require('./cron/checkReminders');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI missing in env');
  process.exit(1);
}
connectDB(process.env.MONGO_URI);

app.use('/api/auth', authRoutes);
app.use('/api/reminders', reminderRoutes);

app.get('/', (req,res)=> res.send('Water Reminder API'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
  startReminderChecker();
});
