import nodemailer from "nodemailer";

// Create transporter based on environment
const getTransporter = () => {
  // Local development: use Mailpit
  if (process.env.NODE_ENV === "development" || !process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "localhost",
      port: parseInt(process.env.SMTP_PORT || "1025"),
      secure: false,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
  }

  // Production: use configured SMTP
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const transporter = getTransporter();

const getFromEmail = () => {
  return process.env.SMTP_FROM || "noreply@quizlink.fr";
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}) {
  try {
    await transporter.sendMail({
      from: getFromEmail(),
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Fallback to plain text from HTML
      attachments: attachments?.length ? attachments : undefined,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendVerificationEmail(
  email: string,
  code: string,
  locale: "fr" | "en" = "fr"
) {
  const subject =
    locale === "fr"
      ? "Vérifiez votre adresse email - QuizLink"
      : "Verify your email address - QuizLink";

  const html =
    locale === "fr"
      ? `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Vérifiez votre adresse email</h1>
        <p>Bonjour,</p>
        <p>Merci de vous être inscrit sur QuizLink. Pour activer votre compte, veuillez utiliser le code de vérification suivant :</p>
        <div style="background-color: #f3f4f6; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h2 style="color: #2563eb; font-size: 32px; letter-spacing: 4px; margin: 0;">${code}</h2>
        </div>
        <p>Ce code expire dans 15 minutes.</p>
        <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Cordialement,<br>L'équipe QuizLink</p>
      </body>
    </html>
  `
      : `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Verify your email address</h1>
        <p>Hello,</p>
        <p>Thank you for signing up for QuizLink. To activate your account, please use the following verification code:</p>
        <div style="background-color: #f3f4f6; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h2 style="color: #2563eb; font-size: 32px; letter-spacing: 4px; margin: 0;">${code}</h2>
        </div>
        <p>This code expires in 15 minutes.</p>
        <p>If you did not create an account, you can ignore this email.</p>
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Best regards,<br>The QuizLink Team</p>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: getFromEmail(),
      to: email,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  locale: "fr" | "en" = "fr"
) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

  const subject =
    locale === "fr"
      ? "Réinitialisez votre mot de passe - QuizLink"
      : "Reset your password - QuizLink";

  const html =
    locale === "fr"
      ? `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Réinitialisez votre mot de passe</h1>
        <p>Bonjour,</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Réinitialiser le mot de passe</a>
        </div>
        <p>Ou copiez ce lien dans votre navigateur :</p>
        <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${resetUrl}</p>
        <p>Ce lien expire dans 1 heure.</p>
        <p>Si vous n'avez pas demandé de réinitialisation, vous pouvez ignorer cet email.</p>
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Cordialement,<br>L'équipe QuizLink</p>
      </body>
    </html>
  `
      : `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Reset your password</h1>
        <p>Hello,</p>
        <p>You requested to reset your password. Click the link below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${resetUrl}</p>
        <p>This link expires in 1 hour.</p>
        <p>If you did not request a password reset, you can ignore this email.</p>
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Best regards,<br>The QuizLink Team</p>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: getFromEmail(),
      to: email,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendEmailChangeCode(
  email: string,
  code: string,
  locale: "fr" | "en" = "fr"
) {
  const subject =
    locale === "fr"
      ? "Code de vérification pour changement d'email - QuizLink"
      : "Email change verification code - QuizLink";

  const html =
    locale === "fr"
      ? `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Changement d'adresse email</h1>
        <p>Bonjour,</p>
        <p>Vous avez demandé à changer votre adresse email. Utilisez le code de vérification suivant :</p>
        <div style="background-color: #f3f4f6; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h2 style="color: #2563eb; font-size: 32px; letter-spacing: 4px; margin: 0;">${code}</h2>
        </div>
        <p>Ce code expire dans 15 minutes.</p>
        <p>Si vous n'avez pas demandé de changement d'email, vous pouvez ignorer cet email.</p>
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Cordialement,<br>L'équipe QuizLink</p>
      </body>
    </html>
  `
      : `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Email address change</h1>
        <p>Hello,</p>
        <p>You requested to change your email address. Use the following verification code:</p>
        <div style="background-color: #f3f4f6; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h2 style="color: #2563eb; font-size: 32px; letter-spacing: 4px; margin: 0;">${code}</h2>
        </div>
        <p>This code expires in 15 minutes.</p>
        <p>If you did not request an email change, you can ignore this email.</p>
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Best regards,<br>The QuizLink Team</p>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: getFromEmail(),
      to: email,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending email change code:", error);
    return { success: false, error: "Failed to send email" };
  }
}
