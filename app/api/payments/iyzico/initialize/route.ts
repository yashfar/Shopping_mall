import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type {
    CheckoutFormInitializeRequest,
    CheckoutFormInitializeResponse,
} from "iyzipay";
import { auth } from "@@/lib/auth-helper";
import { getClientIp } from "@@/lib/rate-limit";
import { markPaymentFailed, markPaymentProcessing } from "@@/lib/payment-service";
import { getIyzicoClient } from "@@/lib/payments/iyzico";
import {
    getSafeIyzicoPaymentPageUrl,
    isIyzicoProcessingSessionActive,
    reconcileInactiveIyzicoSession,
} from "@@/lib/payments/iyzico-session";
import { prisma } from "@/lib/prisma";

const CALLBACK_PATH = "/api/payments/iyzico/callback";

class RequestError extends Error {
    constructor(
        readonly code: string,
        readonly status: number,
        message: string,
    ) {
        super(message);
    }
}

function minorUnitsToDecimal(amount: number): string {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
        throw new RequestError("INVALID_ORDER_AMOUNT", 422, "Order amount must be a positive integer");
    }
    return `${Math.floor(amount / 100)}.${String(amount % 100).padStart(2, "0")}`;
}

function allocateBasketTotal(total: number, weights: number[]): number[] {
    const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
    if (!Number.isSafeInteger(weightTotal) || weightTotal <= 0) {
        throw new RequestError("INVALID_ORDER_ITEMS", 422, "Order items have an invalid total");
    }

    let allocated = 0;
    return weights.map((weight, index) => {
        const amount = index === weights.length - 1
            ? total - allocated
            : Number((BigInt(total) * BigInt(weight)) / BigInt(weightTotal));
        if (amount <= 0) {
            throw new RequestError("INVALID_BASKET_ALLOCATION", 422, "Order total cannot be allocated across basket items");
        }
        allocated += amount;
        return amount;
    });
}

function getCallbackUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_URL?.trim();
    if (!baseUrl) {
        throw new RequestError("APPLICATION_URL_NOT_CONFIGURED", 500, "Application URL is not configured");
    }

    try {
        const callbackUrl = new URL(CALLBACK_PATH, baseUrl);
        const allowedProtocol = process.env.NODE_ENV === "production"
            ? callbackUrl.protocol === "https:"
            : callbackUrl.protocol === "https:" || callbackUrl.protocol === "http:";
        if (!allowedProtocol) throw new Error("Unsupported callback URL protocol");
        return callbackUrl.toString();
    } catch {
        throw new RequestError("INVALID_APPLICATION_URL", 500, "Application URL is invalid");
    }
}

function initializeCheckoutForm(
    request: CheckoutFormInitializeRequest,
): Promise<CheckoutFormInitializeResponse> {
    const client = getIyzicoClient();
    return new Promise((resolve, reject) => {
        client.checkoutFormInitialize.create(request, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    });
}

function safeFailureValue(value: string | undefined, fallback: string): string {
    return (value?.trim() || fallback).slice(0, 500);
}

function safeExceptionMessage(error: unknown): string {
    if (!(error instanceof Error)) return "Unknown SDK or network error";

    let message = error.message.slice(0, 500);
    for (const name of ["IYZICO_API_KEY", "IYZICO_SECRET_KEY"] as const) {
        const credential = process.env[name]?.trim();
        if (credential) message = message.replaceAll(credential, "[REDACTED]");
    }
    return message;
}

function isSerializationConflict(error: unknown): boolean {
    return typeof error === "object" && error !== null && "code" in error
        && (error as { code?: unknown }).code === "P2034";
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let paymentId: string | undefined;

    try {
        const body: unknown = await req.json().catch(() => null);
        const orderId = body && typeof body === "object" && "orderId" in body
            ? (body as { orderId?: unknown }).orderId
            : undefined;
        if (typeof orderId !== "string" || !orderId.trim()) {
            throw new RequestError("ORDER_ID_REQUIRED", 400, "orderId is required");
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: {
                    include: {
                        addresses: { orderBy: { updatedAt: "desc" }, take: 1 },
                    },
                },
                items: {
                    include: {
                        product: { include: { category: true } },
                    },
                },
                payments: {
                    where: { provider: "IYZICO", method: "IYZICO" },
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!order) throw new RequestError("ORDER_NOT_FOUND", 404, "Order not found");
        if (order.userId !== session.user.id) throw new RequestError("FORBIDDEN", 403, "Forbidden");
        if (order.paymentMethod !== "IYZICO") {
            throw new RequestError("INVALID_PAYMENT_METHOD", 409, "Order is not configured for iyzico");
        }
        if (order.status === "PAID" || order.payments.some((payment) => payment.status === "SUCCESS")) {
            throw new RequestError("ORDER_ALREADY_PAID", 409, "Order is already paid");
        }
        if (order.status !== "PENDING") {
            throw new RequestError("INVALID_ORDER_STATUS", 409, "Order cannot start an iyzico payment");
        }
        if (order.currencyCode !== "TRY") {
            throw new RequestError("UNSUPPORTED_CURRENCY", 422, "Only TRY is currently supported");
        }
        if (!order.items.length) throw new RequestError("ORDER_ITEMS_REQUIRED", 422, "Order has no items");
        minorUnitsToDecimal(order.total);

        for (const existingPayment of order.payments) {
            if (existingPayment.status === "PENDING") {
                throw new RequestError("PAYMENT_INITIALIZATION_IN_PROGRESS", 409, "An iyzico payment attempt is already active");
            }
            if (existingPayment.status !== "PROCESSING") continue;
            if (isIyzicoProcessingSessionActive(existingPayment)) {
                throw new RequestError("PAYMENT_INITIALIZATION_IN_PROGRESS", 409, "An iyzico payment attempt is already active");
            }

            const outcome = await reconcileInactiveIyzicoSession({
                ...existingPayment,
                order: { id: order.id, orderNumber: order.orderNumber },
            });
            if (outcome === "success") {
                throw new RequestError("ORDER_ALREADY_PAID", 409, "Order is already paid");
            }
            if (outcome === "active" || outcome === "unavailable") {
                throw new RequestError("PAYMENT_INITIALIZATION_IN_PROGRESS", 409, "An iyzico payment attempt is still active");
            }
        }

        const address = order.user.addresses[0];
        if (!address || !order.shippingAddress?.trim()) {
            throw new RequestError("ADDRESS_REQUIRED", 422, "A persisted shipping address is required");
        }

        const firstName = order.user.firstName?.trim() || address.firstName.trim();
        const lastName = order.user.lastName?.trim() || address.lastName.trim();
        const phone = order.shippingPhone?.trim() || address.phone.trim() || order.user.phone?.trim();
        if (!firstName || !lastName || !phone || !order.user.email || !address.city.trim()) {
            throw new RequestError("BUYER_DATA_REQUIRED", 422, "Required buyer information is missing");
        }

        const identityNumber = order.identityNumber?.trim();
        if (!identityNumber || !/^\d{11}$/.test(identityNumber)) {
            throw new RequestError(
                "BUYER_IDENTITY_NUMBER_REQUIRED",
                422,
                "A valid buyer identity number is required for iyzico payment",
            );
        }

        const itemWeights = order.items.map((item) => {
            if (!Number.isSafeInteger(item.price) || item.price <= 0 || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
                throw new RequestError("INVALID_ORDER_ITEMS", 422, "Order contains an invalid item");
            }
            if (!item.product.category?.name.trim()) {
                throw new RequestError("ITEM_CATEGORY_REQUIRED", 422, "Every order item requires a category for iyzico");
            }
            return item.price * item.quantity;
        });
        const allocatedAmounts = allocateBasketTotal(order.total, itemWeights);
        const amount = minorUnitsToDecimal(order.total);
        const callbackUrl = getCallbackUrl();
        const conversationId = randomUUID();
        const ip = getClientIp(req);

        const payment = await prisma.$transaction(async (tx) => {
            const existing = await tx.payment.findFirst({
                where: {
                    orderId: order.id,
                    provider: "IYZICO",
                    method: "IYZICO",
                    status: { in: ["PENDING", "PROCESSING", "SUCCESS"] },
                },
                orderBy: { createdAt: "desc" },
            });
            if (existing?.status === "SUCCESS") {
                throw new RequestError("ORDER_ALREADY_PAID", 409, "Order is already paid");
            }
            if (existing) {
                throw new RequestError("PAYMENT_INITIALIZATION_IN_PROGRESS", 409, "An iyzico payment attempt is already active");
            }

            return tx.payment.create({
                data: {
                    orderId: order.id,
                    provider: "IYZICO",
                    method: "IYZICO",
                    status: "PENDING",
                    amount: order.total,
                    currencyCode: order.currencyCode,
                    conversationId,
                },
            });
        }, { isolationLevel: "Serializable" });
        paymentId = payment.id;

        const iyzicoAddress = {
            address: order.shippingAddress.trim(),
            contactName: `${firstName} ${lastName}`,
            city: address.city.trim(),
            country: "Türkiye",
        };
        const request: CheckoutFormInitializeRequest = {
            locale: order.user.locale === "tr" ? "tr" : "en",
            conversationId,
            price: amount,
            paidPrice: amount,
            currency: "TRY",
            basketId: order.orderNumber || order.id,
            paymentGroup: "PRODUCT",
            callbackUrl,
            buyer: {
                id: order.user.id,
                name: firstName,
                surname: lastName,
                identityNumber,
                email: order.user.email,
                gsmNumber: phone,
                registrationAddress: order.shippingAddress.trim(),
                city: address.city.trim(),
                country: "Türkiye",
                registrationDate: order.user.createdAt.toISOString().slice(0, 19).replace("T", " "),
                ...(ip !== "unknown" ? { ip } : {}),
            },
            shippingAddress: iyzicoAddress,
            billingAddress: iyzicoAddress,
            basketItems: order.items.map((item, index) => ({
                id: item.id,
                name: item.quantity > 1 ? `${item.product.title} × ${item.quantity}` : item.product.title,
                category1: item.product.category!.name,
                itemType: "PHYSICAL",
                price: minorUnitsToDecimal(allocatedAmounts[index]),
            })),
        };

        let result: CheckoutFormInitializeResponse;
        try {
            result = await initializeCheckoutForm(request);
        } catch (error) {
            console.error("Iyzico Checkout Form initialize exception", {
                name: error instanceof Error ? error.name : "UnknownError",
                message: safeExceptionMessage(error),
            });
            await markPaymentFailed(payment.id, {
                failureCode: "IYZICO_SDK_ERROR",
                failureMessage: "Iyzico initialization request failed",
            });
            return NextResponse.json({ error: "IYZICO_INITIALIZATION_FAILED" }, { status: 502 });
        }

        const paymentPageUrl = getSafeIyzicoPaymentPageUrl(
            result.paymentPageUrl ?? null,
            result.token ?? null,
        );
        if (
            result.status !== "success"
            || !result.token
            || !paymentPageUrl
            || result.conversationId !== conversationId
        ) {
            const diagnostic = result as CheckoutFormInitializeResponse & {
                errorGroup?: string;
                locale?: string;
            };
            console.error("Iyzico Checkout Form initialize failed", {
                status: diagnostic.status,
                errorCode: diagnostic.errorCode,
                errorMessage: diagnostic.errorMessage,
                errorGroup: diagnostic.errorGroup,
                locale: diagnostic.locale,
                conversationId: diagnostic.conversationId,
            });
            await markPaymentFailed(payment.id, {
                failureCode: safeFailureValue(result.errorCode, "IYZICO_INITIALIZATION_FAILED"),
                failureMessage: safeFailureValue(result.errorMessage, "Iyzico initialization failed"),
            });
            return NextResponse.json({ error: "IYZICO_INITIALIZATION_FAILED" }, { status: 502 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: payment.id },
                data: { token: result.token, paymentPageUrl },
            });
            await markPaymentProcessing(payment.id, tx);
        });

        return NextResponse.json({
            paymentId: payment.id,
            token: result.token,
            paymentPageUrl,
            checkoutFormContent: null,
        });
    } catch (error) {
        if (paymentId) {
            await markPaymentFailed(paymentId, {
                failureCode: "IYZICO_INITIALIZATION_ERROR",
                failureMessage: "Iyzico initialization could not be completed",
            }).catch(() => undefined);
        }
        if (error instanceof RequestError) {
            return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
        }
        if (isSerializationConflict(error)) {
            return NextResponse.json(
                { error: "PAYMENT_INITIALIZATION_IN_PROGRESS" },
                { status: 409 },
            );
        }
        console.error("Iyzico checkout form initialization failed");
        return NextResponse.json({ error: "IYZICO_INITIALIZATION_ERROR" }, { status: 500 });
    }
}
