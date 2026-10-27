import { SellerPurchaseNotificationData } from "../types";
import { escapeHtml, formatCurrency, formatEmailDate } from "../utils";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function renderSellerPurchaseEmail(
  data: SellerPurchaseNotificationData,
  appUrl: string
): RenderedEmail {
  const sellerDisplayName = data.sellerOrganization
    ? `${data.sellerName} (${data.sellerOrganization})`
    : data.sellerName;

  const formattedDate = formatEmailDate(data.purchaseDate);
  const formattedTotal = formatCurrency(data.totalAmount, data.currency || "USD");
  const dashboardUrl = `${appUrl}/seller`;
  const buyerDisplay = data.buyerName ? data.buyerName : "Verified Buyer";

  const subject = "Your Carbon Credits Have Been Purchased – Carbex";

  const text = `Hello ${sellerDisplayName},

Good news! Your carbon credits have been successfully purchased on Carbex.

Transaction details:
Project: ${data.projectName}
Credits purchased: ${data.quantity.toLocaleString()}
Total amount: ${formattedTotal}
Transaction ID: ${data.transactionId}
Purchase date: ${formattedDate}
Buyer: ${buyerDisplay}

You can visit your Carbex dashboard to review the transaction details:
${dashboardUrl}

Thank you for contributing to a more sustainable future.

Regards,
The Carbex Team
${appUrl}
`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 32px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #065f46 0%, #047857 100%);
      padding: 32px 24px;
      color: #ffffff;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0 0;
      color: #a7f3d0;
      font-size: 14px;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .intro {
      font-size: 15px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 24px;
    }
    .details-box {
      background: #f1f5f9;
      border-left: 4px solid #059669;
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .details-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #047857;
      margin-bottom: 16px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      color: #64748b;
      font-weight: 500;
    }
    .detail-value {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
    }
    .button-wrapper {
      text-align: center;
      margin: 32px 0 24px 0;
    }
    .button {
      display: inline-block;
      background-color: #059669;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      padding: 12px 28px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding: 20px 24px;
      background: #f8fafc;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Carbex</h1>
      <p>High-Integrity Carbon Credit Trading Platform</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${escapeHtml(sellerDisplayName)},</div>
      <p class="intro">
        Good news! Your carbon credits have been successfully purchased on Carbex.
      </p>

      <div class="details-box">
        <div class="details-title">Transaction Details</div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px; font-weight: 500;">Project</td>
            <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${escapeHtml(data.projectName)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px; font-weight: 500;">Credits Purchased</td>
            <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${escapeHtml(data.quantity.toLocaleString())} tCO₂e</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px; font-weight: 500;">Total Amount</td>
            <td style="padding: 6px 0; color: #047857; font-size: 15px; font-weight: 700; text-align: right;">${escapeHtml(formattedTotal)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px; font-weight: 500;">Transaction ID</td>
            <td style="padding: 6px 0; color: #475569; font-size: 13px; font-family: monospace; text-align: right;">${escapeHtml(data.transactionId)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px; font-weight: 500;">Purchase Date</td>
            <td style="padding: 6px 0; color: #0f172a; font-size: 14px; text-align: right;">${escapeHtml(formattedDate)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px; font-weight: 500;">Buyer</td>
            <td style="padding: 6px 0; color: #0f172a; font-size: 14px; text-align: right;">${escapeHtml(buyerDisplay)}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 14px; color: #475569; line-height: 1.5;">
        You can visit your Carbex dashboard to review the transaction details, view ledger range allocations, and manage your inventory.
      </p>

      <div class="button-wrapper">
        <a href="${escapeHtml(dashboardUrl)}" class="button" target="_blank" rel="noopener noreferrer">
          View Seller Dashboard
        </a>
      </div>

      <p style="font-size: 14px; color: #334155; margin-top: 24px;">
        Thank you for contributing to a more sustainable future.
      </p>
      <p style="font-size: 14px; color: #64748b; margin-top: 8px;">
        Regards,<br />
        <strong>The Carbex Team</strong>
      </p>
    </div>
    <div class="footer">
      This is an automated notification from Carbex.<br />
      © ${new Date().getFullYear()} Carbex Carbon Registry & Trading Platform. All rights reserved.
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
}
