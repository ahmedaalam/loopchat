const nodemailer = require("nodemailer");

const sendOTPEmail = async (email, otp) => {
  // Always log OTP to server console for testing/debugging
  console.log(`\n==========================================`);
  console.log(`[OTP VERIFICATION CODE]`);
  console.log(`To: ${email}`);
  console.log(`OTP Code: ${otp}`);
  console.log(`Expires in: 15 minutes`);
  console.log(`==========================================\n`);

  // If SMTP environment variables are provided, send actual email via Nodemailer
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"LoopChat Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "LoopChat - Email Verification OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #1f1f1f; border-radius: 12px; background-color: #111111; color: #f5f5f5;">
            <h2 style="color: #60a5fa; text-align: center; margin-bottom: 20px;">LoopChat Verification</h2>
            <p style="font-size: 15px; color: #a3a3a3;">Thank you for registering with LoopChat! Please use the following One-Time Password (OTP) to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb; background: #1a1a1a; padding: 12px 24px; border-radius: 8px; border: 1px solid #2563eb;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #737373;">This OTP is valid for 15 minutes. If you did not request this code, please ignore this email.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email successfully sent to ${email}`);
    } catch (error) {
      console.error("Nodemailer Email Error:", error.message);
      // We do not throw error here so registration/resend flow completes even if email server fails
    }
  }
};

module.exports = sendOTPEmail;
