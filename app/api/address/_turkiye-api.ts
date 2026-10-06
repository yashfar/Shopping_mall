const TURKIYE_API_BASE_URL = "https://api.turkiyeapi.dev/v2";
const TURKIYE_DATASET_BASE_URL =
    "https://raw.githubusercontent.com/ubeydeozdmr/turkiye-api/main/datasets/2025";
const REQUEST_TIMEOUT_MS = 2_500;
const MAX_ATTEMPTS = 2;

type DatasetName = "provinces" | "districts" | "neighborhoods";

type DatasetFallback = {
    dataset: DatasetName;
    filter?: (item: unknown) => boolean;
};

type TurkiyeApiEnvelope = {
    data?: unknown;
};

const wait = (milliseconds: number) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchDatasetFallback({
    dataset,
    filter,
}: DatasetFallback): Promise<unknown[]> {
    const response = await fetch(`${TURKIYE_DATASET_BASE_URL}/${dataset}.json`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 86_400 },
        signal: AbortSignal.timeout(6_000),
    });

    if (!response.ok) {
        throw new Error(`TurkiyeAPI dataset responded with ${response.status}`);
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
        throw new Error("TurkiyeAPI dataset returned an invalid payload");
    }

    return filter ? payload.filter(filter) : payload;
}

async function fetchLiveCollection(path: string): Promise<unknown[]> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        try {
            const response = await fetch(`${TURKIYE_API_BASE_URL}${path}`, {
                headers: { Accept: "application/json" },
                next: { revalidate: 86_400 },
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            });

            if (!response.ok) {
                throw new Error(`TurkiyeAPI responded with ${response.status}`);
            }

            const payload = (await response.json()) as TurkiyeApiEnvelope;
            if (!Array.isArray(payload.data)) {
                throw new Error("TurkiyeAPI returned an invalid collection payload");
            }

            return payload.data;
        } catch (error) {
            lastError = error;
            if (attempt < MAX_ATTEMPTS) await wait(150);
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error("TurkiyeAPI request failed");
}

export async function fetchTurkiyeApiCollection(
    path: string,
    fallback?: DatasetFallback
): Promise<unknown[]> {
    if (!fallback) return fetchLiveCollection(path);

    try {
        return await Promise.any([
            fetchLiveCollection(path),
            fetchDatasetFallback(fallback),
        ]);
    } catch (error) {
        if (error instanceof AggregateError) {
            const messages = error.errors.map((item) =>
                item instanceof Error ? item.message : "Unknown upstream error"
            );
            throw new Error(`TurkiyeAPI sources failed: ${messages.join("; ")}`);
        }

        throw error;
    }
}

export function isNumericId(value: string): boolean {
    return /^\d+$/.test(value);
}
