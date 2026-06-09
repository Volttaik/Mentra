---
name: Mentra email OTP pattern
description: How email verification codes work across signup, password reset, and bank account flows
---

EmailVerification model (prisma) stores `email`, `code`, `purpose`, `expiresAt`, `used`.

Three purposes: `signup`, `password_reset`, `bank_account`.

POST /api/auth/send-code { email, purpose } — sends 6-digit code via Gmail SMTP (nodemailer). For `bank_account`, uses the logged-in user's email from session.

**Signup flow:**
1. POST /api/auth/send-code { email, purpose: "signup" } — called from register page step 4 → 5
2. POST /api/auth/register { ...fields, verificationCode } — verifies OTP, marks used, creates account

**Password reset flow:**
1. POST /api/auth/forgot-password { email } — sends code
2. POST /api/auth/reset-password { email, code, newPassword } — verifies + resets

**Bank account flow:**
1. POST /api/auth/send-code { purpose: "bank_account" } (session required) — sends to session user's email
2. POST /api/creator/bank-account { accountNumber, bankCode, verificationCode } — verifies OTP, resolves account via Paystack, saves

**Why:** No magic links — plain 6-digit codes work across all email clients without URL trust issues.

ENV vars required: `GMAIL_USER`, `GMAIL_APP_PASSWORD` (Gmail App Password, not account password).
