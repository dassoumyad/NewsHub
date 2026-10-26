const nodemailer = require("nodemailer");

const port = Number(process.env.SMTP_PORT) || 587;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port,
  secure: process.env.SMTP_SECURE === "true" || port === 465,
  ...(process.env.SMTP_USER && process.env.SMTP_PASS
    ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
    : {}),
});

const mailFrom = process.env.MAIL_FROM || process.env.SMTP_USER;

module.exports = { transporter, mailFrom };

