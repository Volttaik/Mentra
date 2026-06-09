import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

const SUBJECTS: Record<string, string> = {
  signup: "Verify your Mentra account",
  password_reset: "Reset your Mentra password",
  bank_account: "Verify your bank account — Mentra",
};

const HEADLINES: Record<string, string> = {
  signup: "Welcome to Mentra!",
  password_reset: "Password Reset Request",
  bank_account: "Bank Account Verification",
};

const MESSAGES: Record<string, string> = {
  signup: "Use the code below to verify your email and activate your account.",
  password_reset: "Use the code below to reset your password.",
  bank_account: "Use the code below to verify and add your bank account.",
};

function buildEmail(code: string, purpose: string) {
  const headline = HEADLINES[purpose] ?? "Mentra Verification";
  const message = MESSAGES[purpose] ?? "Use the code below to verify.";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f7f7f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,0.07);">
        <tr><td style="background:#1a1a2e;padding:28px 32px;">
          <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Mentra</span>
        </td></tr>
        <tr><td style="padding:36px 32px;">
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1a1a2e;">${headline}</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">${message}</p>
          <div style="background:#f0f0f8;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#1a1a2e;">${code}</span>
          </div>
          <p style="margin:0;font-size:13px;color:#999;">This code expires in <strong>10 minutes</strong>. Never share it with anyone.</p>
        </td></tr>
        <tr><td style="background:#f7f7f5;padding:20px 32px;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#aaa;">© ${new Date().getFullYear()} Mentra. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationCode(
  email: string,
  code: string,
  purpose: "signup" | "password_reset" | "bank_account"
) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("[email] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping send");
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Mentra" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: SUBJECTS[purpose] ?? "Mentra Verification Code",
    html: buildEmail(code, purpose),
  });
}
