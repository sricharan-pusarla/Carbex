/**
 * Email notification types and data contracts for Carbex.
 */

export interface EmailSendOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
  category?: "seller_purchase" | "admin_verification" | "system";
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  skipped?: boolean;
  reason?: string;
  error?: string;
}

export interface SellerPurchaseNotificationData {
  transactionId: string;
  sellerEmail: string;
  sellerName: string;
  sellerOrganization?: string | null;
  buyerName?: string | null;
  projectName: string;
  quantity: number;
  pricePerCredit: number;
  totalAmount: number;
  currency?: string;
  purchaseDate: Date;
}

export interface AdminVerificationNotificationData {
  requestId: string;
  projectName: string;
  applicantName: string;
  applicantEmail?: string | null;
  requestType: string;
  submittedAt: Date;
  status: string;
  totalCredits?: number;
  pricePerCredit?: number;
}
