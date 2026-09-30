import "server-only";

import Iyzipay from "iyzipay";

const SANDBOX_BASE_URL = "https://sandbox-api.iyzipay.com";

export type IyzicoClient = InstanceType<typeof Iyzipay>;

let client: IyzicoClient | undefined;

function requireCredential(name: "IYZICO_API_KEY" | "IYZICO_SECRET_KEY"): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`Missing required server environment variable: ${name}`);
    return value;
}

function getBaseUrl(): string {
    const configuredUrl = process.env.IYZICO_BASE_URL?.trim();
    if (configuredUrl) return configuredUrl;

    if (process.env.NODE_ENV !== "production") return SANDBOX_BASE_URL;

    throw new Error("Missing required server environment variable: IYZICO_BASE_URL");
}

export function getIyzicoClient(): IyzicoClient {
    if (client) return client;

    client = new Iyzipay({
        apiKey: requireCredential("IYZICO_API_KEY"),
        secretKey: requireCredential("IYZICO_SECRET_KEY"),
        uri: getBaseUrl(),
    });

    return client;
}
