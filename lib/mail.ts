import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type Locale = "tr" | "en";

const STORE_NAME = process.env.STORE_NAME || "My Store";
const FROM_EMAIL = `${STORE_NAME} <onboarding@resend.dev>`;

function formatPrice(kurus: number): string {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(kurus / 100);
}

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
    locale?: Locale;
}

export async function sendOrderConfirmationEmail(
    email: string,
    data: OrderConfirmationData
) {
    const locale = data.locale ?? "en";
    const subject =
        locale === "tr"
            ? `Siparişiniz Onaylandı #${data.orderNumber} - ${STORE_NAME}`
            : `Order Confirmed #${data.orderNumber} - ${STORE_NAME}`;
    try {
        const { data: result, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject,
            html: getOrderConfirmationTemplate(data, locale),
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

function getOrderConfirmationTemplate(data: OrderConfirmationData, locale: Locale): string {
    const { orderNumber, items, total, firstName } = data;

    const copy = {
        tr: {
            greeting: firstName ? `Merhaba ${firstName},` : "Merhaba,",
            tagline: STORE_NAME,
            title: "Siparişiniz Onaylandı!",
            subtitle: "Satın alımınız için teşekkür ederiz.",
            body: "Siparişiniz alındı ve işleme alındı. İşte sipariş özetiniz:",
            orderLabel: "Sipariş Numarası",
            colProduct: "Ürün",
            colQty: "Adet",
            colPrice: "Fiyat",
            totalLabel: "Toplam",
            cta: "Siparişlerimi Görüntüle",
            footer: `Bu e-posta ${STORE_NAME} tarafından gönderilmiştir.`,
            copyright: `© ${new Date().getFullYear()} ${STORE_NAME}. Tüm hakları saklıdır.`,
            support: "Siparişinizle ilgili herhangi bir sorunuz varsa destek ekibimizle iletişime geçebilirsiniz.",
        },
        en: {
            greeting: firstName ? `Hello ${firstName},` : "Hello,",
            tagline: STORE_NAME,
            title: "Order Confirmed!",
            subtitle: "Thank you for your purchase.",
            body: "Your order has been received and is being processed. Here's a summary:",
            orderLabel: "Order Number",
            colProduct: "Product",
            colQty: "Qty",
            colPrice: "Price",
            totalLabel: "Total",
            cta: "View My Orders",
            footer: `This email was sent by ${STORE_NAME}.`,
            copyright: `© ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.`,
            support: "If you have any questions about your order, feel free to contact our support team.",
        },
    }[locale];

    const storeUrl = process.env.NEXT_PUBLIC_URL ?? "#";

    const itemRows = items
        .map(
            (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; vertical-align: middle;">
            ${item.thumbnail ? `<img src="${item.thumbnail}" alt="${item.title}" width="48" height="48" style="border-radius: 6px; object-fit: cover; vertical-align: middle; margin-right: 12px;" />` : ""}
            <span style="color: #1a1a1a; font-size: 14px; font-weight: 500; vertical-align: middle;">${item.title}</span>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: center; color: #6b7280; font-size: 14px; vertical-align: middle;">x${item.quantity}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right; color: #1a1a1a; font-size: 14px; font-weight: 600; vertical-align: middle;">${formatPrice(item.price * item.quantity)}</td>
        </tr>`
        )
        .join("");

    return `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${copy.title}</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:linear-gradient(135deg,#C8102E 0%,#8b0000 100%);padding:40px;text-align:center;border-radius:8px 8px 0 0;">
            <p style="margin:0 0 8px 0;color:rgba(255,255,255,0.85);font-size:14px;letter-spacing:1px;text-transform:uppercase;">${copy.tagline}</p>
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">${copy.title}</h1>
            <p style="margin:12px 0 0 0;color:rgba(255,255,255,0.9);font-size:16px;">${copy.subtitle}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px 0;color:#374151;font-size:16px;line-height:1.6;">${copy.greeting}</p>
            <p style="margin:0 0 28px 0;color:#374151;font-size:16px;line-height:1.6;">${copy.body}</p>
            <div style="margin:0 0 28px 0;padding:16px 20px;background-color:#fff5f5;border:1px solid #fecaca;border-radius:8px;width:100%;box-sizing:border-box;">
              <p style="margin:0;color:#6b7280;font-size:13px;">${copy.orderLabel}</p>
              <p style="margin:4px 0 0 0;color:#C8102E;font-size:22px;font-weight:700;letter-spacing:1px;">#${orderNumber}</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <thead>
                <tr>
                  <th style="padding:8px 0;text-align:left;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-bottom:2px solid #e5e7eb;">${copy.colProduct}</th>
                  <th style="padding:8px 0;text-align:center;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-bottom:2px solid #e5e7eb;">${copy.colQty}</th>
                  <th style="padding:8px 0;text-align:right;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-bottom:2px solid #e5e7eb;">${copy.colPrice}</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="padding:16px 20px;background-color:#f9fafb;border-radius:8px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#374151;font-size:16px;font-weight:700;">${copy.totalLabel}</td>
                      <td style="text-align:right;color:#C8102E;font-size:20px;font-weight:700;">${formatPrice(total)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a href="${storeUrl}/orders" style="display:inline-block;background:linear-gradient(135deg,#C8102E 0%,#8b0000 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:16px;">${copy.cta}</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">${copy.support}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">${copy.footer}<br />${copy.copyright}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

// ---------------------------------------------------------------------------
// Return Request Pending Email
// ---------------------------------------------------------------------------

export interface ReturnPendingData {
    orderNumber: string;
    firstName?: string | null;
    locale?: Locale;
}

export async function sendReturnPendingEmail(
    email: string,
    data: ReturnPendingData
) {
    const locale = data.locale ?? "en";
    const subject =
        locale === "tr"
            ? `İade Talebiniz Alındı #${data.orderNumber} - ${STORE_NAME}`
            : `Return Request Received #${data.orderNumber} - ${STORE_NAME}`;
    try {
        const { data: result, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject,
            html: getReturnPendingTemplate(data, locale),
        });
        if (error) {
            console.error("Error sending return pending email:", error);
            return { success: false, error };
        }
        return { success: true, data: result };
    } catch (error) {
        console.error("Error sending return pending email:", error);
        return { success: false, error };
    }
}

function getReturnPendingTemplate(data: ReturnPendingData, locale: Locale): string {
    const { orderNumber, firstName } = data;
    const storeUrl = process.env.NEXT_PUBLIC_URL ?? "#";

    const copy = {
        tr: {
            greeting: firstName ? `Merhaba ${firstName},` : "Merhaba,",
            title: "İade Talebiniz Alındı",
            subtitle: "Talebiniz inceleme sürecine alındı.",
            body: `<strong>#${orderNumber}</strong> numaralı siparişiniz için iade talebinizi aldık. Ekibimiz talebinizi en kısa sürede inceleyecek ve size geri dönüş yapacaktır.`,
            statusTitle: "İnceleme Bekleniyor",
            statusSub: `Sipariş #${orderNumber}`,
            infoTitle: "Bilgi",
            infoBody: "İade talebiniz genellikle 1-3 iş günü içinde değerlendirilmektedir. Talebinizin sonucu e-posta ile bildirilecektir.",
            cta: "Siparişlerimi Görüntüle",
            support: "Herhangi bir sorunuz varsa destek ekibimizle iletişime geçebilirsiniz.",
            footer: `Bu e-posta ${STORE_NAME} tarafından gönderilmiştir.`,
            copyright: `© ${new Date().getFullYear()} ${STORE_NAME}. Tüm hakları saklıdır.`,
        },
        en: {
            greeting: firstName ? `Hello ${firstName},` : "Hello,",
            title: "Return Request Received",
            subtitle: "Your request is now under review.",
            body: `We have received your return request for order <strong>#${orderNumber}</strong>. Our team will review it as soon as possible and get back to you.`,
            statusTitle: "Pending Review",
            statusSub: `Order #${orderNumber}`,
            infoTitle: "Info",
            infoBody: "Return requests are typically reviewed within 1-3 business days. You will be notified by email once a decision has been made.",
            cta: "View My Orders",
            support: "If you have any questions, feel free to contact our support team.",
            footer: `This email was sent by ${STORE_NAME}.`,
            copyright: `© ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.`,
        },
    }[locale];

    return `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${copy.title}</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:linear-gradient(135deg,#f97316 0%,#c2410c 100%);padding:40px;text-align:center;border-radius:8px 8px 0 0;">
            <p style="margin:0 0 8px 0;color:rgba(255,255,255,0.85);font-size:14px;letter-spacing:1px;text-transform:uppercase;">${STORE_NAME}</p>
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">${copy.title}</h1>
            <p style="margin:12px 0 0 0;color:rgba(255,255,255,0.9);font-size:16px;">${copy.subtitle}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 20px 0;color:#374151;font-size:16px;line-height:1.6;">${copy.greeting}</p>
            <p style="margin:0 0 24px 0;color:#374151;font-size:16px;line-height:1.6;">${copy.body}</p>
            <div style="margin:0 0 28px 0;padding:20px;background-color:#fff7ed;border:1px solid #fed7aa;border-radius:8px;text-align:center;">
              <span style="font-size:32px;">&#9203;</span>
              <p style="margin:8px 0 0 0;color:#c2410c;font-size:18px;font-weight:700;">${copy.statusTitle}</p>
              <p style="margin:4px 0 0 0;color:#6b7280;font-size:13px;">${copy.statusSub}</p>
            </div>
            <div style="margin:0 0 24px 0;padding:16px;background-color:#f9fafb;border-left:3px solid #f97316;border-radius:4px;">
              <p style="margin:0 0 4px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">${copy.infoTitle}</p>
              <p style="margin:0;color:#374151;font-size:14px;line-height:1.5;">${copy.infoBody}</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td align="center">
                  <a href="${storeUrl}/orders" style="display:inline-block;background:linear-gradient(135deg,#C8102E 0%,#8b0000 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:16px;">${copy.cta}</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">${copy.support}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">${copy.footer}<br />${copy.copyright}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
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
    locale?: Locale;
}

export async function sendReturnResultEmail(
    email: string,
    data: ReturnResultData
) {
    const locale = data.locale ?? "en";
    const subject = data.approved
        ? locale === "tr"
            ? `İade Talebiniz Onaylandı #${data.orderNumber} - ${STORE_NAME}`
            : `Return Approved #${data.orderNumber} - ${STORE_NAME}`
        : locale === "tr"
            ? `İade Talebi Güncelleme #${data.orderNumber} - ${STORE_NAME}`
            : `Return Request Update #${data.orderNumber} - ${STORE_NAME}`;

    try {
        const { data: result, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject,
            html: getReturnResultTemplate(data, locale),
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

function getReturnResultTemplate(data: ReturnResultData, locale: Locale): string {
    const { orderNumber, firstName, approved, adminNote, total } = data;
    const storeUrl = process.env.NEXT_PUBLIC_URL ?? "#";
    const returnAddress = process.env.STORE_RETURN_ADDRESS || "";
    const returnName = process.env.STORE_RETURN_NAME || STORE_NAME;

    const statusColor = approved ? "#059669" : "#C8102E";
    const statusBg = approved ? "#ecfdf5" : "#fef2f2";
    const statusBorder = approved ? "#a7f3d0" : "#fecaca";
    const headerGradient = approved ? "linear-gradient(135deg,#059669 0%,#047857 100%)" : "linear-gradient(135deg,#C8102E 0%,#8b0000 100%)";

    const copy = {
        tr: {
            greeting: firstName ? `Merhaba ${firstName},` : "Merhaba,",
            statusTitle: approved ? "İade Onaylandı" : "İade Talebi Reddedildi",
            statusIcon: approved ? "&#10003;" : "&#10007;",
            statusSub: `Sipariş #${orderNumber}`,
            message: approved
                ? `<strong>#${orderNumber}</strong> numaralı siparişinize ait iade talebiniz onaylanmıştır. <strong>${formatPrice(total)}</strong> tutarındaki iade, orijinal ödeme yönteminize aktarılacaktır.`
                : `<strong>#${orderNumber}</strong> numaralı siparişinize ait iade talebiniz incelenmiş ve ne yazık ki bu aşamada onaylanamamıştır.`,
            teamNoteLabel: "Ekibimizin Notu",
            shippingTitle: "&#128230; Ücretsiz İade Kargo Talimatları",
            shippingBody: "Ürünü orijinal ambalajında aşağıdaki adrese gönderin. İade kargo ücreti tamamen tarafımızca karşılanmaktadır — kargo firmasına ödeme yapmayınız.",
            addressLabel: "İade Adresi",
            shippingNote: `Kargo gönderiminizde sipariş numaranızı (<strong>#${orderNumber}</strong>) belirtmeyi unutmayın.`,
            cta: "Siparişlerimi Görüntüle",
            support: "Herhangi bir sorunuz varsa destek ekibimizle iletişime geçebilirsiniz.",
            footer: `Bu e-posta ${STORE_NAME} tarafından gönderilmiştir.`,
            copyright: `© ${new Date().getFullYear()} ${STORE_NAME}. Tüm hakları saklıdır.`,
        },
        en: {
            greeting: firstName ? `Hello ${firstName},` : "Hello,",
            statusTitle: approved ? "Return Approved" : "Return Request Rejected",
            statusIcon: approved ? "&#10003;" : "&#10007;",
            statusSub: `Order #${orderNumber}`,
            message: approved
                ? `Your return request for order <strong>#${orderNumber}</strong> has been approved. A refund of <strong>${formatPrice(total)}</strong> will be issued to your original payment method.`
                : `Your return request for order <strong>#${orderNumber}</strong> has been reviewed and unfortunately could not be approved at this time.`,
            teamNoteLabel: "Note from our team",
            shippingTitle: "&#128230; Free Return Shipping Instructions",
            shippingBody: "Please send the item in its original packaging to the address below. Return shipping is fully covered by us — do not pay the carrier.",
            addressLabel: "Return Address",
            shippingNote: `Please include your order number (<strong>#${orderNumber}</strong>) on the shipment.`,
            cta: "View My Orders",
            support: "If you have any questions, feel free to contact our support team.",
            footer: `This email was sent by ${STORE_NAME}.`,
            copyright: `© ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.`,
        },
    }[locale];

    return `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${copy.statusTitle}</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:${headerGradient};padding:40px;text-align:center;border-radius:8px 8px 0 0;">
            <p style="margin:0 0 8px 0;color:rgba(255,255,255,0.85);font-size:14px;letter-spacing:1px;text-transform:uppercase;">${STORE_NAME}</p>
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">${copy.statusTitle}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 20px 0;color:#374151;font-size:16px;line-height:1.6;">${copy.greeting}</p>
            <div style="margin:0 0 24px 0;padding:20px;background-color:${statusBg};border:1px solid ${statusBorder};border-radius:8px;text-align:center;">
              <span style="font-size:32px;color:${statusColor};">${copy.statusIcon}</span>
              <p style="margin:8px 0 0 0;color:${statusColor};font-size:18px;font-weight:700;">${copy.statusTitle}</p>
              <p style="margin:4px 0 0 0;color:#6b7280;font-size:13px;">${copy.statusSub}</p>
            </div>
            <p style="margin:0 0 20px 0;color:#374151;font-size:15px;line-height:1.6;">${copy.message}</p>
            ${adminNote ? `
            <div style="margin:0 0 24px 0;padding:16px;background-color:#f9fafb;border-left:3px solid ${statusColor};border-radius:4px;">
              <p style="margin:0 0 4px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">${copy.teamNoteLabel}</p>
              <p style="margin:0;color:#374151;font-size:14px;line-height:1.5;">${adminNote}</p>
            </div>` : ""}
            ${approved && returnAddress ? `
            <div style="margin:0 0 24px 0;padding:20px;background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
              <p style="margin:0 0 8px 0;color:#15803d;font-size:14px;font-weight:700;">${copy.shippingTitle}</p>
              <p style="margin:0 0 12px 0;color:#374151;font-size:14px;line-height:1.5;">${copy.shippingBody}</p>
              <div style="background-color:#ffffff;border:1px solid #bbf7d0;border-radius:6px;padding:14px;">
                <p style="margin:0 0 4px 0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">${copy.addressLabel}</p>
                <p style="margin:0;color:#15803d;font-size:15px;font-weight:700;">${returnName}</p>
                <p style="margin:4px 0 0 0;color:#374151;font-size:14px;line-height:1.5;">${returnAddress}</p>
              </div>
              <p style="margin:12px 0 0 0;color:#6b7280;font-size:13px;line-height:1.5;">${copy.shippingNote}</p>
            </div>` : ""}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td align="center">
                  <a href="${storeUrl}/orders" style="display:inline-block;background:linear-gradient(135deg,#C8102E 0%,#8b0000 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:16px;">${copy.cta}</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">${copy.support}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">${copy.footer}<br />${copy.copyright}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

// ---------------------------------------------------------------------------
// Order Shipped / Tracking Email
// ---------------------------------------------------------------------------

export interface OrderShippedData {
    orderNumber: string;
    firstName?: string | null;
    trackingNumber?: string | null;
    shippingCompany?: string | null;
    trackingUrl?: string | null;
    locale?: Locale;
}

export async function sendOrderShippedEmail(
    email: string,
    data: OrderShippedData
) {
    const locale = data.locale ?? "en";
    const subject =
        locale === "tr"
            ? `Siparişiniz Kargoya Verildi #${data.orderNumber} - ${STORE_NAME}`
            : `Your Order #${data.orderNumber} Has Been Shipped! - ${STORE_NAME}`;
    try {
        const { data: result, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject,
            html: getOrderShippedTemplate(data, locale),
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

function getOrderShippedTemplate(data: OrderShippedData, locale: Locale): string {
    const { orderNumber, firstName, trackingNumber, shippingCompany, trackingUrl } = data;
    const storeUrl = process.env.NEXT_PUBLIC_URL ?? "#";

    const copy = {
        tr: {
            greeting: firstName ? `Merhaba ${firstName},` : "Merhaba,",
            title: "Siparişiniz Yola Çıktı!",
            body: `<strong>#${orderNumber}</strong> numaralı siparişiniz kargoya verildi.`,
            trackingLabel: "Takip Numarası",
            trackLink: "Kargoyu Takip Et &rarr;",
            trackingSoon: "Takip bilgileri kısa süre içinde güncellenecektir.",
            cta: "Siparişlerimi Görüntüle",
            support: "Teslimatınızla ilgili herhangi bir sorunuz varsa destek ekibimizle iletişime geçebilirsiniz.",
            footer: `Bu e-posta ${STORE_NAME} tarafından gönderilmiştir.`,
            copyright: `© ${new Date().getFullYear()} ${STORE_NAME}. Tüm hakları saklıdır.`,
        },
        en: {
            greeting: firstName ? `Hello ${firstName},` : "Hello,",
            title: "Your Order Is On Its Way!",
            body: `Great news! Your order <strong>#${orderNumber}</strong> has been shipped and is on its way to you.`,
            trackingLabel: "Tracking Number",
            trackLink: "Track your shipment &rarr;",
            trackingSoon: "Tracking information will be available shortly.",
            cta: "View My Orders",
            support: "If you have any questions about your delivery, feel free to contact our support team.",
            footer: `This email was sent by ${STORE_NAME}.`,
            copyright: `© ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.`,
        },
    }[locale];

    return `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${copy.title}</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:linear-gradient(135deg,#0ea5e9 0%,#0369a1 100%);padding:40px;text-align:center;border-radius:8px 8px 0 0;">
            <p style="margin:0 0 8px 0;color:rgba(255,255,255,0.85);font-size:14px;letter-spacing:1px;text-transform:uppercase;">${STORE_NAME}</p>
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">${copy.title}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 20px 0;color:#374151;font-size:16px;line-height:1.6;">${copy.greeting}</p>
            <p style="margin:0 0 24px 0;color:#374151;font-size:16px;line-height:1.6;">${copy.body}</p>
            ${trackingNumber ? `
            <div style="margin:0 0 28px 0;padding:24px;background-color:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;text-align:center;">
              ${shippingCompany ? `<p style="margin:0 0 8px 0;color:#0369a1;font-size:13px;font-weight:700;">${shippingCompany}</p>` : ""}
              <p style="margin:0 0 4px 0;color:#0369a1;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${copy.trackingLabel}</p>
              <p style="margin:0;color:#0c4a6e;font-size:24px;font-weight:700;letter-spacing:2px;font-family:monospace;">${trackingNumber}</p>
              ${trackingUrl ? `<p style="margin:12px 0 0 0;"><a href="${trackingUrl}" style="color:#0369a1;font-size:13px;font-weight:600;text-decoration:underline;">${copy.trackLink}</a></p>` : ""}
            </div>` : `
            <div style="margin:0 0 28px 0;padding:20px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;text-align:center;">
              <p style="margin:0;color:#6b7280;font-size:14px;">${copy.trackingSoon}</p>
            </div>`}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td align="center">
                  <a href="${storeUrl}/orders" style="display:inline-block;background:linear-gradient(135deg,#C8102E 0%,#8b0000 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:16px;">${copy.cta}</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">${copy.support}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">${copy.footer}<br />${copy.copyright}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

// ---------------------------------------------------------------------------
// Stock Alert Email
// ---------------------------------------------------------------------------

export interface StockAlertData {
    productTitle: string;
    productUrl: string;
    thumbnail?: string | null;
    firstName?: string | null;
    locale?: Locale;
}

export async function sendStockAlertEmail(
    email: string,
    data: StockAlertData
) {
    const locale = data.locale ?? "en";
    const subject =
        locale === "tr"
            ? `Stokta: ${data.productTitle} - ${STORE_NAME}`
            : `Back in Stock: ${data.productTitle} - ${STORE_NAME}`;
    try {
        const { data: result, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject,
            html: getStockAlertTemplate(data, locale),
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

function getStockAlertTemplate(data: StockAlertData, locale: Locale): string {
    const { productTitle, productUrl, thumbnail, firstName } = data;

    const copy = {
        tr: {
            greeting: firstName ? `Merhaba ${firstName},` : "Merhaba,",
            title: "Ürün Tekrar Stokta!",
            body: "Beklediğiniz ürün tekrar stokta:",
            cta: "Hemen Satın Al",
            urgency: "Acele edin — popüler ürünler hızla tükeniyor!",
            alertNote: "Bu e-postayı stok uyarısı talebiniz nedeniyle aldınız.",
            copyright: `© ${new Date().getFullYear()} ${STORE_NAME}. Tüm hakları saklıdır.`,
        },
        en: {
            greeting: firstName ? `Hello ${firstName},` : "Hello,",
            title: "Back in Stock!",
            body: "Great news! An item you were waiting for is now back in stock:",
            cta: "Shop Now",
            urgency: "Hurry — popular items sell out fast!",
            alertNote: "You received this because you requested a stock alert.",
            copyright: `© ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.`,
        },
    }[locale];

    return `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${copy.title}</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:linear-gradient(135deg,#C8102E 0%,#8b0000 100%);padding:40px;text-align:center;border-radius:8px 8px 0 0;">
            <p style="margin:0 0 8px 0;color:rgba(255,255,255,0.85);font-size:14px;letter-spacing:1px;text-transform:uppercase;">${STORE_NAME}</p>
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">${copy.title}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 20px 0;color:#374151;font-size:16px;line-height:1.6;">${copy.greeting}</p>
            <p style="margin:0 0 24px 0;color:#374151;font-size:16px;line-height:1.6;">${copy.body}</p>
            <div style="margin:0 0 28px 0;padding:20px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;text-align:center;">
              ${thumbnail ? `<img src="${thumbnail}" alt="${productTitle}" width="120" height="120" style="border-radius:8px;object-fit:cover;margin-bottom:12px;" />` : ""}
              <p style="margin:0;color:#1a1a1a;font-size:18px;font-weight:700;">${productTitle}</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td align="center">
                  <a href="${productUrl}" style="display:inline-block;background:linear-gradient(135deg,#C8102E 0%,#8b0000 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:16px;">${copy.cta}</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">${copy.urgency}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">${copy.alertNote}<br />${copy.copyright}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

// ---------------------------------------------------------------------------
// Payment Proof Uploaded — Admin Notification + Customer Confirmation
// ---------------------------------------------------------------------------

export interface PaymentUploadedData {
    orderNumber: string;
    firstName?: string | null;
    customerEmail: string;
    total: number;
    proofUrl: string;
    locale?: Locale;
}

export async function sendPaymentUploadedAdminEmail(data: PaymentUploadedData) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const storeUrl = process.env.NEXT_PUBLIC_URL ?? "#";

    try {
        const { data: result, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: adminEmail,
            subject: `💳 Yeni Ödeme Belgesi — Sipariş #${data.orderNumber}`,
            html: `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8" /><title>Yeni Ödeme Belgesi</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:linear-gradient(135deg,#1A1A1A 0%,#333 100%);padding:32px 40px;border-radius:8px 8px 0 0;">
            <p style="margin:0 0 4px 0;color:rgba(255,255,255,0.6);font-size:12px;text-transform:uppercase;letter-spacing:1px;">${STORE_NAME} — Admin</p>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">💳 Yeni Ödeme Belgesi Yüklendi</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <tr><td style="padding:12px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Sipariş No</p>
                <p style="margin:4px 0 0 0;color:#C8102E;font-size:20px;font-weight:700;">#${data.orderNumber}</p>
              </td></tr>
              <tr><td style="padding:12px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Müşteri</p>
                <p style="margin:4px 0 0 0;color:#1a1a1a;font-size:15px;font-weight:600;">${data.firstName || ""} &lt;${data.customerEmail}&gt;</p>
              </td></tr>
              <tr><td style="padding:12px 16px;background:#f9fafb;">
                <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Tutar</p>
                <p style="margin:4px 0 0 0;color:#1a1a1a;font-size:15px;font-weight:700;">${formatPrice(data.total)}</p>
              </td></tr>
            </table>

            <div style="margin-bottom:24px;padding:16px;background-color:#fff7ed;border:1px solid #fed7aa;border-radius:8px;">
              <p style="margin:0 0 4px 0;color:#c2410c;font-size:12px;font-weight:700;text-transform:uppercase;">Ödeme Belgesi</p>
              <a href="${data.proofUrl}" style="color:#c2410c;font-size:13px;word-break:break-all;">${data.proofUrl}</a>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${storeUrl}/admin/orders/${data.orderNumber}" style="display:inline-block;background:linear-gradient(135deg,#1A1A1A 0%,#333 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:15px;">
                  Siparişi Yönet
                </a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;background-color:#f9fafb;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">${STORE_NAME} Yönetim Sistemi &mdash; © ${new Date().getFullYear()}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
        });
        if (error) console.error("Error sending admin payment email:", error);
        return { success: !error, error };
    } catch (error) {
        console.error("Error sending admin payment email:", error);
        return { success: false, error };
    }
}

export async function sendPaymentUploadedCustomerEmail(
    email: string,
    data: PaymentUploadedData
) {
    const locale = data.locale ?? "en";
    const subject =
        locale === "tr"
            ? `Ödeme Belgeniz Alındı #${data.orderNumber} - ${STORE_NAME}`
            : `Payment Proof Received #${data.orderNumber} - ${STORE_NAME}`;

    const copy = {
        tr: {
            greeting: data.firstName ? `Merhaba ${data.firstName},` : "Merhaba,",
            title: "Ödeme Belgeniz Alındı",
            subtitle: "İnceleme sürecine alındı.",
            body: `<strong>#${data.orderNumber}</strong> numaralı siparişiniz için ödeme belgenizi aldık. Ekibimiz belgenizi en kısa sürede inceleyecek ve siparişiniz onaylandığında bilgilendirileceksiniz.`,
            statusTitle: "İnceleme Bekleniyor",
            statusSub: `Sipariş #${data.orderNumber} · ${formatPrice(data.total)}`,
            infoTitle: "Bilgi",
            infoBody: "Ödeme belgesi incelemesi genellikle birkaç saat içinde tamamlanmaktadır. Onay sonrası e-posta ile bildirim alacaksınız.",
            cta: "Siparişlerimi Görüntüle",
            support: "Herhangi bir sorunuz varsa destek ekibimizle iletişime geçebilirsiniz.",
            footer: `Bu e-posta ${STORE_NAME} tarafından gönderilmiştir.`,
            copyright: `© ${new Date().getFullYear()} ${STORE_NAME}. Tüm hakları saklıdır.`,
        },
        en: {
            greeting: data.firstName ? `Hello ${data.firstName},` : "Hello,",
            title: "Payment Proof Received",
            subtitle: "It is now under review.",
            body: `We have received your payment proof for order <strong>#${data.orderNumber}</strong>. Our team will review it shortly and you will be notified once approved.`,
            statusTitle: "Pending Review",
            statusSub: `Order #${data.orderNumber} · ${formatPrice(data.total)}`,
            infoTitle: "Info",
            infoBody: "Payment reviews are usually completed within a few hours. You will receive a confirmation email once your payment is approved.",
            cta: "View My Orders",
            support: "If you have any questions, feel free to contact our support team.",
            footer: `This email was sent by ${STORE_NAME}.`,
            copyright: `© ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.`,
        },
    }[locale];

    const storeUrl = process.env.NEXT_PUBLIC_URL ?? "#";

    try {
        const { data: result, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject,
            html: `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${copy.title}</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:linear-gradient(135deg,#C8102E 0%,#8b0000 100%);padding:40px;text-align:center;border-radius:8px 8px 0 0;">
            <p style="margin:0 0 8px 0;color:rgba(255,255,255,0.85);font-size:14px;letter-spacing:1px;text-transform:uppercase;">${STORE_NAME}</p>
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">${copy.title}</h1>
            <p style="margin:12px 0 0 0;color:rgba(255,255,255,0.9);font-size:16px;">${copy.subtitle}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 20px 0;color:#374151;font-size:16px;line-height:1.6;">${copy.greeting}</p>
            <p style="margin:0 0 24px 0;color:#374151;font-size:16px;line-height:1.6;">${copy.body}</p>
            <div style="margin:0 0 24px 0;padding:20px;background-color:#fff5f5;border:1px solid #fecaca;border-radius:8px;text-align:center;">
              <span style="font-size:32px;">&#9203;</span>
              <p style="margin:8px 0 0 0;color:#C8102E;font-size:18px;font-weight:700;">${copy.statusTitle}</p>
              <p style="margin:4px 0 0 0;color:#6b7280;font-size:13px;">${copy.statusSub}</p>
            </div>
            <div style="margin:0 0 24px 0;padding:16px;background-color:#f9fafb;border-left:3px solid #C8102E;border-radius:4px;">
              <p style="margin:0 0 4px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">${copy.infoTitle}</p>
              <p style="margin:0;color:#374151;font-size:14px;line-height:1.5;">${copy.infoBody}</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td align="center">
                <a href="${storeUrl}/orders" style="display:inline-block;background:linear-gradient(135deg,#C8102E 0%,#8b0000 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:16px;">${copy.cta}</a>
              </td></tr>
            </table>
            <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">${copy.support}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background-color:#f9fafb;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">${copy.footer}<br />${copy.copyright}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
        });
        if (error) console.error("Error sending customer payment email:", error);
        return { success: !error, error };
    } catch (error) {
        console.error("Error sending customer payment email:", error);
        return { success: false, error };
    }
}

// ---------------------------------------------------------------------------
// Contact Form Email (sent to admin — no locale needed)
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
            from: FROM_EMAIL,
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
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>New Contact Message</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
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
                  <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" style="display:inline-block;background:linear-gradient(135deg,#C8102E 0%,#8b0000 100%);color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;">Reply to ${name}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;background-color:#f9fafb;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">This message was sent via the contact form on ${STORE_NAME}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

// ---------------------------------------------------------------------------
// Password Reset Email
// ---------------------------------------------------------------------------

export async function sendResetPasswordEmail(email: string, token: string, locale: Locale = "en") {
    const resetUrl = `${process.env.NEXT_PUBLIC_URL}/reset-password?token=${token}`;
    const subject =
        locale === "tr"
            ? "Şifrenizi Sıfırlayın - ${STORE_NAME}"
            : "Reset Your Password - ${STORE_NAME}";
    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject,
            html: getResetPasswordEmailTemplate(resetUrl, locale),
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

function getResetPasswordEmailTemplate(resetUrl: string, locale: Locale): string {
    const copy = {
        tr: {
            title: "Şifrenizi Sıfırlayın",
            greeting: "Merhaba,",
            body: `${STORE_NAME} hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni bir şifre oluşturmak için aşağıdaki butona tıklayın:`,
            cta: "Şifremi Sıfırla",
            orCopy: "Ya da bu bağlantıyı tarayıcınıza kopyalayın:",
            warning: "<strong>⚠️ Önemli:</strong> Bu bağlantı güvenlik nedeniyle 15 dakika içinde geçerliliğini yitirecektir.",
            ignore: "Şifre sıfırlama talebinde bulunmadıysanız bu e-postayı güvenle silebilirsiniz. Şifreniz değiştirilmeyecektir.",
            footer: `Bu e-posta ${STORE_NAME} tarafından gönderilmiştir.`,
            support: "Herhangi bir sorunuz varsa destek ekibimizle iletişime geçebilirsiniz.",
            copyright: `© ${new Date().getFullYear()} ${STORE_NAME}. Tüm hakları saklıdır.`,
        },
        en: {
            title: "Reset Your Password",
            greeting: "Hello,",
            body: `We received a request to reset your password for your ${STORE_NAME} account. Click the button below to create a new password:`,
            cta: "Reset Password",
            orCopy: "Or copy and paste this link into your browser:",
            warning: "<strong>⚠️ Important:</strong> This link will expire in 15 minutes for security reasons.",
            ignore: "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.",
            footer: `This email was sent by ${STORE_NAME}.`,
            support: "If you have any questions, please contact our support team.",
            copyright: `© ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.`,
        },
    }[locale];

    return `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${copy.title}</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">${copy.title}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 20px 0;color:#374151;font-size:16px;line-height:1.6;">${copy.greeting}</p>
            <p style="margin:0 0 20px 0;color:#374151;font-size:16px;line-height:1.6;">${copy.body}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
              <tr>
                <td align="center">
                  <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:16px;">${copy.cta}</a>
                </td>
              </tr>
            </table>
            <p style="margin:20px 0;color:#6b7280;font-size:14px;line-height:1.6;">${copy.orCopy}</p>
            <p style="margin:0 0 20px 0;padding:12px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;word-break:break-all;">
              <a href="${resetUrl}" style="color:#3b82f6;text-decoration:none;font-size:14px;">${resetUrl}</a>
            </p>
            <div style="margin:30px 0;padding:16px;background-color:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
              <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">${copy.warning}</p>
            </div>
            <p style="margin:20px 0 0 0;color:#6b7280;font-size:14px;line-height:1.6;">${copy.ignore}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:30px;background-color:#f9fafb;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0 0 8px 0;color:#9ca3af;font-size:12px;line-height:1.6;">${copy.footer}<br />${copy.support}</p>
            <p style="margin:0;color:#9ca3af;font-size:12px;">${copy.copyright}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}
