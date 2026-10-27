import { AdminVerificationNotificationData } from "../types";
import { escapeHtml, formatEmailDate } from "../utils";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function renderAdminVerificationEmail(
  data: AdminVerificationNotificationData,
  appUrl: string
): RenderedEmail {
  const formattedDate = formatEmailDate(data.submittedAt);
  const reviewUrl = `${appUrl}/admin/verify/${data.requestId}`;

  const subject = "New Verification Request Requires Review – Carbex";

  const text = `Hello Admin,

A new verification request has been submitted on Carbex and requires your review.

Request details:
Request ID: ${data.requestId}
Project: ${data.projectName}
Submitted by: ${data.applicantName}${data.applicantEmail ? ` (${data.applicantEmail})` : ""}
Request type: ${data.requestType}
Submitted on: ${formattedDate}
Status: ${data.status}

Please log in to the Carbex admin dashboard to review the request and take the necessary action:
${reviewUrl}

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
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
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
      color: #94a3b8;
      font-size: 14px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: #fef3c7;
      color: #92400e;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
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
      background: #f8fafc;
      border-left: 4px solid #2563eb;
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .details-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e40af;
      margin-bottom: 16px;
    }
    .button-wrapper {
      text-align: center;
      margin: 32px 0 24px 0;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      padding: 12px 28px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);
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
      <h1>Carbex Administration</h1>
      <p>Verification & Registry Auditing Console</p>
    </div>
    <div class="content">
      <div class="greeting">Hello Admin,</div>
      <p class="intro">
        A new verification request has been submitted on Carbex and requires your review.
      </p>

      <div class="details-box">
        <div class="details-title">Request Details</div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px; font-weight: 500;">Request ID</td>
            <td style="padding: 6px 0; color: #475569; font-size: 13px; font-family: monospace; text-align: right;">${escapeHtml(data.requestId)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px; font-weight: 500;">Project</td>
            <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${escapeHtml(data.projectName)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px; font-weight: 500;">Submitted By</td>
            <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">
              ${escapeHtml(data.applicantName)}
              ${data.applicantEmail ? `<br/><span style="font-size: 12px; color: #64748b; font-weight: normal;">${escapeHtml(data.applicantEmail)}</span>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px; font-weight: 500;">Request Type</td>
            <td style="padding: 6px 0; color: #0f172a; font-size: 14px; text-align: right;">${escapeHtml(data.requestType)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px; font-weight: 500;">Submitted On</td>
            <td style="padding: 6px 0; color: #0f172a; font-size: 14px; text-align: right;">${escapeHtml(formattedDate)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px; font-weight: 500;">Status</td>
            <td style="padding: 6px 0; text-align: right;">
              <span class="badge">${escapeHtml(data.status)}</span>
            </td>
          </tr>
          ${data.totalCredits ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 14px; font-weight: 500;">Claimed Credits</td>
            <td style="padding: 6px 0; color: #0f172a; font-size: 14px; text-align: right;">${escapeHtml(data.totalCredits.toLocaleString())} tCO₂e</td>
          </tr>` : ""}
        </table>
      </div>

      <p style="font-size: 14px; color: #475569; line-height: 1.5;">
        Please log in to the Carbex admin dashboard to review the submitted documentation (satellite imagery, land deeds, and project methodologies) and take the necessary verification action.
      </p>

      <div class="button-wrapper">
        <a href="${escapeHtml(reviewUrl)}" class="button" target="_blank" rel="noopener noreferrer">
          Review Verification Request
        </a>
      </div>

      <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
        Regards,<br />
        <strong>The Carbex Team</strong>
      </p>
    </div>
    <div class="footer">
      Automated Administrator Notification · Carbex Carbon Credit Registry & Trading Platform<br />
      Recipient: sricharanpusarla@gmail.com
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
}
