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
  signup: "Your Mentra verification code – action required",
  password_reset: "Reset your Mentra password – verification code inside",
  bank_account: "Verify your bank account on Mentra",
  verify_account: "Confirm your Mentra email address",
  delete_stack: "Confirm stack deletion on Mentra – action required",
};

interface EmailContent {
  icon: string;
  title: string;
  subtitle: string;
  body: string;
  extraContext: string;
  codeLabel: string;
  urgency: string;
}

const CONTENT: Record<Purpose, EmailContent> = {
  signup: {
    icon: "🎓",
    title: "Welcome to Mentra",
    subtitle: "Finish setting up your account",
    body: "Thanks for joining Mentra — the collaborative academic knowledge platform built for students and professors. To protect your account and make sure we have the right email address, we need to verify it before activating your profile.",
    extraContext: "Once verified, you'll be able to explore academic stacks, publish your own course materials, fork and collaborate on existing stacks, and connect with learners worldwide.",
    codeLabel: "Your one-time verification code",
    urgency: "This code is valid for <strong>10 minutes</strong> and can only be used once. If you did not create a Mentra account, you can safely ignore this email — no account will be created.",
  },
  password_reset: {
    icon: "🔑",
    title: "Password reset request",
    subtitle: "We received a request to reset your password",
    body: "We received a request to reset the password associated with your Mentra account. If this was you, use the verification code below to proceed. If you did not make this request, your account is still secure — simply disregard this message.",
    extraContext: "For your security, this code can only be used once and will expire shortly. We recommend choosing a strong, unique password that you don't use on other platforms.",
    codeLabel: "Your password reset code",
    urgency: "This code expires in <strong>10 minutes</strong>. If you didn't request a password reset, you can safely ignore this email — your password will not change.",
  },
  bank_account: {
    icon: "🏦",
    title: "Verify your bank account",
    subtitle: "One final step before you can receive payments",
    body: "You've initiated the process of adding a bank account to your Mentra creator profile. This allows you to receive payments for your published stacks and educational content. To complete the setup securely, enter the verification code below.",
    extraContext: "We take financial security seriously. This verification step ensures that only you can link a bank account to your profile. Your banking information is handled securely and never stored in plain text on our servers.",
    codeLabel: "Your bank account verification code",
    urgency: "This code expires in <strong>10 minutes</strong>. If you did not initiate this request, please contact our support team immediately.",
  },
  verify_account: {
    icon: "✉️",
    title: "Verify your email address",
    subtitle: "Complete your Mentra account setup",
    body: "Before you can sign in to Mentra, we need to confirm that this email address belongs to you. This is a standard security step that helps us keep your account safe and ensures you can recover access if needed.",
    extraContext: "Verifying your email also allows us to send you important account notifications, including security alerts, community invites, and updates about the stacks you follow.",
    codeLabel: "Your email verification code",
    urgency: "This code expires in <strong>10 minutes</strong>. If you did not create a Mentra account using this email address, you can safely ignore this email.",
  },
  delete_stack: {
    icon: "⚠️",
    title: "Confirm stack deletion",
    subtitle: "This action is permanent and cannot be undone",
    body: "You've requested to permanently delete a stack from Mentra. Deleting a stack will remove all associated modules, uploaded files, discussion threads, quiz data, and contribution history. This action cannot be reversed once confirmed.",
    extraContext: "If you're unsure, consider making the stack private instead of deleting it — this keeps your work saved while hiding it from public view. You can change this in your stack settings.",
    codeLabel: "Your deletion confirmation code",
    urgency: "This code expires in <strong>10 minutes</strong>. If you did not request this deletion, please secure your account immediately by changing your password.",
  },
};

function buildPlainText(code: string, purpose: Purpose, recipientEmail: string): string {
  const c = CONTENT[purpose];
  const year = new Date().getFullYear();
  return `${c.title}
${c.subtitle}
${"=".repeat(60)}

${c.body}

${c.extraContext}

${c.codeLabel.toUpperCase()}
${code}

${c.urgency.replace(/<[^>]+>/g, "")}

Never share this code with anyone. Mentra staff will never ask for your verification code.

${"=".repeat(60)}
This email was sent to ${recipientEmail} because an action was performed on a Mentra account associated with this address.

Mentra – The Collaborative Academic OS
If you have questions, reply to this email or visit https://mentra.app

© ${year} Mentra. All rights reserved.
You received this transactional email as part of your use of the Mentra platform.`;
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
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no" />
  <title>${c.title} – Mentra</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f2ede6;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Your ${c.codeLabel.toLowerCase()} is ${code}. Valid for 10 minutes. Do not share this code with anyone.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f2ede6;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:32px 16px 24px;">

        <!-- Wrapper -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="580" style="max-width:580px;width:100%;">

          <!-- Logo header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#735b25;border-radius:14px;padding:10px 20px;">
                    <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:18px;font-weight:800;color:#fef9f2;letter-spacing:-0.3px;">Mentra</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">

              <!-- Top accent bar -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background:linear-gradient(90deg,#735b25 0%,#9c7d35 100%);height:5px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Card body -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:44px 48px 40px;">

                    <!-- Icon + title -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding-bottom:24px;">
                          <p style="margin:0 0 12px;font-size:36px;line-height:1;">${c.icon}</p>
                          <h1 style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:24px;font-weight:700;color:#2c1f0e;letter-spacing:-0.4px;line-height:1.2;">${c.title}</h1>
                          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;color:#8a7660;font-weight:500;line-height:1.4;">${c.subtitle}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="border-top:1px solid #f0ebe4;padding-bottom:28px;font-size:0;line-height:0;"></td>
                      </tr>
                    </table>

                    <!-- Body text -->
                    <p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;color:#4a3b28;line-height:1.75;">${c.body}</p>

                    <!-- Extra context -->
                    <p style="margin:0 0 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:14px;color:#7a6a55;line-height:1.75;">${c.extraContext}</p>

                    <!-- Code label -->
                    <p style="margin:0 0 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;font-weight:700;color:#8a7660;text-transform:uppercase;letter-spacing:1px;">${c.codeLabel}</p>

                    <!-- OTP code box -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="background-color:#faf7f2;border:1.5px solid #e8dfd0;border-radius:16px;padding:28px 20px;text-align:center;">
                          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                            <tr>
                              ${digits.map((d, i) => `
                              <td style="padding:${i < digits.length - 1 ? "0 6px 0 0" : "0"};">
                                <div style="width:46px;height:58px;background-color:#ffffff;border:2px solid #d9cfc3;border-radius:12px;display:inline-block;text-align:center;line-height:58px;">
                                  <span style="font-family:'Courier New',Courier,monospace;font-size:28px;font-weight:700;color:#2c1f0e;">${d}</span>
                                </div>
                              </td>`).join("")}
                            </tr>
                          </table>
                          <p style="margin:18px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;color:#a09080;">or copy the code: <strong style="color:#2c1f0e;font-family:'Courier New',Courier,monospace;letter-spacing:4px;font-size:15px;">${code}</strong></p>
                        </td>
                      </tr>
                    </table>

                    <!-- Urgency notice -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:20px;">
                      <tr>
                        <td style="background-color:#fff8ee;border-left:4px solid #d4a843;border-radius:0 10px 10px 0;padding:14px 18px;">
                          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;color:#7a5c1e;line-height:1.6;">${c.urgency}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Security note -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px;">
                      <tr>
                        <td style="background-color:#f8f5f0;border-radius:12px;padding:16px 20px;">
                          <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;font-weight:700;color:#4a3b28;">🔒 Keep this code private</p>
                          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;color:#8a7660;line-height:1.6;">Never share this code with anyone — including people claiming to be from Mentra. Our team will <strong>never</strong> ask for your verification code via email, chat, or phone.</p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 8px 12px;">
              <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;color:#b0a090;text-align:center;line-height:1.7;">
                This email was sent to <strong style="color:#8a7660;">${recipientEmail}</strong> because an action was requested on a Mentra account associated with this address.
              </p>
              <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;color:#b0a090;text-align:center;line-height:1.7;">
                If you did not perform this action, you can safely ignore this email. This is a transactional message — you cannot unsubscribe from security-related notifications.
              </p>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;color:#c8bfb0;text-align:center;line-height:1.6;">
                © ${year} Mentra. All rights reserved. &nbsp;·&nbsp; The Collaborative Academic OS<br />
                <span style="font-size:10px;color:#d4cdc4;">Mentra · Academic Knowledge Platform · mentra.app</span>
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
  const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@mentra.app>`;

  await transporter.sendMail({
    from: `"Mentra" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: SUBJECTS[purpose],
    html: buildEmail(code, purpose, email),
    text: buildPlainText(code, purpose, email),
    headers: {
      "Message-ID": messageId,
      "X-Mailer": "Mentra Mailer 1.0",
      "X-Entity-Ref-ID": `mentra-${purpose}-${Date.now()}`,
      "List-Unsubscribe": `<mailto:${process.env.GMAIL_USER}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "Feedback-ID": `${purpose}:mentra`,
    },
  });
}
