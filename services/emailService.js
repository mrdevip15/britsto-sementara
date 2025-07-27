const nodemailer = require('nodemailer');

// Create email transporter using Mailtrap configuration
// Can use environment variables if available, otherwise falls back to hardcoded values
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST || "live.smtp.mailtrap.io",
    port: process.env.MAILTRAP_PORT || 587,
    auth: {
      user: process.env.MAILTRAP_USER || "api",
      pass: process.env.MAILTRAP_PASS || "b7f383cf8efbfdbb2d40f7ce81ff2974"
    }
  });
};

// Send email function
const sendEmail = async (mailOptions) => {
  try {
    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    console.log('Email transporter verification successful');
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      recipient: mailOptions.to
    });
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Send password reset email using the existing template
const sendPasswordResetEmail = async (userEmail, userName, newPassword, hostname) => {
  const { generatePasswordResetEmail } = require('../utilities/emailTemplates');
  
  const emailContent = generatePasswordResetEmail(userName, newPassword, hostname);
  
  const mailOptions = {
    from: {
      name: 'BritsEdu Support',
      address: 'noreply@britseducenter.com'
    },
    to: userEmail,
    subject: '🔐 Password Reset - BritsEdu',
    html: emailContent
  };

  return await sendEmail(mailOptions);
};

// Send schedule reminder email
const sendScheduleReminderEmail = async (recipientEmail, subject, htmlContent) => {
  const mailOptions = {
    from: {
      name: 'BritsEdu',
      address: 'noreply@britseducenter.com'
    },
    to: recipientEmail,
    subject: subject,
    html: htmlContent
  };

  return await sendEmail(mailOptions);
};

module.exports = {
  createTransporter,
  sendEmail,
  sendPasswordResetEmail,
  sendScheduleReminderEmail
}; 