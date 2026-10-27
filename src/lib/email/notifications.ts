/**
 * High-level notification dispatchers for Carbex.
 *
 * Implements:
 * 1. Feature A: Seller purchase alerts.
 * 2. Feature B: Admin verification alerts.
 *
 * All functions execute safely: errors are logged and caught so that caller
 * operations (purchases, submissions) are never rolled back or failed due to email errors.
 */

import { getEmailConfig } from "./config";
import { emailService } from "./service";
import {
  AdminVerificationNotificationData,
  EmailSendResult,
  SellerPurchaseNotificationData,
} from "./types";
import { renderAdminVerificationEmail } from "./templates/admin-verification";
import { renderSellerPurchaseEmail } from "./templates/seller-purchase";

/**
 * Feature A: Notify a Seller when their carbon credits are purchased.
 *
 * Triggers after the purchase has been successfully committed.
 * Uses transactionId for idempotency to avoid duplicate notifications on retries.
 */
export async function notifySellerOfPurchase(
  data: SellerPurchaseNotificationData
): Promise<EmailSendResult> {
  try {
    const config = getEmailConfig();
    const rendered = renderSellerPurchaseEmail(data, config.appUrl);

    const idempotencyKey = `seller_purchase:${data.transactionId}:${data.sellerEmail}`;

    const result = await emailService.send({
      to: data.sellerEmail,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      idempotencyKey,
      category: "seller_purchase",
    });

    return result;
  } catch (err: any) {
    console.error(
      `[Carbex Email] Unexpected error notifying seller (${data.sellerEmail}):`,
      err?.message || err
    );
    return {
      success: false,
      error: err?.message || "UNEXPECTED_ERROR",
    };
  }
}

/**
 * Feature B: Notify the Admin when a new verification request is submitted.
 *
 * Triggers after the project and documents are successfully persisted.
 * Configured recipient defaults to sricharanpusarla@gmail.com.
 * Uses requestId (projectId) for idempotency to avoid duplicate notifications.
 */
export async function notifyAdminOfVerificationRequest(
  data: AdminVerificationNotificationData
): Promise<EmailSendResult> {
  try {
    const config = getEmailConfig();
    const rendered = renderAdminVerificationEmail(data, config.appUrl);

    const idempotencyKey = `admin_verification:${data.requestId}`;

    const result = await emailService.send({
      to: config.adminNotificationEmail,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      idempotencyKey,
      category: "admin_verification",
    });

    return result;
  } catch (err: any) {
    console.error(
      `[Carbex Email] Unexpected error notifying admin (${data.requestId}):`,
      err?.message || err
    );
    return {
      success: false,
      error: err?.message || "UNEXPECTED_ERROR",
    };
  }
}
