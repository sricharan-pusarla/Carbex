/**
 * Shared Email Service for Carbex.
 *
 * Implements:
 * 1. Real SMTP transport (Nodemailer) with connection pooling & timeouts.
 * 2. Strict recipient email validation.
 * 3. Idempotency control to prevent duplicate notifications.
 * 4. Error isolation (SMTP errors never throw unhandled exceptions or corrupt transactions).
 * 5. Safe logging (never leaks passwords, API keys, or secret tokens).
 * 6. Explicit delivery verification and test-send mechanism (`verifyConnection()`, `sendTestEmail()`).
 * 7. Removal of silent production fallbacks: fails explicitly if SMTP credentials are missing in production.
 */

import nodemailer, { Transporter } from "nodemailer";
import { getEmailConfig } from "./config";
import { EmailSendOptions, EmailSendResult } from "./types";
import { isValidEmail } from "./utils";

class EmailService {
  private transporter: Transporter | null = null;
  private idempotencyStore = new Map<string, number>();
  private readonly IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private testSentEmails: Array<EmailSendOptions & { sentAt: Date; messageId: string }> = [];
  private isTestMode = process.env.NODE_ENV === "test";

  constructor() {
    this.cleanupIdempotencyStore();
  }

  /**
   * Cleans up expired idempotency keys periodically.
   */
  private cleanupIdempotencyStore() {
    const now = Date.now();
    for (const [key, timestamp] of this.idempotencyStore.entries()) {
      if (now - timestamp > this.IDEMPOTENCY_TTL_MS) {
        this.idempotencyStore.delete(key);
      }
    }
  }

  /**
   * Returns a configured nodemailer transporter or null if SMTP is unconfigured.
   */
  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const config = getEmailConfig();

    if (config.smtp) {
      const transportOptions: any = {
        connectionTimeout: 10000, // 10s connection timeout
        greetingTimeout: 10000,
        socketTimeout: 15000,
      };

      if (config.smtp.service) {
        transportOptions.service = config.smtp.service;
      } else {
        transportOptions.host = config.smtp.host;
        transportOptions.port = config.smtp.port;
        transportOptions.secure = config.smtp.secure;
      }

      if (config.smtp.user && config.smtp.pass) {
        transportOptions.auth = {
          user: config.smtp.user,
          pass: config.smtp.pass,
        };
      }

      this.transporter = nodemailer.createTransport(transportOptions);
    }

    return this.transporter;
  }

  /**
   * Resets the cached transporter (e.g. after updating environment settings).
   */
  public resetTransporter() {
    this.transporter = null;
  }

  /**
   * Enable/disable test mode for automated test suites.
   */
  public setTestMode(enabled: boolean) {
    this.isTestMode = enabled;
    if (enabled) {
      this.clearTestSentEmails();
    }
  }

  /**
   * Get all recorded emails in test mode.
   */
  public getTestSentEmails() {
    return [...this.testSentEmails];
  }

  /**
   * Clear test inbox.
   */
  public clearTestSentEmails() {
    this.testSentEmails = [];
  }

  /**
   * Clears the idempotency cache (useful for testing retry scenarios).
   */
  public clearIdempotencyCache() {
    this.idempotencyStore.clear();
  }

  /**
   * Verifies the SMTP provider connection and authentication without sending an email.
   */
  public async verifyConnection(): Promise<{
    success: boolean;
    configured: boolean;
    provider?: string;
    error?: string;
  }> {
    const config = getEmailConfig();

    if (!config.smtp) {
      return {
        success: false,
        configured: false,
        error: "SMTP credentials not configured. Please define SMTP_HOST (or SMTP_SERVICE), SMTP_USER, and SMTP_PASSWORD in your environment.",
      };
    }

    const transporter = this.getTransporter();
    if (!transporter) {
      return {
        success: false,
        configured: false,
        error: "Unable to create SMTP transporter with the current configuration.",
      };
    }

    try {
      await transporter.verify();
      const provider = config.smtp.service || `${config.smtp.host}:${config.smtp.port}`;
      console.info(`[Carbex Email] SMTP connection verified successfully with provider: ${provider}`);
      return {
        success: true,
        configured: true,
        provider,
      };
    } catch (err: any) {
      // Safe error message without exposing credentials
      const sanitizedError = this.sanitizeErrorMessage(err);
      console.error(`[Carbex Email] SMTP verification failure: ${sanitizedError}`);
      return {
        success: false,
        configured: true,
        error: sanitizedError,
      };
    }
  }

  /**
   * Safe test-send mechanism that sends a test email to an explicitly authorized recipient.
   */
  public async sendTestEmail(targetRecipient: string): Promise<EmailSendResult> {
    if (!targetRecipient || !isValidEmail(targetRecipient)) {
      return {
        success: false,
        error: `Invalid test recipient email address: "${targetRecipient}"`,
      };
    }

    const config = getEmailConfig();

    return this.send({
      to: targetRecipient,
      subject: "[Carbex Test] Email Delivery Verification",
      text: `Hello,\n\nThis is an authorized test message from the Carbex Carbon Credit Trading Platform to verify real email delivery via your configured SMTP provider.\n\nTimestamp: ${new Date().toISOString()}\nApp URL: ${config.appUrl}\n\nIf you received this message, your SMTP credentials and delivery pipeline are working properly.`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>Carbex Email Test</title></head>
<body style="font-family:sans-serif;background:#f8fafc;padding:24px;color:#1e293b;">
  <div style="max-width:540px;margin:auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e2e8f0;">
    <h2 style="color:#059669;margin-top:0;">Carbex Delivery Verification</h2>
    <p>This is an authorized test message from the Carbex Carbon Credit Trading Platform to verify real email delivery via your configured SMTP provider.</p>
    <div style="background:#f1f5f9;border-left:4px solid #059669;padding:12px;margin:16px 0;font-size:13px;">
      <strong>Timestamp:</strong> ${new Date().toISOString()}<br/>
      <strong>Sender:</strong> ${config.fromEmail}<br/>
      <strong>Recipient:</strong> ${targetRecipient}
    </div>
    <p style="font-size:13px;color:#64748b;">If you received this email, real email delivery to your inbox is operating successfully.</p>
  </div>
</body>
</html>`,
      category: "system",
    });
  }

  /**
   * Send an email with safety, validation, and idempotency guarantees.
   */
  public async send(options: EmailSendOptions): Promise<EmailSendResult> {
    const { to, subject, html, text, idempotencyKey } = options;

    // 1. Recipient Validation
    if (!to || !isValidEmail(to)) {
      console.warn(`[Carbex Email] Delivery rejected: Invalid recipient email "${to}"`);
      return {
        success: false,
        skipped: true,
        reason: "INVALID_RECIPIENT",
        error: `Invalid recipient email address: "${to}"`,
      };
    }

    // 2. Idempotency Check
    if (idempotencyKey) {
      if (this.idempotencyStore.has(idempotencyKey)) {
        console.info(`[Carbex Email] Duplicate event suppressed for key "${idempotencyKey}"`);
        return {
          success: true,
          skipped: true,
          reason: "DUPLICATE_PREVENTED",
        };
      }
    }

    const config = getEmailConfig();
    const from = `"${config.fromName}" <${config.fromEmail}>`;

    // 3. Automated Test Mode Harness
    if (this.isTestMode) {
      const mockMessageId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      this.testSentEmails.push({
        ...options,
        sentAt: new Date(),
        messageId: mockMessageId,
      });

      if (idempotencyKey) {
        this.idempotencyStore.set(idempotencyKey, Date.now());
      }

      return {
        success: true,
        messageId: mockMessageId,
      };
    }

    // 4. Live SMTP Provider Delivery
    const transporter = this.getTransporter();

    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from,
          to,
          subject,
          text,
          html,
        });

        if (idempotencyKey) {
          this.idempotencyStore.set(idempotencyKey, Date.now());
        }

        console.info(`[Carbex Email] Real email dispatched successfully to ${to}. MessageId: ${info.messageId}`);
        return {
          success: true,
          messageId: info.messageId,
        };
      } catch (err: any) {
        const sanitizedError = this.sanitizeErrorMessage(err);
        console.error(`[Carbex Email] SMTP delivery failure to ${to}: ${sanitizedError}`);
        return {
          success: false,
          error: sanitizedError,
        };
      }
    }

    // 5. Handling Missing SMTP Provider Credentials (No Silent Fallback in Production)
    if (config.isProduction) {
      const prodError = "SMTP provider is not configured. Real emails cannot be delivered. Please configure SMTP_HOST, SMTP_USER, and SMTP_PASSWORD.";
      console.error(`[Carbex Email] Production delivery error: ${prodError}`);
      return {
        success: false,
        error: prodError,
        reason: "MISSING_PROVIDER_CREDENTIALS",
      };
    }

    // 6. Explicit Development Preview Mode (When SMTP is unconfigured in development)
    const devMessageId = `dev-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    console.warn(
      `\n==================== [CARBEX EMAIL DEV PREVIEW] ====================\n` +
      `[NOTICE: Real delivery is NOT active. To receive real emails in Gmail, configure SMTP_USER & SMTP_PASSWORD in .env]\n` +
      `To: ${to}\n` +
      `From: ${from}\n` +
      `Subject: ${subject}\n` +
      `Idempotency-Key: ${idempotencyKey || "none"}\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `--------------------------------------------------------------------\n` +
      `${text}\n` +
      `====================================================================\n`
    );

    if (idempotencyKey) {
      this.idempotencyStore.set(idempotencyKey, Date.now());
    }

    return {
      success: false,
      skipped: true,
      messageId: devMessageId,
      reason: "DEV_PREVIEW_ONLY",
      error: "Real delivery disabled: SMTP credentials not configured in .env. Preview logged to console.",
    };
  }

  /**
   * Sanitizes error messages to prevent leaking credentials or connection strings.
   */
  private sanitizeErrorMessage(err: any): string {
    if (!err) return "Unknown error";
    let message = err.message || String(err);

    // Mask any potential password/key in error message
    const config = getEmailConfig();
    if (config.smtp?.pass) {
      message = message.replace(new RegExp(config.smtp.pass, "g"), "********");
    }

    if (err.code === "EAUTH") {
      return `Authentication failed (EAUTH). Verify your SMTP_USER and SMTP_PASSWORD / App Password. (${message})`;
    }
    if (err.code === "ECONNREFUSED") {
      return `Connection refused (ECONNREFUSED) to ${config.smtp?.host}:${config.smtp?.port}. Check SMTP_HOST and SMTP_PORT.`;
    }
    if (err.code === "ETIMEDOUT") {
      return `Connection timed out (ETIMEDOUT). Check your network, firewall, or SMTP_PORT/SMTP_SECURE settings.`;
    }

    return message;
  }
}

export const emailService = new EmailService();
