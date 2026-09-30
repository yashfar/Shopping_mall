import { createHash } from "node:crypto";

export const AGREEMENT_TEMPLATE_VERSION = "2026-09-29.1";

export type AgreementLocale = "tr" | "en";

export type AgreementInput = {
  locale: AgreementLocale;
  buyer: { name: string; email: string; phone: string };
  deliveryAddress: string;
  items: Array<{
    title: string;
    variant: string | null;
    quantity: number;
    unitPrice: number;
  }>;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  couponCode: string | null;
  paymentMethod?: "BANK_TRANSFER" | "IYZICO";
};

export type AgreementBundle = {
  templateVersion: string;
  locale: AgreementLocale;
  bundleHash: string;
  preContractHtml: string;
  preContractHash: string;
  distanceSalesHtml: string;
  distanceSalesHash: string;
};

const seller = {
  name: "Yaşar Farhadi",
  brand: "Creative Aventus",
  statusTr: "Esnaf Vergi Muafiyeti Belgesi sahibi gerçek kişi",
  statusEn: "Individual holding an Esnaf Vergi Muafiyeti Belgesi",
  address: "Sahil Mah., Kocatepe Cad., Güverte Evleri, G2 Blok, Daire: 2, 34524 Beylikdüzü, İstanbul, Türkiye",
  email: "yasarfarhadi@gmail.com",
  phone: "+90 551 082 72 15",
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] as string);
}

function money(value: number, currency: string, locale: AgreementLocale) {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency", currency,
  }).format(value / 100);
}

function hash(content: string) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function shell(title: string, body: string, locale: AgreementLocale) {
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;color:#222;line-height:1.55;max-width:850px;margin:32px auto;padding:0 24px}h1{color:#C8102E}h2{margin-top:28px}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #ddd;padding:9px;text-align:left}.num{text-align:right;white-space:nowrap}.meta{color:#555;font-size:13px}.notice{background:#fff8e1;border:1px solid #f0d98c;padding:12px}footer{border-top:1px solid #ddd;margin-top:32px;padding-top:12px;font-size:12px;color:#666}</style></head><body>${body}<footer>${locale === "tr" ? "Bu belge, kabul anındaki sipariş bilgilerinin değişmez kopyasıdır." : "This document is an immutable copy of the order information at acceptance."} ${escapeHtml(AGREEMENT_TEMPLATE_VERSION)}</footer></body></html>`;
}

function parties(input: AgreementInput) {
  if (input.locale === "tr") return `<h2>Taraflar ve teslimat</h2><p><strong>Satıcı:</strong> ${seller.name} (${seller.brand})<br><strong>Statü:</strong> ${seller.statusTr}<br><strong>Adres:</strong> ${seller.address}<br><strong>E-posta:</strong> ${seller.email}<br><strong>Telefon:</strong> ${seller.phone}</p><p><strong>Alıcı:</strong> ${escapeHtml(input.buyer.name)}<br><strong>E-posta:</strong> ${escapeHtml(input.buyer.email)}<br><strong>Telefon:</strong> ${escapeHtml(input.buyer.phone)}<br><strong>Teslimat adresi:</strong> ${escapeHtml(input.deliveryAddress)}</p>`;
  return `<h2>Parties and delivery</h2><p><strong>Seller:</strong> ${seller.name} (${seller.brand})<br><strong>Status:</strong> ${seller.statusEn}<br><strong>Address:</strong> ${seller.address}<br><strong>Email:</strong> ${seller.email}<br><strong>Phone:</strong> ${seller.phone}</p><p><strong>Buyer:</strong> ${escapeHtml(input.buyer.name)}<br><strong>Email:</strong> ${escapeHtml(input.buyer.email)}<br><strong>Phone:</strong> ${escapeHtml(input.buyer.phone)}<br><strong>Delivery address:</strong> ${escapeHtml(input.deliveryAddress)}</p>`;
}

function orderTable(input: AgreementInput) {
  const tr = input.locale === "tr";
  const paymentMethod = input.paymentMethod === "IYZICO"
    ? (tr ? "Kredi / banka kartı (iyzico güvenli ödeme)" : "Credit / debit card (secure payment with iyzico)")
    : (tr ? "Banka havalesi / EFT (dekont incelemesi)" : "Bank transfer / EFT (receipt review)");
  const rows = input.items.map((item) => `<tr><td>${escapeHtml(item.title)}${item.variant ? `<br><span class="meta">${tr ? "Varyant" : "Variant"}: ${escapeHtml(item.variant)}</span>` : ""}</td><td class="num">${item.quantity}</td><td class="num">${money(item.unitPrice, input.currency, input.locale)}</td><td class="num">${money(item.unitPrice * item.quantity, input.currency, input.locale)}</td></tr>`).join("");
  const taxText = input.taxPercent > 0
    ? `${money(input.taxAmount, input.currency, input.locale)} (${input.taxPercent}%; ${tr ? "ürün fiyatlarına dâhil, ayrıca eklenmez" : "included in product prices and not added separately"})`
    : tr ? "Ayrı bir vergi tutarı yapılandırılmamıştır; toplam bedele ayrıca vergi eklenmez." : "No separate tax amount is configured; no tax is added separately to the total.";
  return `<h2>${tr ? "Sipariş ve bedeller" : "Order and charges"}</h2><table><thead><tr><th>${tr ? "Ürün" : "Product"}</th><th class="num">${tr ? "Adet" : "Qty"}</th><th class="num">${tr ? "Birim fiyat" : "Unit price"}</th><th class="num">${tr ? "Tutar" : "Amount"}</th></tr></thead><tbody>${rows}</tbody></table><p><strong>${tr ? "Ara toplam" : "Subtotal"}:</strong> ${money(input.subtotal, input.currency, input.locale)}<br><strong>${tr ? "İndirim" : "Discount"}:</strong> ${money(input.discountAmount, input.currency, input.locale)}${input.couponCode ? ` (${escapeHtml(input.couponCode)})` : ""}<br><strong>${tr ? "Vergi bilgisi" : "Tax information"}:</strong> ${taxText}<br><strong>${tr ? "Kargo" : "Shipping"}:</strong> ${money(input.shippingAmount, input.currency, input.locale)}<br><strong>${tr ? "Toplam" : "Total"}:</strong> ${money(input.total, input.currency, input.locale)}<br><strong>${tr ? "Ödeme yöntemi" : "Payment method"}:</strong> ${paymentMethod}</p>`;
}

function commonTerms(locale: AgreementLocale) {
  if (locale === "tr") return `<h2>Hazırlama ve teslimat</h2><p>Standart siparişler normalde 3 iş günü içinde PTT Kargo'ya teslim edilmek üzere hazırlanır. Bu süre teslimat garantisi değildir. Teslimat Türkiye genelindedir; taşıma süresi PTT Kargo'ya ve adrese bağlıdır. Kişiselleştirilmiş siparişlerin model, adet, uygulanabilirlik, fiyat ve üretim takvimi siparişten önce müşteriyle ayrıca kararlaştırılır.</p><h2>Cayma ve iade</h2><p>Tüketici, uygulanabilir istisnalar saklı kalmak üzere, malın tesliminden itibaren 14 gün içinde gerekçe göstermeden cayma bildiriminde bulunabilir; teslimden önce de cayma bildirimi yapılabilir. Bildirim sipariş iade sistemiyle veya ${seller.email} adresine e-postayla yapılabilir. Mal, cayma bildiriminden itibaren 14 gün içinde geri gönderilmelidir. Ön bilgilendirmede belirtilen PTT Kargo kullanıldığında tüketici iade taşıma masrafından sorumlu tutulmaz. İade alıcısı ${seller.name}; iade adresi ${seller.address}.</p><p>Cayma bildiriminin ardından mal PTT Kargo'ya teslim edilmişse bedel, satıcının bildirimden haberdar olduğu tarihten itibaren 14 gün içinde; başka bir taşıyıcı kullanılmışsa mal satıcıya ulaştıktan sonra, ödeme aracına uygun ve tüketiciye masraf yüklemeyen biçimde iade edilir. Mal henüz teslim edilmemişse 14 günlük süre bildirim tarihinde başlar.</p><p>Kişiye özel ürünlerde cayma hakkının uygulanabilirliği ürünün gerçekten tüketicinin özel istek veya kişisel ihtiyaçlarına göre hazırlanmış olmasına bağlıdır; her 3B baskı veya sipariş üzerine üretim otomatik olarak istisna sayılmaz. Ayıplı, hasarlı veya yanlış ürünlere ilişkin kanuni haklar saklıdır.</p>`;
  return `<h2>Preparation and delivery</h2><p>Standard orders are normally prepared for handover to PTT Kargo within 3 business days. This is not a guaranteed delivery time. Delivery coverage is throughout Turkey; carriage time depends on PTT Kargo and the destination. For personalized orders, the model, quantity, feasibility, price and production schedule are agreed separately with the customer before ordering.</p><h2>Withdrawal and returns</h2><p>Subject to applicable exceptions, the consumer may notify withdrawal without giving a reason within 14 days after delivery and may also notify withdrawal before delivery. Notice may be submitted through the order-return system or by email to ${seller.email}. The goods must be sent back within 14 days after notice. When the stated PTT Kargo service is used, the consumer is not charged return carriage. Return recipient: ${seller.name}; return address: ${seller.address}.</p><p>After withdrawal notice, if the goods are handed to PTT Kargo, the refund is made within 14 days after the seller learns of the notice; if another carrier is used, it is made after the seller receives the goods. The refund uses a method compatible with the original payment instrument and must not impose a cost on the consumer. If the goods have not yet been delivered, the 14-day period begins on notice.</p><p>For personalized goods, any withdrawal exception depends on whether the product was genuinely prepared to the consumer's special request or personal needs; not every 3D-printed or made-to-order product is automatically excluded. Statutory rights for defective, damaged or incorrect goods remain unaffected.</p>`;
}

export function generateAgreementBundle(input: AgreementInput): AgreementBundle {
  const tr = input.locale === "tr";
  const shared = `${parties(input)}${orderTable(input)}${commonTerms(input.locale)}`;
  const paymentPerformance = input.paymentMethod === "IYZICO"
    ? (tr
      ? "Sipariş bedeli iyzico güvenli ödeme altyapısı üzerinden kredi veya banka kartıyla ödenir. Ödeme doğrulandıktan sonra sipariş hazırlanmaya başlanır."
      : "The order is paid by credit or debit card through iyzico's secure payment infrastructure. Order preparation begins after payment is verified.")
    : (tr
      ? "Sipariş bedeli banka havalesi/EFT ile ödenir. Ödeme dekontunun yönetimsel incelenmesi ödeme teyit sürecidir; kabul edilen sözleşme metnini değiştirmez."
      : "The order is paid by bank transfer/EFT. Administrative review of the payment receipt is part of payment confirmation and does not change the accepted agreement.");
  const preContractHtml = shell(tr ? "Ön Bilgilendirme Formu" : "Pre-contract Information", `<h1>${tr ? "Ön Bilgilendirme Formu" : "Pre-contract Information"}</h1><p class="notice">${tr ? "Sipariş verilmeden ve ödeme yapılmadan önce bu bilgileri okuyunuz." : "Read this information before placing the order and making payment."}</p>${shared}<h2>${tr ? "Başvuru yolları" : "Remedies"}</h2><p>${tr ? "Uyuşmazlıklarda yürürlükteki parasal sınırlar dâhilinde Tüketici Hakem Heyetlerine veya Tüketici Mahkemelerine başvurulabilir." : "Depending on the applicable monetary thresholds, disputes may be submitted to Consumer Arbitration Committees or Consumer Courts."}</p>`, input.locale);
  const distanceSalesHtml = shell(tr ? "Mesafeli Satış Sözleşmesi" : "Distance Sales Agreement", `<h1>${tr ? "Mesafeli Satış Sözleşmesi" : "Distance Sales Agreement"}</h1><p>${tr ? "Bu sözleşme, aşağıdaki sipariş bilgilerinin alıcı tarafından elektronik ortamda açıkça kabul edilmesiyle kurulur." : "This agreement is formed when the buyer expressly accepts the following order information electronically."}</p>${shared}<h2>${tr ? "Ödeme ve ifa" : "Payment and performance"}</h2><p>${paymentPerformance} ${tr ? "Taahhüt edilen farklı bir süre yoksa mal en geç kanuni azami süre içinde gönderilir; kişisel ihtiyaçlara göre hazırlanan ürünlerde daha uzun bir süre ayrıca kararlaştırılabilir." : "Unless a different period is promised, the goods are dispatched within the statutory maximum period; a longer period may be agreed separately for goods prepared to personal needs."}</p><h2>${tr ? "Kayıt" : "Record"}</h2><p>${tr ? "Kabul edilen bu sürüm siparişle birlikte değişmez biçimde saklanır ve müşteriye kalıcı bir kopya sağlanır." : "This accepted version is retained immutably with the order and a durable copy is provided to the customer."}</p>`, input.locale);
  const preContractHash = hash(preContractHtml);
  const distanceSalesHash = hash(distanceSalesHtml);
  const bundleHash = hash(JSON.stringify({ version: AGREEMENT_TEMPLATE_VERSION, locale: input.locale, preContractHash, distanceSalesHash }));
  return { templateVersion: AGREEMENT_TEMPLATE_VERSION, locale: input.locale, bundleHash, preContractHtml, preContractHash, distanceSalesHtml, distanceSalesHash };
}
