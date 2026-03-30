import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ---------------------------------------------------------------------------
// Order Confirmation Email
// ---------------------------------------------------------------------------

export interface OrderConfirmationItem {
    title: string;
    quantity: number;
    price: number; // in cents
    thumbnail?: string | null;
}

export interface OrderConfirmationData {
    orderNumber: string;
    items: OrderConfirmationItem[];
    total: number; // in cents
    firstName?: string | null;
}

/**
 * Send order confirmation email after successful Stripe payment.
 */
export async function sendOrderConfirmationEmail(
    email: string,
    data: OrderConfirmationData
) {
    try {
        const { data: result, error } = await resend.emails.send({
            from: "My Store <onboarding@resend.dev>",
            to: email,
            subject: `Order Confirmed #${data.orderNumber} - My Store`,
            html: getOrderConfirmationTemplate(data),
        });

        if (error) {
            console.error("Error sending order confirmation email:", error);
            return { success: false, error };
        }

        return { success: true, data: result };
    } catch (error) {
        console.error("Error sending order confirmation email:", error);
        return { success: false, error };
    }
}

function getOrderConfirmationTemplate(data: OrderConfirmationData): string {
    const { orderNumber, items, total, firstName } = data;

    const itemRows = items
        .map(
            (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; vertical-align: middle;">
            ${
                item.thumbnail
                    ? `<img src="${item.thumbnail}" alt="${item.title}" width="48" height="48"
                 style="border-radius: 6px; object-fit: cover; vertical-align: middle; margin-right: 12px;" />`
                    : ""
            }
            <span style="color: #1a1a1a; font-size: 14px; font-weight: 500; vertical-align: middle;">${item.title}</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: center; color: #6b7280; font-size: 14px; vertical-align: middle;">
            x${item.quantity}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right; color: #1a1a1a; font-size: 14px; font-weight: 600; vertical-align: middle;">
            $${((item.price * item.quantity) / 100).toFixed(2)}
          </td>
        </tr>`
        )
        .join("");

    const greeting = firstName ? `Hello ${firstName},` : "Hello,";
    const storeUrl = process.env.NEXT_PUBLIC_URL ?? "#";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmed</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#C8102E 0%,#8b0000 100%);padding:40px;text-align:center;border-radius:8px 8px 0 0;">
              <p style="margin:0 0 8px 0;color:rgba(255,255,255,0.85);font-size:14px;letter-spacing:1px;text-transform:uppercase;">My Store</p>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Order Confirmed!</h1>
              <p style="margin:12px 0 0 0;color:rgba(255,255,255,0.9);font-size:16px;">Thank you for your purchase.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <p style="margin:0 0 8px 0;color:#374151;font-size:16px;line-height:1.6;">${greeting}</p>
              <p style="margin:0 0 28px 0;color:#374151;font-size:16px;line-height:1.6;">
                Your order has been received and is being processed. Here's a summary:
              </p>

              <!-- Order number badge -->
              <div style="margin:0 0 28px 0;padding:16px 20px;background-color:#fff5f5;border:1px solid #fecaca;border-radius:8px;display:inline-block;width:100%;box-sizing:border-box;">
                <p style="margin:0;color:#6b7280;font-size:13px;">Order Number</p>
                <p style="margin:4px 0 0 0;color:#C8102E;font-size:22px;font-weight:700;letter-spacing:1px;">#${orderNumber}</p>
              </div>

              <!-- Items table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <thead>
                  <tr>
                    <th style="padding:8px 0;text-align:left;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-bottom:2px solid #e5e7eb;">Product</th>
                    <th style="padding:8px 0;text-align:center;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-bottom:2px solid #e5e7eb;">Qty</th>
                    <th style="padding:8px 0;text-align:right;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-bottom:2px solid #e5e7eb;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:16px 20px;background-color:#f9fafb;border-radius:8px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#374151;font-size:16px;font-weight:700;">Total</td>
                        <td style="text-align:right;color:#C8102E;font-size:20px;font-weight:700;">$${(total / 100).toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${storeUrl}/orders"
                       style="display:inline-block;background:linear-gradient(135deg,#C8102E 0%,#8b0000 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:16px;box-shadow:0 4px 12px rgba(200,16,46,0.3);">
                      View My Orders
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">
                If you have any questions about your order, feel free to contact our support team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                This email was sent by My Store<br />
                © ${new Date().getFullYear()} My Store. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ---------------------------------------------------------------------------
// Return Request Result Email
// ---------------------------------------------------------------------------

export interface ReturnResultData {
    orderNumber: string;
    firstName?: string | null;
    approved: boolean;
    adminNote?: string | null;
    total: number; // in cents
}

export async function sendReturnResultEmail(
    email: string,
    data: ReturnResultData
) {
    try {
        const subject = data.approved
            ? `Return Approved #${data.orderNumber} - My Store`
            : `Return Request Update #${data.orderNumber} - My Store`;

        const { data: result, error } = await resend.emails.send({
            from: "My Store <onboarding@resend.dev>",
            to: email,
            subject,
            html: getReturnResultTemplate(data),
        });

        if (error) {
            console.error("Error sending return result email:", error);
            return { success: false, error };
        }
        return { success: true, data: result };
    } catch (error) {
        console.error("Error sending return result email:", error);
        return { success: false, error };
    }
}

function getReturnResultTemplate(data: ReturnResultData): string {
    const { orderNumber, firstName, approved, adminNote, total } = data;
    const greeting = firstName ? `Hello ${firstName},` : "Hello,";
    const storeUrl = process.env.NEXT_PUBLIC_URL ?? "#";

    const statusColor = approved ? "#059669" : "#C8102E";
    const statusBg = approved ? "#ecfdf5" : "#fef2f2";
    const statusBorder = approved ? "#a7f3d0" : "#fecaca";
    const statusTitle = approved ? "Return Approved" : "Return Request Rejected";
    const statusIcon = approved ? "&#10003;" : "&#10007;";

    const message = approved
        ? `Your return request for order <strong>#${orderNumber}</strong> has been approved. A refund of <strong>$${(total / 100).toFixed(2)}</strong> will be issued to your original payment method.`
        : `Your return request for order <strong>#${orderNumber}</strong> has been reviewed and unfortunately could not be approved at this time.`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${statusTitle}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${statusColor} 0%,${approved ? '#047857' : '#8b0000'} 100%);padding:40px;text-align:center;border-radius:8px 8px 0 0;">
              <p style="margin:0 0 8px 0;color:rgba(255,255,255,0.85);font-size:14px;letter-spacing:1px;text-transform:uppercase;">My Store</p>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">${statusTitle}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px 0;color:#374151;font-size:16px;line-height:1.6;">${greeting}</p>

              <!-- Status Badge -->
              <div style="margin:0 0 24px 0;padding:20px;background-color:${statusBg};border:1px solid ${statusBorder};border-radius:8px;text-align:center;">
                <span style="font-size:32px;color:${statusColor};">${statusIcon}</span>
                <p style="margin:8px 0 0 0;color:${statusColor};font-size:18px;font-weight:700;">${statusTitle}</p>
                <p style="margin:4px 0 0 0;color:#6b7280;font-size:13px;">Order #${orderNumber}</p>
              </div>

              <p style="margin:0 0 20px 0;color:#374151;font-size:15px;line-height:1.6;">
                ${message}
              </p>

              ${adminNote ? `
              <div style="margin:0 0 24px 0;padding:16px;background-color:#f9fafb;border-left:3px solid ${statusColor};border-radius:4px;">
                <p style="margin:0 0 4px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Note from our team</p>
                <p style="margin:0;color:#374151;font-size:14px;line-height:1.5;">${adminNote}</p>
              </div>` : ''}

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${storeUrl}/orders"
                       style="display:inline-block;background:linear-gradient(135deg,#C8102E 0%,#8b0000 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:16px;box-shadow:0 4px 12px rgba(200,16,46,0.3);">
                      View My Orders
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">
                If you have any questions, feel free to contact our support team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                This email was sent by My Store<br />
                &copy; ${new Date().getFullYear()} My Store. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ---------------------------------------------------------------------------
// Order Shipped / Tracking Email
// ---------------------------------------------------------------------------

export interface OrderShippedData {
    orderNumber: string;
    firstName?: string | null;
    trackingNumber?: string | null;
}

export async function sendOrderShippedEmail(
    email: string,
    data: OrderShippedData
) {
    try {
        const { data: result, error } = await resend.emails.send({
            from: "My Store <onboarding@resend.dev>",
            to: email,
            subject: `Your Order #${data.orderNumber} Has Been Shipped! - My Store`,
            html: getOrderShippedTemplate(data),
        });

        if (error) {
            console.error("Error sending shipped email:", error);
            return { success: false, error };
        }
        return { success: true, data: result };
    } catch (error) {
        console.error("Error sending shipped email:", error);
        return { success: false, error };
    }
}

function getOrderShippedTemplate(data: OrderShippedData): string {
    const { orderNumber, firstName, trackingNumber } = data;
    const greeting = firstName ? `Hello ${firstName},` : "Hello,";
    const storeUrl = process.env.NEXT_PUBLIC_URL ?? "#";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Shipped</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9 0%,#0369a1 100%);padding:40px;text-align:center;border-radius:8px 8px 0 0;">
              <p style="margin:0 0 8px 0;color:rgba(255,255,255,0.85);font-size:14px;letter-spacing:1px;text-transform:uppercase;">My Store</p>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Your Order Is On Its Way!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px 0;color:#374151;font-size:16px;line-height:1.6;">${greeting}</p>
              <p style="margin:0 0 24px 0;color:#374151;font-size:16px;line-height:1.6;">
                Great news! Your order <strong>#${orderNumber}</strong> has been shipped and is on its way to you.
              </p>

              ${trackingNumber ? `
              <!-- Tracking Number Card -->
              <div style="margin:0 0 28px 0;padding:24px;background-color:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;text-align:center;">
                <p style="margin:0 0 4px 0;color:#0369a1;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Tracking Number</p>
                <p style="margin:0;color:#0c4a6e;font-size:24px;font-weight:700;letter-spacing:2px;font-family:monospace;">${trackingNumber}</p>
                <p style="margin:12px 0 0 0;color:#6b7280;font-size:13px;">Use this number to track your shipment on the carrier's website.</p>
              </div>
              ` : `
              <div style="margin:0 0 28px 0;padding:20px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;text-align:center;">
                <p style="margin:0;color:#6b7280;font-size:14px;">Tracking information will be available shortly.</p>
              </div>
              `}

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${storeUrl}/orders"
                       style="display:inline-block;background:linear-gradient(135deg,#C8102E 0%,#8b0000 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:16px;box-shadow:0 4px 12px rgba(200,16,46,0.3);">
                      View My Orders
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">
                If you have any questions about your delivery, feel free to contact our support team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                This email was sent by My Store<br />
                &copy; ${new Date().getFullYear()} My Store. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ---------------------------------------------------------------------------
// Stock Alert Email
// ---------------------------------------------------------------------------

export interface StockAlertData {
    productTitle: string;
    productUrl: string;
    thumbnail?: string | null;
    firstName?: string | null;
}

export async function sendStockAlertEmail(
    email: string,
    data: StockAlertData
) {
    try {
        const { data: result, error } = await resend.emails.send({
            from: "My Store <onboarding@resend.dev>",
            to: email,
            subject: `Back in Stock: ${data.productTitle} - My Store`,
            html: getStockAlertTemplate(data),
        });

        if (error) {
            console.error("Error sending stock alert email:", error);
            return { success: false, error };
        }
        return { success: true, data: result };
    } catch (error) {
        console.error("Error sending stock alert email:", error);
        return { success: false, error };
    }
}

function getStockAlertTemplate(data: StockAlertData): string {
    const { productTitle, productUrl, thumbnail, firstName } = data;
    const greeting = firstName ? `Hello ${firstName},` : "Hello,";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Back in Stock</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#C8102E 0%,#8b0000 100%);padding:40px;text-align:center;border-radius:8px 8px 0 0;">
              <p style="margin:0 0 8px 0;color:rgba(255,255,255,0.85);font-size:14px;letter-spacing:1px;text-transform:uppercase;">My Store</p>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Back in Stock!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px 0;color:#374151;font-size:16px;line-height:1.6;">${greeting}</p>
              <p style="margin:0 0 24px 0;color:#374151;font-size:16px;line-height:1.6;">
                Great news! An item you were waiting for is now back in stock:
              </p>

              <!-- Product Card -->
              <div style="margin:0 0 28px 0;padding:20px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;text-align:center;">
                ${thumbnail ? `<img src="${thumbnail}" alt="${productTitle}" width="120" height="120" style="border-radius:8px;object-fit:cover;margin-bottom:12px;" />` : ''}
                <p style="margin:0;color:#1a1a1a;font-size:18px;font-weight:700;">${productTitle}</p>
              </div>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${productUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#C8102E 0%,#8b0000 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:16px;box-shadow:0 4px 12px rgba(200,16,46,0.3);">
                      Shop Now
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                Hurry — popular items sell out fast!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                You received this because you requested a stock alert.<br />
                &copy; ${new Date().getFullYear()} My Store. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ---------------------------------------------------------------------------
// Contact Form Email (sent to admin)
// ---------------------------------------------------------------------------

export interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export async function sendContactFormEmail(data: ContactFormData) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    try {
        const { data: result, error } = await resend.emails.send({
            from: "My Store <onboarding@resend.dev>",
            to: adminEmail,
            replyTo: data.email,
            subject: `[Contact] ${data.subject}`,
            html: getContactFormTemplate(data),
        });

        if (error) {
            console.error("Error sending contact email:", error);
            return { success: false, error };
        }
        return { success: true, data: result };
    } catch (error) {
        console.error("Error sending contact email:", error);
        return { success: false, error };
    }
}

function getContactFormTemplate(data: ContactFormData): string {
    const { name, email, subject, message } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Contact Message</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td style="background:linear-gradient(135deg,#1A1A1A 0%,#333 100%);padding:30px 40px;border-radius:8px 8px 0 0;">
              <p style="margin:0 0 4px 0;color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:1px;text-transform:uppercase;">New Contact Message</p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${subject}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 16px;background-color:#f9fafb;border-radius:8px 8px 0 0;border:1px solid #e5e7eb;border-bottom:none;">
                    <p style="margin:0 0 2px 0;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">From</p>
                    <p style="margin:0;color:#1a1a1a;font-size:15px;font-weight:600;">${name}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:0 0 8px 8px;">
                    <p style="margin:0 0 2px 0;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Email</p>
                    <a href="mailto:${email}" style="color:#C8102E;font-size:15px;font-weight:600;text-decoration:none;">${email}</a>
                  </td>
                </tr>
              </table>

              <div style="padding:20px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
                <p style="margin:0 0 8px 0;color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Message</p>
                <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;white-space:pre-wrap;">${message}</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}"
                       style="display:inline-block;background:linear-gradient(135deg,#C8102E 0%,#8b0000 100%);color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;">
                      Reply to ${name}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background-color:#f9fafb;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">This message was sent via the contact form on My Store</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ---------------------------------------------------------------------------
// Password Reset Email
// ---------------------------------------------------------------------------

/**
 * Send password reset email with token
 */
export async function sendResetPasswordEmail(email: string, token: string) {
    const resetUrl = `${process.env.NEXT_PUBLIC_URL}/reset-password?token=${token}`;

    try {
        const { data, error } = await resend.emails.send({
            from: "My Store <onboarding@resend.dev>", // Change to your verified domain
            to: email,
            subject: "Reset Your Password - My Store",
            html: getResetPasswordEmailTemplate(resetUrl),
        });

        if (error) {
            console.error("Error sending reset email:", error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Error sending reset email:", error);
        return { success: false, error };
    }
}

/**
 * HTML email template for password reset
 */
function getResetPasswordEmailTemplate(resetUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Reset Your Password</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Hello,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your My Store account. Click the button below to create a new password:
              </p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="margin: 0 0 20px 0; padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; word-break: break-all;">
                <a href="${resetUrl}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">${resetUrl}</a>
              </p>
              
              <div style="margin: 30px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Important:</strong> This link will expire in 15 minutes for security reasons.
                </p>
              </div>
              
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.6;">
                This email was sent by My Store<br>
                If you have any questions, please contact our support team.
              </p>
              
              <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} My Store. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
