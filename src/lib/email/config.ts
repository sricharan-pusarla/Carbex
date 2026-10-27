/**
 * Centralized email configuration for Carbex.
 *
 * Configures the administrator recipient, sender address, and email provider settings.
 * Defaults the admin notification recipient to sricharanpusarla@gmail.com while allowing
 * environment-level overrides.
 */

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  service?: string;
}

export interface EmailConfig {
  adminNotificationEmail: string;
  fromEmail: string;
  fromName: string;
  appUrl: string;
  isProduction: boolean;
  allowDevPreview: boolean;
  smtp?: SmtpConfig;
}

export function getEmailConfig(): EmailConfig {
  const isProduction = process.env.NODE_ENV === "production";

  const adminNotificationEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || "sricharanpusarla@gmail.com";

  const appUrl =
    process.env.APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000";

  const fromEmail = process.env.EMAIL_FROM?.trim() || "notifications@carbex.demo";
  const fromName = process.env.EMAIL_FROM_NAME?.trim() || "Carbex Carbon Exchange";

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpService = process.env.SMTP_SERVICE?.trim();
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASSWORD?.trim();

  // Support direct provider API key shortcuts
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const sendgridApiKey = process.env.SENDGRID_API_KEY?.trim();

  let resolvedSmtp: SmtpConfig | undefined = undefined;

  if (resendApiKey) {
    resolvedSmtp = {
      host: "smtp.resend.com",
      port: 587,
      secure: false,
      user: "resend",
      pass: resendApiKey,
    };
  } else if (sendgridApiKey) {
    resolvedSmtp = {
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      user: "apikey",
      pass: sendgridApiKey,
    };
  } else if (smtpHost || smtpService) {
    resolvedSmtp = {
      host: smtpHost || (smtpService === "gmail" ? "smtp.gmail.com" : ""),
      port: smtpPort,
      secure: smtpSecure,
      user: smtpUser,
      pass: smtpPass,
      service: smtpService,
    };
  }

  // Explicit dev preview mode: allowed in development only when SMTP is unconfigured
  const allowDevPreview = !isProduction && (process.env.EMAIL_DEV_PREVIEW === "true" || !resolvedSmtp);

  return {
    adminNotificationEmail,
    fromEmail,
    fromName,
    appUrl: appUrl.replace(/\/+$/, ""),
    isProduction,
    allowDevPreview,
    smtp: resolvedSmtp,
  };
}
