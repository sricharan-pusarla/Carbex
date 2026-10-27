/**
 * Safe Email Delivery & Connection Verification Tool for Carbex.
 *
 * Usage:
 *   npx tsx scripts/test-email-delivery.ts
 *     -> Checks SMTP configuration and tests connection authentication with the provider.
 *
 *   npx tsx scripts/test-email-delivery.ts <authorized-recipient-email>
 *     -> Verifies connection AND dispatches an authorized test message to the specified recipient.
 *
 * This tool never emails real users without explicit argument authorization.
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { emailService } from "../src/lib/email/service";
import { getEmailConfig } from "../src/lib/email/config";

async function main() {
  const args = process.argv.slice(2);
  const targetRecipient = args[0]?.trim();

  console.log("\n========================================================");
  console.log(" CARBEX SMTP DELIVERY VERIFICATION TOOL");
  console.log("========================================================\n");

  const config = getEmailConfig();

  console.log("Current Environment Settings:");
  console.log(`  - Admin Recipient: ${config.adminNotificationEmail}`);
  console.log(`  - From Address:    "${config.fromName}" <${config.fromEmail}>`);
  console.log(`  - App URL:         ${config.appUrl}`);
  console.log(`  - Environment:     ${config.isProduction ? "PRODUCTION" : "DEVELOPMENT"}`);
  console.log(
    `  - SMTP Configured: ${config.smtp ? `YES (${config.smtp.service || config.smtp.host}:${config.smtp.port})` : "NO"}`
  );

  if (config.smtp) {
    console.log(`  - SMTP User:       ${config.smtp.user ? config.smtp.user : "(none)"}`);
    console.log(`  - SMTP Secure:     ${config.smtp.secure ? "true (SSL/TLS)" : "false (STARTTLS)"}`);
  }

  console.log("\nStep 1: Testing SMTP Connection & Authentication...");
  const verifyResult = await emailService.verifyConnection();

  if (!verifyResult.configured) {
    console.log("\n[STATUS: NOT CONFIGURED]");
    console.log(`  Reason: ${verifyResult.error}`);
    console.log("\nTo enable real email delivery:");
    console.log("  1. Open your .env file.");
    console.log("  2. Provide valid SMTP credentials (e.g. Gmail App Password, Resend, or SendGrid).");
    console.log("  3. Run this script again.\n");
    process.exit(0);
  }

  if (!verifyResult.success) {
    console.error("\n[STATUS: CONNECTION FAILED]");
    console.error(`  Error: ${verifyResult.error}`);
    console.error("\nPlease verify your SMTP host, port, username, and password / app password.\n");
    process.exit(1);
  }

  console.log(`[STATUS: SUCCESS] Connected and authenticated with ${verifyResult.provider}!`);

  if (!targetRecipient) {
    console.log("\nStep 2: Sending Test Message...");
    console.log("  Notice: No recipient email was provided.");
    console.log("  To send an authorized test email to verify inbox delivery, run:");
    console.log(`  npx tsx scripts/test-email-delivery.ts <your-email@example.com>\n`);
    process.exit(0);
  }

  console.log(`\nStep 2: Sending Authorized Test Message to ${targetRecipient}...`);
  const sendResult = await emailService.sendTestEmail(targetRecipient);

  if (sendResult.success) {
    console.log("\n[STATUS: TEST EMAIL DELIVERED]");
    console.log(`  MessageId: ${sendResult.messageId}`);
    console.log(`  Check the inbox of "${targetRecipient}" (and spam folder if not yet verified).\n`);
  } else {
    console.error("\n[STATUS: DELIVERY FAILED]");
    console.error(`  Error: ${sendResult.error}`);
    console.error(`  Reason: ${sendResult.reason || "Provider rejected delivery"}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error in test-email-delivery:", err);
  process.exit(1);
});
