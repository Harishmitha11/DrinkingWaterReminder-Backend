const nodemailer = require('nodemailer');

let transporterPromise = null;
async function getTransporter(){
  if (transporterPromise) return transporterPromise;
  transporterPromise = (async ()=>{
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });
    } else {
      const account = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass }
      });
    }
  })();
  return transporterPromise;
}

async function sendEmail(to, subject, text, html){
  const t = await getTransporter();
  const info = await t.sendMail({ from: process.env.EMAIL_USER || '"Water Reminder" <no-reply@example.com>', to, subject, text, html });
  if (nodemailer.getTestMessageUrl(info)) {
    console.log('Preview email URL:', nodemailer.getTestMessageUrl(info));
  }
  return info;
}

module.exports = { sendEmail };
