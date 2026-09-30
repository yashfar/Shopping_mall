declare module "iyzipay" {
    type CheckoutFormAddress = {
        address: string;
        contactName: string;
        city: string;
        country: string;
        zipCode?: string;
    };

    type CheckoutFormBuyer = {
        id: string;
        name: string;
        surname: string;
        identityNumber: string;
        email: string;
        gsmNumber: string;
        registrationAddress: string;
        city: string;
        country: string;
        ip?: string;
        zipCode?: string;
        registrationDate?: string;
        lastLoginDate?: string;
    };

    type CheckoutFormBasketItem = {
        id: string;
        name: string;
        category1: string;
        category2?: string;
        itemType: "PHYSICAL" | "VIRTUAL";
        price: string;
    };

    export type CheckoutFormInitializeRequest = {
        locale: "tr" | "en";
        conversationId: string;
        price: string;
        paidPrice: string;
        currency: "TRY" | "USD" | "EUR" | "GBP" | "NOK" | "CHF";
        basketId: string;
        paymentGroup: "PRODUCT" | "LISTING" | "SUBSCRIPTION";
        callbackUrl: string;
        buyer: CheckoutFormBuyer;
        shippingAddress: CheckoutFormAddress;
        billingAddress: CheckoutFormAddress;
        basketItems: CheckoutFormBasketItem[];
    };

    export type CheckoutFormInitializeResponse = {
        status?: "success" | "failure";
        conversationId?: string;
        token?: string;
        checkoutFormContent?: string;
        paymentPageUrl?: string;
        errorCode?: string;
        errorMessage?: string;
    };

    export type CheckoutFormRetrieveRequest = {
        locale?: "tr" | "en";
        conversationId?: string;
        token: string;
    };

    export type CheckoutFormRetrieveResponse = {
        status?: "success" | "failure";
        conversationId?: string;
        token?: string;
        paymentId?: string;
        paymentStatus?: string;
        fraudStatus?: number;
        basketId?: string;
        currency?: string;
        price?: string | number;
        paidPrice?: string | number;
        errorCode?: string;
        errorMessage?: string;
    };

    type IyzipayConfig = {
        apiKey: string;
        secretKey: string;
        uri: string;
    };

    class Iyzipay {
        constructor(config: IyzipayConfig);

        checkoutFormInitialize: {
            create(
                request: CheckoutFormInitializeRequest,
                callback: (error: unknown, result: CheckoutFormInitializeResponse) => void,
            ): void;
        };

        checkoutForm: {
            retrieve(
                request: CheckoutFormRetrieveRequest,
                callback: (error: unknown, result: CheckoutFormRetrieveResponse) => void,
            ): void;
        };
    }

    export default Iyzipay;
}
