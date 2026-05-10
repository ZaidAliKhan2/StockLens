const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const transporter = require('../config/email');

const SALT_ROUNDS = 12;

function generateOTP() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
}

async function hashPassword(plainText) {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

async function comparePassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}

function generateToken(payload) {
  return jwt.sign(
    {
      user_id: payload.user_id,
      email: payload.email,
      role: payload.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

function sendOTPEmail(toEmail, otpCode, fullName) {
  const expiresMinutes = process.env.OTP_EXPIRES_MINUTES || '10';

  if (process.env.NODE_ENV === 'development') {
    console.log(`Development OTP for ${toEmail}: ${otpCode}`);
  }

  return transporter.sendMail({
    from: `"StockLens" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'StockLens — Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
        <h2 style="margin-bottom: 8px;">Verify your StockLens account</h2>
        <p>Hello ${fullName || 'there'},</p>
        <p>Use this verification code to complete your StockLens registration:</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; margin: 24px 0; color: #111827;">
          ${otpCode}
        </div>
        <p>This code expires in ${expiresMinutes} minutes.</p>
        <p>If you did not request this email, you can safely ignore it.</p>
      </div>
    `,
  });
}

module.exports = {
  generateOTP,
  hashPassword,
  comparePassword,
  generateToken,
  sendOTPEmail,
};
