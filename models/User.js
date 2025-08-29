const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  height: Number,       // cm
  weight: Number,       // kg
  wakeTime: String,     // HH:MM
  bedTime: String,      // HH:MM
  dailyWaterLiters: { type: Number, default: 2 }, // calculated from weight
  consumedToday: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Method to calculate daily recommended water intake (in liters)
// Using a simple formula: 35 ml per kg body weight
UserSchema.methods.calculateDailyWater = function() {
  if (this.weight) {
    this.dailyWaterLiters = parseFloat(((this.weight * 35) / 1000).toFixed(2)); // liters
  }
  return this.dailyWaterLiters;
};

// Method to reset consumed water at start of day
UserSchema.methods.resetConsumedToday = function() {
  this.consumedToday = 0;
};

module.exports = mongoose.model('User', UserSchema);
