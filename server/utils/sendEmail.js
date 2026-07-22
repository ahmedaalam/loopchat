const nodemailer = require("nodemailer");

const sendOTPEmail = async (email, otp) => {
  // 1. Console log OTP for local development & testing
  console.log(`\n==========================================`);
  console.log(`[OTP VERIFICATION CODE]`);
  console.log(`To: ${email}`);
  console.log(`OTP Code: ${otp}`);
  console.log(`Expires in: 15 minutes`);
  console.log(`==========================================\n`);

  // 2. Send actual email via Nodemailer if EMAIL_USER & EMAIL_PASS are set in .env
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      let transporterConfig;

      if (process.env.EMAIL_SERVICE) {
        transporterConfig = {
          service: process.env.EMAIL_SERVICE, // e.g. 'gmail'
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        };
      } else if (process.env.EMAIL_HOST) {
        transporterConfig = {
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || "587"),
          secure: process.env.EMAIL_SECURE === "true",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        };
      } else {
        // Default to Gmail Service
        transporterConfig = {
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        };
      }

      const transporter = nodemailer.createTransport(transporterConfig);

      const mailOptions = {
        from: `"LoopChat" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `${otp} is your LoopChat verification code`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #222222; border-radius: 12px; background-color: #0f0f0f; color: #f5f5f5;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #60a5fa; margin: 0;">LoopChat</h2>
              <p style="color: #a3a3a3; font-size: 0.9rem; margin-top: 4px;">Email Verification</p>
            </div>
            <p style="font-size: 15px; color: #d4d4d4; line-height: 1.5;">Thank you for signing up! Use the verification code below to complete your registration:</p>
            <div style="text-align: center; margin: 28px 0;">
              <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #60a5fa; background: #1a1a1a; padding: 14px 28px; border-radius: 10px; border: 1px solid #2563eb; display: inline-block;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #737373; text-align: center; margin-top: 24px;">This code will expire in 15 minutes. If you did not request this email, please ignore it.</p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(
        `Email successfully delivered to ${email} (Message ID: ${info.messageId})`,
      );
    } catch (error) {
      console.error("Nodemailer delivery error:", error.message);
    }
  } else {
    console.warn(
      "EMAIL_USER and EMAIL_PASS are not set in .env!\n" +
        "To send real emails to recipient inboxes, add EMAIL_USER and EMAIL_PASS to your server/.env file.",
    );
  }
};

module.exports = sendOTPEmail;
