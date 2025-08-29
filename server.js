
const mongoose = require("mongoose");


require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const reminderRoutes = require('./routes/reminders');
const startReminderChecker = require('./cron/checkReminders');

const app = express();
const allowedOrigins = [
  "https://drinkingwaterreminder-frontend.onrender.com", // ✅ your Render frontend
  "http://localhost:3000", // ✅ for local dev (CRA)
  "http://localhost:5173"  // ✅ for local dev (Vite)
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

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
