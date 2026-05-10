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

/** From address for the welcome email (reply-friendly default when SMTP_FROM is unset). */
const getWelcomeFromEmail = () => {
  return process.env.SMTP_FROM || "contact@quizlink.fr";
};

function escapeHtmlForEmail(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendWelcomeEmail({
  to,
  name,
  coinBalance,
  locale = "fr",
}: {
  to: string;
  name: string;
  coinBalance: number;
  locale?: "fr" | "en";
}): Promise<{ success: boolean; error?: string }> {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  const createUrl = `${baseUrl}/dashboard/create`;
  const safeName = escapeHtmlForEmail(name);

  const subject =
    locale === "fr"
      ? "Bienvenue sur QuizLink 🎉"
      : "Welcome to QuizLink 🎉";

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
        <h1 style="color: #2563eb;">Bienvenue sur QuizLink</h1>
        <p>Bonjour ${safeName},</p>
        <p>Moi c'est Lazare, le créateur de QuizLink.</p>
        <p>Je suis ravi de t'accueillir ici.</p>
        <p>J'ai créé QuizLink pour rendre la création de quiz plus simple, plus rapide et plus agréable, que ce soit pour réviser, animer un cours, tester des connaissances ou partager une activité.</p>
        <p>Ton compte est prêt et tu as actuellement <strong>${coinBalance}</strong> coins pour tester la génération de quiz avec l'IA.</p>
        <p>Le plus simple maintenant : crée ton premier quiz, partage le lien, et regarde les réponses arriver.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${createUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Créer mon premier quiz</a>
        </div>
        <p style="word-break: break-all; color: #6b7280; font-size: 14px;">Ou ouvre ce lien : ${createUrl}</p>
        <p>Si tu as une idée, une remarque ou un bug à me partager, tu peux simplement répondre à cet email. Ça m'aide énormément à améliorer QuizLink.</p>
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">À très vite,<br>Lazare<br>Créateur de QuizLink</p>
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
        <h1 style="color: #2563eb;">Welcome to QuizLink</h1>
        <p>Hello ${safeName},</p>
        <p>I'm Lazare, the creator of QuizLink.</p>
        <p>I'm really glad to have you here.</p>
        <p>I built QuizLink to make quiz creation simpler, faster and more enjoyable — whether you're studying, running a class, testing knowledge, or sharing an activity.</p>
        <p>Your account is ready, and you currently have <strong>${coinBalance}</strong> coin${coinBalance === 1 ? "" : "s"} to try AI-powered quiz generation.</p>
        <p>The simplest next step: create your first quiz, share the link, and watch the responses come in.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${createUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Create my first quiz</a>
        </div>
        <p style="word-break: break-all; color: #6b7280; font-size: 14px;">Or open this link: ${createUrl}</p>
        <p>If you have an idea, feedback, or a bug to share, just hit reply to this email — it helps me improve QuizLink a lot.</p>
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">See you soon,<br>Lazare<br>Creator of QuizLink</p>
      </body>
    </html>
  `;

  return sendEmail({ to, subject, html, from: getWelcomeFromEmail() });
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
  from?: string;
}) {
  try {
    await transporter.sendMail({
      from: from ?? getFromEmail(),
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
      ? "Vérifie ton adresse email - QuizLink"
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
        <h1 style="color: #2563eb;">Vérifie ton adresse email</h1>
        <p>Salut,</p>
        <p>Merci de t'être inscrit sur QuizLink. Pour activer ton compte, utilise le code de vérification suivant :</p>
        <div style="background-color: #f3f4f6; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h2 style="color: #2563eb; font-size: 32px; letter-spacing: 4px; margin: 0;">${code}</h2>
        </div>
        <p>Ce code expire dans 15 minutes.</p>
        <p>Si tu n'as pas créé de compte, tu peux ignorer cet email.</p>
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
      ? "Réinitialise ton mot de passe - QuizLink"
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
        <h1 style="color: #2563eb;">Réinitialise ton mot de passe</h1>
        <p>Salut,</p>
        <p>Tu as demandé à réinitialiser ton mot de passe. Clique sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Réinitialiser le mot de passe</a>
        </div>
        <p>Ou copie ce lien dans ton navigateur :</p>
        <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${resetUrl}</p>
        <p>Ce lien expire dans 1 heure.</p>
        <p>Si tu n'as pas demandé de réinitialisation, tu peux ignorer cet email.</p>
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
        <p>Tu as demandé à changer ton adresse email. Utilise le code de vérification suivant :</p>
        <div style="background-color: #f3f4f6; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h2 style="color: #2563eb; font-size: 32px; letter-spacing: 4px; margin: 0;">${code}</h2>
        </div>
        <p>Ce code expire dans 15 minutes.</p>
        <p>Si tu n'as pas demandé de changement d'email, tu peux ignorer cet email.</p>
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
