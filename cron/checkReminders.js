const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');

function addDuration(d, frequency) {
  if (frequency === 'hourly') return new Date(d.getTime() + 60*60*1000);
  if (frequency === 'daily') return new Date(d.getTime() + 24*60*60*1000);
  return null;
}

function startReminderChecker() {
  // every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const due = await Reminder.find({ active: true, nextAt: { $lte: now } }).populate('user');
      if (!due.length) return;
      console.log(`Found ${due.length} due reminders at ${now.toISOString()}`);
      for (const r of due) {
        // email
        try {
          await sendEmail(r.user.email, `Reminder: ${r.title}`, `${r.message}\n\nTime: ${r.nextAt}`, `<p>${r.message}</p><p>${r.nextAt}</p>`);
          r.history.push({ sentAt: new Date(), deliveredBy: 'email', note: 'Sent by cron' });
        } catch (err) {
          console.error('Email send failed', err);
          r.history.push({ sentAt: new Date(), deliveredBy: 'email', note: 'Failed send' });
        }

        // update nextAt or deactivate
        const next = addDuration(r.nextAt, r.frequency);
        if (!next) {
          r.active = false;
        } else {
          r.nextAt = next;
        }
        await r.save();
      }
    } catch (err) {
      console.error('Reminder checker error:', err);
    }
  });
}

module.exports = startReminderChecker;
