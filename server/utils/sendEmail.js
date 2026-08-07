const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (email, otp, type = "verification") => {
  try {
    const isReset = type === "reset";

    const subject = isReset
      ? `${otp} is your LoopChat password reset code`
      : `${otp} is your LoopChat verification code`;

    const html = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>LoopChat</h2>
        <p>${isReset ? "Reset your password" : "Verify your email"}</p>
        <h1 style="letter-spacing: 6px;">${otp}</h1>
        <p>This code expires in 15 minutes.</p>
      </div>
    `;

    const response = await resend.emails.send({
      from: "LoopChat <onboarding@resend.dev>",
      to: email,
      subject: subject,
      html: html,
    });

    console.log("Resend success:", response);
    return true;
  } catch (error) {
    console.error("Resend error:", error);
    return false;
  }
};

module.exports = sendOTPEmail;
