"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  CreditCard,
  Gift,
  Landmark,
  LockKeyhole,
  MapPin,
  Package,
  ReceiptText,
  ShoppingBag,
  Tag,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import AgreementReviewDialog from "@@/components/checkout/AgreementReviewDialog";
import layoutStyles from "./checkout/checkout-layout.module.css";
import { useCurrency, type PriceEntry } from "@@/context/CurrencyContext";
import { calculateTotalsFromPrices } from "@@/lib/payment-utils";

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    thumbnail: string | null;
    prices?: PriceEntry[];
  };
  variant?: {
    id: string;
    color: string;
    colorEn: string | null;
    colorHex: string | null;
  } | null;
};

type Cart = {
  id: string;
  items: CartItem[];
};

type AppliedCoupon = {
  code: string;
  type: string;
  value: number;
  discountAmount: number;
};

type Address = {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  city: string;
  district: string;
  neighborhood: string;
  fullAddress: string;
};

type AgreementPreview = {
  bundleHash: string;
  documents: { preContract: string; distanceSales: string };
};

type AgreementDocumentKey = keyof AgreementPreview["documents"];
type PaymentMethod = "BANK_TRANSFER" | "IYZICO";

export default function CheckoutContent() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const { formatPrice, currency, resolveProductPrice } = useCurrency();

  const [cart, setCart] = useState<Cart | null>(null);
  const [config, setConfig] = useState<{
    taxPercent: number;
    shippingFee: number;
    freeShippingThreshold: number;
    usdShippingFee: number;
    usdFreeShippingThreshold: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("BANK_TRANSFER");

  const [agreementPreview, setAgreementPreview] =
    useState<AgreementPreview | null>(null);
  const [acceptedAgreements, setAcceptedAgreements] = useState<
    Record<AgreementDocumentKey, boolean>
  >({ preContract: false, distanceSales: false });
  const [activeAgreement, setActiveAgreement] =
    useState<AgreementDocumentKey | null>(null);
  const [reviewingAgreement, setReviewingAgreement] =
    useState<AgreementDocumentKey | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] =
    useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const resetAgreementReview = () => {
    setAgreementPreview(null);
    setAcceptedAgreements({ preContract: false, distanceSales: false });
    setActiveAgreement(null);
  };

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await fetch("/api/cart");
        if (!response.ok) throw new Error("Failed to fetch cart");
        const data = await response.json();
        setCart(data.cart);
        setConfig(data.config);

        if (!data.cart || data.cart.items.length === 0) {
          router.push("/cart");
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAddresses = async () => {
      try {
        const response = await fetch("/api/address/list");
        if (!response.ok) return;

        const data = await response.json();
        const savedAddresses = data.addresses || [];
        setAddresses(savedAddresses);

        if (savedAddresses.length === 0) {
          router.push("/cart");
        }
      } catch (error) {
        console.error("Error checking addresses:", error);
      }
    };

    fetchCart();
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computedTotals = useMemo(() => {
    if (!cart || !config) return null;

    const effectiveConfig =
      currency === "USD"
        ? {
            taxPercent: config.taxPercent,
            shippingFee: config.usdShippingFee ?? 0,
            freeShippingThreshold: config.usdFreeShippingThreshold ?? 0,
          }
        : {
            taxPercent: config.taxPercent,
            shippingFee: config.shippingFee,
            freeShippingThreshold: config.freeShippingThreshold,
          };

    const itemPrices = cart.items.map((item) => {
      const resolved = resolveProductPrice(item.product);
      return {
        price: resolved ? (resolved.salePrice ?? resolved.price) : 0,
        quantity: item.quantity,
      };
    });

    return calculateTotalsFromPrices(itemPrices, effectiveConfig);
  }, [cart, config, currency, resolveProductPrice]);

  const applyCoupon = async () => {
    if (!couponInput.trim() || !cart || !config || !computedTotals) return;
    setCouponLoading(true);
    setCouponError("");

    try {
      const response = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponInput.trim(),
          subtotal: computedTotals.subtotal,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setAppliedCoupon(data);
      resetAgreementReview();
      setCouponInput("");
    } catch (error) {
      setCouponError(
        error instanceof Error ? error.message : t("invalidCoupon"),
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
    resetAgreementReview();
  };

  const reviewAgreement = async (documentKey: AgreementDocumentKey) => {
    if (!selectedAddressId) return;

    if (agreementPreview) {
      setActiveAgreement(documentKey);
      return;
    }

    setReviewingAgreement(documentKey);
    try {
      const response = await fetch("/api/checkout/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-locale": locale },
        body: JSON.stringify({
          addressId: selectedAddressId,
          couponCode: appliedCoupon?.code ?? null,
          currencyCode: currency,
          paymentMethod,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("agreementPreviewFailed"));
      }

      setAgreementPreview(data);
      setAcceptedAgreements({ preContract: false, distanceSales: false });
      setActiveAgreement(documentKey);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("agreementPreviewFailed"),
      );
    } finally {
      setReviewingAgreement(null);
    }
  };

  const acceptActiveAgreement = () => {
    if (!activeAgreement) return;
    setAcceptedAgreements((current) => ({
      ...current,
      [activeAgreement]: true,
    }));
    setActiveAgreement(null);
  };

  const createOrder = async () => {
    try {
      setCreating(true);
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: appliedCoupon?.code ?? null,
          currencyCode: currency,
          addressId: selectedAddressId,
          acceptedDocuments:
            acceptedAgreements.preContract &&
            acceptedAgreements.distanceSales,
          acceptedBundleHash: agreementPreview?.bundleHash,
          paymentMethod,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 409 && data.error === "AGREEMENT_CHANGED") {
          resetAgreementReview();
          throw new Error(t("agreementChanged"));
        }
        throw new Error(data.error || t("failedToCreateOrder"));
      }

      const data = await response.json();

      if (paymentMethod === "IYZICO") {
        const initializeResponse = await fetch(
          "/api/payments/iyzico/initialize",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderId }),
          },
        );
        const initializeData = await initializeResponse
          .json()
          .catch(() => ({}));
        if (
          initializeResponse.ok &&
          typeof initializeData.paymentPageUrl === "string" &&
          initializeData.paymentPageUrl
        ) {
          window.location.assign(initializeData.paymentPageUrl);
          return;
        }
        router.push(`/checkout?orderId=${data.orderId}`);
        return;
      }

      router.push(`/checkout?orderId=${data.orderId}`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(
        error instanceof Error ? error.message : t("failedToCreateOrder"),
      );
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="size-10 animate-spin rounded-full border-4 border-[#C8102E]/20 border-t-[#C8102E]" />
        <p className="font-semibold text-[#8d857f]">{t("preparingOrder")}</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) return null;

  const totals = computedTotals;
  if (!totals || !config) return null;

  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const finalTotal = Math.max(0, totals.total - discountAmount);
  const agreementsAccepted =
    acceptedAgreements.preContract && acceptedAgreements.distanceSales;
  const agreementItems: Array<{
    key: AgreementDocumentKey;
    title: string;
  }> = [
    { key: "preContract", title: t("preContractInformation") },
    { key: "distanceSales", title: t("distanceSalesAgreement") },
  ];
  const activeAgreementTitle = activeAgreement
    ? agreementItems.find((item) => item.key === activeAgreement)?.title ?? ""
    : "";
  const activeAgreementDescription =
    activeAgreement === "distanceSales"
      ? t("distanceSalesModalDescription")
      : t("preContractModalDescription");

  return (
    <>
      <div
        className={`${layoutStyles.checkoutGrid} items-start gap-4 pb-14 sm:gap-5 lg:gap-7`}
      >
        <div
          className={`${layoutStyles.checkoutColumn} space-y-4 sm:space-y-5`}
        >
          <section
            data-checkout-section="items"
            className={`${layoutStyles.surfaceCard} overflow-hidden`}
          >
            <header
              className={`${layoutStyles.cardHeader} flex items-center gap-3 px-4 py-4 sm:px-5`}
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#fff0f2] text-[#C8102E]">
                <ShoppingBag aria-hidden="true" className="size-[18px]" strokeWidth={2} />
              </span>
              <h2 className="text-sm font-extrabold text-[#1a1817] sm:text-base">
                {t("itemsInOrder")} ({cart.items.length})
              </h2>
            </header>

            <div className={layoutStyles.productList}>
              {cart.items.map((item) => {
                const resolvedPrice = resolveProductPrice(item.product);
                const unitPrice = resolvedPrice
                  ? resolvedPrice.salePrice ?? resolvedPrice.price
                  : null;
                const variantName = item.variant
                  ? locale === "en" && item.variant.colorEn
                    ? item.variant.colorEn
                    : item.variant.color
                  : null;

                return (
                  <article
                    key={item.id}
                    className={`${layoutStyles.productRow} flex gap-3 py-4 sm:gap-4 sm:py-5`}
                  >
                    <Link
                      href={`/product/${item.product.id}`}
                      className={`${layoutStyles.thumbnail} relative size-16 shrink-0 overflow-hidden sm:size-[72px]`}
                    >
                      {item.product.thumbnail ? (
                        <Image
                          src={item.product.thumbnail}
                          alt={item.product.title}
                          fill
                          sizes="72px"
                          className="object-cover"
                        />
                      ) : (
                        <Package
                          aria-hidden="true"
                          className="absolute inset-0 m-auto size-7 text-[#b7afa8]"
                        />
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/product/${item.product.id}`}
                            className="line-clamp-2 text-sm font-semibold leading-5 text-[#1a1817] transition-colors hover:text-[#C8102E] sm:text-[15px]"
                          >
                            {item.product.title}
                          </Link>
                          {variantName ? (
                            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#77706a] sm:text-xs">
                              {item.variant?.colorHex ? (
                                <span
                                  className="size-2.5 rounded-full border border-black/10"
                                  style={{ backgroundColor: item.variant.colorHex }}
                                />
                              ) : null}
                              {variantName}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[11px] text-[#77706a] sm:text-xs">
                            {t("quantity", { count: item.quantity })}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-[#24211f] sm:text-[15px]">
                          {unitPrice === null ? "—" : formatPrice(unitPrice)}
                        </p>
                      </div>

                      <p className="mt-2 text-right text-[11px] font-medium text-[#77706a] sm:text-xs">
                        {t("subtotal")}{" "}
                        <span className="font-bold text-[#C8102E]">
                          {unitPrice === null
                            ? "—"
                            : formatPrice(unitPrice * item.quantity)}
                        </span>
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section
            data-checkout-section="shipping"
            className={`${layoutStyles.shippingCard} flex items-start gap-3 p-4 sm:gap-4 sm:p-5`}
          >
            <span
              className={`${layoutStyles.shippingIcon} flex size-10 shrink-0 items-center justify-center rounded-xl`}
            >
              <Truck aria-hidden="true" className="size-5" strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-extrabold text-[#1a1817] sm:text-[15px]">
                {t("shippingInfo")}
              </h2>
              <p className="mt-1 text-xs leading-5 text-[#617087] sm:text-sm">
                {totals.shippingAmount === 0
                  ? t("freeShippingMessage")
                  : t("standardShipping", {
                      fee: (
                        (currency === "USD"
                          ? config.usdShippingFee
                          : config.shippingFee) / 100
                      ).toFixed(2),
                    })}
              </p>
            </div>
            {totals.shippingAmount === 0 ? (
              <span className={layoutStyles.shippingBadge}>
                <Gift aria-hidden="true" className="size-3.5" />
                {t("freeShippingBadge")}
              </span>
            ) : null}
          </section>
        </div>

        <aside
          className={`${layoutStyles.checkoutColumn} lg:sticky lg:top-24`}
        >
          <section
            data-checkout-section="summary"
            className={`${layoutStyles.surfaceCard} ${layoutStyles.summaryCard} space-y-5`}
          >
            <h2
              className={`${layoutStyles.summaryTitle} text-lg font-extrabold tracking-tight text-[#1a1817] sm:text-xl`}
            >
              <span className={layoutStyles.summaryTitleIcon}>
                <ReceiptText aria-hidden="true" className="size-[18px]" />
              </span>
              <span>{t("orderSummary")}</span>
            </h2>

            {!appliedCoupon ? (
              <div className="space-y-2">
                <div className={layoutStyles.couponRow}>
                  <div className={layoutStyles.couponField}>
                    <Tag aria-hidden="true" className={layoutStyles.couponIcon} />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(event) => {
                        setCouponInput(event.target.value);
                        setCouponError("");
                      }}
                      onKeyDown={(event) =>
                        event.key === "Enter" && applyCoupon()
                      }
                      placeholder={t("couponPlaceholder")}
                      disabled={couponLoading || creating}
                      className={`${layoutStyles.control} ${layoutStyles.couponInput} text-sm placeholder:text-[#aaa29a]`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponInput.trim() || creating}
                    className={`${layoutStyles.couponButton} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]/25 disabled:opacity-40`}
                  >
                    {couponLoading ? "..." : t("apply")}
                  </button>
                </div>
                {couponError ? (
                  <p className="text-xs font-medium text-red-600">
                    {couponError}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-emerald-600/15 bg-emerald-50 px-3 py-2.5">
                <div className="min-w-0">
                  <span className="text-sm font-bold text-emerald-800">
                    {appliedCoupon.code}
                  </span>
                  <span className="ml-2 text-xs text-emerald-700">
                    {appliedCoupon.type === "PERCENTAGE"
                      ? `${appliedCoupon.value}%`
                      : formatPrice(appliedCoupon.value)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  disabled={creating}
                  aria-label={tc("remove")}
                  className="rounded-lg px-2 py-1 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100"
                >
                  {tc("remove")}
                </button>
              </div>
            )}

            <div className="space-y-3 border-b border-black/[0.07] pb-5 text-sm">
              <div className="flex items-start justify-between gap-4 text-[#77706a]">
                <span className="flex flex-col">
                  {t("subtotalTaxIncluded")}
                  <span className="text-[10px] text-[#aaa29a]">
                    {t("taxIncluded")}
                  </span>
                </span>
                <span className="font-bold text-[#24211f]">
                  {formatPrice(totals.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[#77706a]">
                <span>{t("shipping")}</span>
                {totals.shippingAmount === 0 ? (
                  <span className="text-xs font-extrabold text-emerald-700">
                    {tc("free")}
                  </span>
                ) : (
                  <span className="font-bold text-[#24211f]">
                    {formatPrice(totals.shippingAmount)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 text-xs text-[#aaa29a]">
                <span>{t("estimatedTaxIncluded")}</span>
                <span className="font-medium">
                  {formatPrice(totals.taxAmount)}
                </span>
              </div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-4 text-sm text-emerald-700">
                  <span>{t("discount", { code: appliedCoupon.code })}</span>
                  <span className="font-bold">
                    -{formatPrice(discountAmount)}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex items-end justify-between gap-4">
              <span className="text-base font-extrabold text-[#1a1817]">
                {t("total")}
              </span>
              <div className="text-right">
                {appliedCoupon ? (
                  <p className="text-xs text-[#aaa29a] line-through">
                    {formatPrice(totals.total)}
                  </p>
                ) : null}
                <span className={layoutStyles.totalValue}>
                  {formatPrice(finalTotal)}
                </span>
              </div>
            </div>

            <div
              className={`${layoutStyles.totalsSection} space-y-4 pt-5`}
            >
              <fieldset className="space-y-2">
                <legend className="mb-2 block text-sm font-extrabold text-[#3b3734]">
                  {t("paymentMethod")}
                </legend>
                <div className={layoutStyles.paymentOptions}>
                  {(["BANK_TRANSFER", "IYZICO"] as const).map((method) => {
                    const unavailable =
                      method === "IYZICO" && currency !== "TRY";
                    const selected = paymentMethod === method;
                    const MethodIcon =
                      method === "BANK_TRANSFER" ? Landmark : CreditCard;

                    return (
                      <label
                        key={method}
                        data-selected={selected ? "true" : "false"}
                        data-unavailable={unavailable ? "true" : "false"}
                        className={layoutStyles.paymentOption}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={selected}
                          onChange={() => {
                            setPaymentMethod(method);
                            resetAgreementReview();
                          }}
                          disabled={creating || unavailable}
                          className={layoutStyles.paymentRadio}
                        />
                        <MethodIcon
                          aria-hidden="true"
                          className={layoutStyles.paymentIcon}
                          strokeWidth={1.9}
                        />
                        <span className={layoutStyles.paymentCopy}>
                          <span className={layoutStyles.paymentTitle}>
                            {t(
                              method === "BANK_TRANSFER"
                                ? "bankTransferOption"
                                : "cardOption",
                            )}
                          </span>
                          {method === "IYZICO" ? (
                            <span className={layoutStyles.paymentHelper}>
                              {t("iyzicoSecurePayment")}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="space-y-2">
                <label
                  className="block text-sm font-extrabold text-[#3b3734]"
                  htmlFor="agreement-address"
                >
                  {t("deliveryAddress")}
                </label>
                <div className={layoutStyles.addressField}>
                  <MapPin
                    aria-hidden="true"
                    className={layoutStyles.addressIcon}
                  />
                  <select
                    id="agreement-address"
                    value={selectedAddressId}
                    onChange={(event) => {
                      setSelectedAddressId(event.target.value);
                      resetAgreementReview();
                    }}
                    disabled={creating}
                    className={`${layoutStyles.control} ${layoutStyles.addressSelect} text-sm text-[#3b3734]`}
                  >
                    <option value="">{t("selectDeliveryAddress")}</option>
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.title} — {address.firstName} {address.lastName},{" "}
                        {address.district}/{address.city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {agreementItems.map((document) => {
                  const accepted = acceptedAgreements[document.key];
                  const isLoading = reviewingAgreement === document.key;
                  const disabled =
                    !selectedAddressId ||
                    reviewingAgreement !== null ||
                    creating;

                  return (
                    <div
                      key={document.key}
                      data-agreement-key={document.key}
                      data-accepted={accepted ? "true" : "false"}
                      aria-busy={isLoading}
                      aria-disabled={disabled ? "true" : "false"}
                      role="button"
                      tabIndex={disabled ? -1 : 0}
                      onClick={() => {
                        if (!disabled) reviewAgreement(document.key);
                      }}
                      onKeyDown={(event) => {
                        if (
                          !disabled &&
                          event.target === event.currentTarget &&
                          (event.key === "Enter" || event.key === " ")
                        ) {
                          event.preventDefault();
                          reviewAgreement(document.key);
                        }
                      }}
                      className={layoutStyles.consentRow}
                    >
                      <input
                        type="checkbox"
                        checked={accepted}
                        readOnly
                        disabled={disabled}
                        aria-label={document.title}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (!disabled) reviewAgreement(document.key);
                        }}
                        className="size-4 shrink-0 cursor-pointer rounded border-black/20 accent-[#C8102E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]/30 disabled:cursor-not-allowed"
                      />
                      <ReceiptText
                        aria-hidden="true"
                        className="size-[17px] shrink-0 text-[#6f6862]"
                        strokeWidth={1.9}
                      />
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block text-xs font-extrabold leading-4 text-[#292522] sm:text-sm">
                          {document.title}
                        </span>
                        <span
                          className={`mt-0.5 block text-[10px] font-medium sm:text-[11px] ${accepted ? "text-emerald-700" : "text-[#8d857f]"}`}
                        >
                          {isLoading
                            ? t("preparingDocuments")
                            : accepted
                              ? t("documentAccepted")
                              : t("reviewAndAccept")}
                        </span>
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        className="size-4 shrink-0 text-[#9a928b]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={createOrder}
                disabled={
                  creating ||
                  !selectedAddressId ||
                  !agreementPreview ||
                  !agreementsAccepted
                }
                className={`${layoutStyles.primaryCta} flex items-center justify-center gap-2 px-4 text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]/35 focus-visible:ring-offset-2`}
              >
                {creating ? t("processing") : t("confirmPayment")}
                {!creating ? (
                  <ArrowRight aria-hidden="true" className="size-4" />
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => router.push("/cart")}
                disabled={creating}
                className={`${layoutStyles.secondaryAction} flex items-center justify-center gap-2 text-sm font-bold text-[#77706a] transition-colors hover:text-[#C8102E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]/25`}
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                {t("backToCart")}
              </button>
            </div>

            <div
              className={`${layoutStyles.secureNote} flex items-center justify-center gap-2 pt-4 text-[11px] font-medium text-[#aaa29a]`}
            >
              <LockKeyhole aria-hidden="true" className="size-3.5" />
              {t("secureCheckout")}
            </div>
          </section>
        </aside>
      </div>

      {agreementPreview && activeAgreement ? (
        <AgreementReviewDialog
          open
          title={activeAgreementTitle}
          description={activeAgreementDescription}
          documentHtml={agreementPreview.documents[activeAgreement]}
          cancelLabel={t("cancelDocument")}
          acceptLabel={t("acceptDocument")}
          onOpenChange={(open) => {
            if (!open) setActiveAgreement(null);
          }}
          onAccept={acceptActiveAgreement}
        />
      ) : null}
    </>
  );
}
