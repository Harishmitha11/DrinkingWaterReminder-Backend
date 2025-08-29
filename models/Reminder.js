const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, default: 'Time to drink water 💧' },
  nextAt: { type: Date, required: true },
  frequency: { type: String, enum: ['once','hourly','daily'], default: 'once' },
  active: { type: Boolean, default: true },
  history: [
    {
      sentAt: Date,
      deliveredBy: { type: String, enum: ['email','browser'], default: 'email' },
      note: String
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reminder', ReminderSchema);
