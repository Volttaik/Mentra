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

type Purpose = "signup" | "password_reset" | "bank_account" | "verify_account" | "delete_stack";

const SUBJECTS: Record<Purpose, string> = {
  signup: "Your Mentra verification code",
  password_reset: "Reset your Mentra password",
  bank_account: "Verify your bank account on Mentra",
  verify_account: "Finish verifying your Mentra account",
  delete_stack: "Confirm stack deletion — Mentra",
};

interface EmailContent {
  icon: string;
  title: string;
  subtitle: string;
  body: string;
  codeLabel: string;
  urgency: string;
}

const CONTENT: Record<Purpose, EmailContent> = {
  signup: {
    icon: "🎓",
    title: "Welcome to Mentra",
    subtitle: "You're one step away from your account",
    body: "Thanks for signing up! Enter the verification code below to activate your account and start exploring academic knowledge.",
    codeLabel: "Your verification code",
    urgency: "This code expires in <strong>10 minutes</strong>.",
  },
  password_reset: {
    icon: "🔑",
    title: "Reset your password",
    subtitle: "We received a password reset request",
    body: "Someone (hopefully you) requested a password reset for your Mentra account. Enter the code below to set a new password.",
    codeLabel: "Your reset code",
    urgency: "This code expires in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.",
  },
  bank_account: {
    icon: "🏦",
    title: "Verify your bank account",
    subtitle: "One final step to receive payments",
    body: "You're adding a bank account to your Mentra profile. Enter the code below to verify and complete the setup.",
    codeLabel: "Your verification code",
    urgency: "This code expires in <strong>10 minutes</strong>.",
  },
  verify_account: {
    icon: "✉️",
    title: "Verify your email address",
    subtitle: "Complete your account setup",
    body: "We need to verify your email address before you can sign in. Enter the code below to confirm your identity and access your account.",
    codeLabel: "Your verification code",
    urgency: "This code expires in <strong>10 minutes</strong>. If you didn't create an account, you can safely ignore this email.",
  },
  delete_stack: {
    icon: "⚠️",
    title: "Confirm stack deletion",
    subtitle: "This action cannot be undone",
    body: "You've requested to permanently delete a stack on Mentra. This will remove all modules, files, discussions, and related data. Enter the code below to confirm.",
    codeLabel: "Your confirmation code",
    urgency: "This code expires in <strong>10 minutes</strong>. If you didn't request this, please secure your account immediately.",
  },
};

function buildPlainText(code: string, purpose: Purpose): string {
  const c = CONTENT[purpose];
  return `${c.title}

${c.body}

Your code: ${code}

This code expires in 10 minutes. Never share this code with anyone.

---
Mentra — The Collaborative Academic OS
You received this email because an action was requested on your account.`;
}

function buildEmail(code: string, purpose: Purpose, recipientEmail: string): string {
  const c = CONTENT[purpose];
  const year = new Date().getFullYear();
  const digits = code.split("");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${c.title}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f2ede6;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f2ede6;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:32px 16px 24px;">

        <!-- Wrapper -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;width:100%;">

          <!-- Logo header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#735b25;border-radius:14px;padding:10px 18px;">
                    <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:18px;font-weight:800;color:#fef9f2;letter-spacing:-0.3px;">Mentra</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">

              <!-- Top accent bar -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background:linear-gradient(90deg,#735b25 0%,#9c7d35 100%);height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Card body -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:40px 44px 32px;">

                    <!-- Icon + title -->
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:20px;">
                          <p style="margin:0 0 10px;font-size:32px;line-height:1;">${c.icon}</p>
                          <h1 style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:22px;font-weight:700;color:#2c1f0e;letter-spacing:-0.4px;">${c.title}</h1>
                          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:14px;color:#8a7660;font-weight:500;">${c.subtitle}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="border-top:1px solid #f0ebe4;padding-bottom:24px;font-size:0;line-height:0;"></td>
                      </tr>
                    </table>

                    <!-- Body text -->
                    <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;color:#4a3b28;line-height:1.7;">${c.body}</p>

                    <!-- Code label -->
                    <p style="margin:0 0 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;font-weight:600;color:#8a7660;text-transform:uppercase;letter-spacing:0.8px;">${c.codeLabel}</p>

                    <!-- OTP code box -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="background-color:#faf7f2;border:1.5px solid #e8dfd0;border-radius:14px;padding:24px 20px;text-align:center;">
                          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                            <tr>
                              ${digits.map((d, i) => `
                              <td style="padding:${i < digits.length - 1 ? "0 6px 0 0" : "0"};">
                                <div style="width:44px;height:54px;background-color:#ffffff;border:1.5px solid #d9cfc3;border-radius:10px;display:inline-block;text-align:center;line-height:54px;">
                                  <span style="font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:700;color:#2c1f0e;">${d}</span>
                                </div>
                              </td>`).join("")}
                            </tr>
                          </table>
                          <p style="margin:16px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;color:#a09080;">or copy: <strong style="color:#2c1f0e;font-family:'Courier New',Courier,monospace;letter-spacing:3px;">${code}</strong></p>
                        </td>
                      </tr>
                    </table>

                    <!-- Urgency notice -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:20px;">
                      <tr>
                        <td style="background-color:#fff8ee;border-left:3px solid #d4a843;border-radius:0 8px 8px 0;padding:12px 16px;">
                          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;color:#7a5c1e;line-height:1.5;">${c.urgency}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Security note -->
                    <p style="margin:24px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;color:#b0a090;line-height:1.6;">🔒 <strong>Never share this code</strong> with anyone. Mentra staff will never ask for it.</p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 8px 8px;">
              <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;color:#b0a090;text-align:center;line-height:1.6;">
                This email was sent to <strong>${recipientEmail}</strong> because an action was requested on your Mentra account.
              </p>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;color:#c8bfb0;text-align:center;">
                © ${year} Mentra. All rights reserved. &nbsp;·&nbsp; The Collaborative Academic OS
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationCode(
  email: string,
  code: string,
  purpose: Purpose
) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("[email] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping send");
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Mentra" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: SUBJECTS[purpose],
    html: buildEmail(code, purpose, email),
    text: buildPlainText(code, purpose),
    headers: {
      "X-Priority": "1",
      "X-Mailer": "Mentra Mailer",
      "List-Unsubscribe": `<mailto:${process.env.GMAIL_USER}?subject=unsubscribe>`,
    },
  });
}
