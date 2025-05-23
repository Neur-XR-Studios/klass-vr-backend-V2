const nodemailer = require("nodemailer");
const config = require("../config/config");
const logger = require("../config/logger");

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== "test") {
  transport
    .verify()
    .then(() => logger.info("Connected to email server"))
    .catch(() =>
      logger.warn(
        "Unable to connect to email server. Make sure you have configured the SMTP options in .env"
      )
    );
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
  const msg = { from: config.email.from, to, subject, text };
  await transport.sendMail(msg);
};

/**
 *
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = "Reset password";
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `https://44.200.7.3/login?token=${token}`;
  const text = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
    }
    .logo {
      /* Replace with your company logo if desired */
      width: 100px;
      height: auto;
    }
    .content {
      line-height: 1.5;
    }
    .link {
      color: #007bff;
      text-decoration: none;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      color: #aaa;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="[**Your Logo URL**]" alt="Klass-VR" class="logo">
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Dear user,</p>
      <p>You recently requested to reset your password for your account.</p>

      <p>If you requested a password reset, please click the following link to create a new password:</p>
      <p><a href="${resetPasswordUrl}" class="link">${resetPasswordUrl}</a></p>

      <p>This link will expire in 24 hours. If you did not request a password reset, you can safely ignore this email.</p>

      <p>For your security, we recommend that you change your password regularly and use a strong, unique password for each of your online accounts.</p>
    </div>
    <div class="footer">
      <p>Sincerely,</p>
      <p>The Klass-VR Team</p>
    </div>
  </div>
</body>
</html>
`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = "Email Verification";
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} email
 * @param {string} password
 * @returns {Promise}
 */
const sendUserCredentialsEmail = async (
  email,
  password,
  vrDeviceRegisterSecret
) => {
  const subject = "User Credentials";
  const loginLink = "https://44.200.7.3/login";
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Credentials</title>
  </head>
  <body style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px; text-align: center;">
    <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
      <h1 style="color: #444;">User Credentials</h1>
      <p style="line-height: 1.6;">Dear user,</p>
      <p style="line-height: 1.6;">Your account has been created. Here are your credentials:</p>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
        <li><strong>Your VR device register number:</strong> ${vrDeviceRegisterSecret}</li>
      </ul>
      <p style="line-height: 1.6;">Please keep this information secure.</p>
      <p style="line-height: 1.6;">To login, click <a href="${loginLink}" style="color: #007bff; text-decoration: none;">here</a>.</p>
      <p style="line-height: 1.6;">Thank you.</p>
    </div>
  </body>
  </html>  
  `;
  await sendEmail(email, subject, html);
};

/**
 * Send verification email
 * @param {string} email
 * @param {string} password
 * @returns {Promise}
 */
const sendUserCredentialsEmailForTeacher = async (email, password) => {
  const subject = "User Credentials";
  const loginLink = "https://44.200.7.3/login";
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Credentials</title>
  </head>
  <body style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px; text-align: center;">
    <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
      <h1 style="color: #444;">User Credentials</h1>
      <p style="line-height: 1.6;">Dear user,</p>
      <p style="line-height: 1.6;">Your account has been created. Here are your credentials:</p>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p style="line-height: 1.6;">Please keep this information secure.</p>
      <p style="line-height: 1.6;">To login, click <a href="${loginLink}" style="color: #007bff; text-decoration: none;">here</a>.</p>
      <p style="line-height: 1.6;">Thank you.</p>
    </div>
  </body>
  </html>  
  `;
  await sendEmail(email, subject, html);
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendUserCredentialsEmail,
  sendUserCredentialsEmailForTeacher,
};
