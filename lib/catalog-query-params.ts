interface CatalogRequestParams<TQueryParams extends object> {
    page: number;
    pageSize: number;
    locale: string;
    queryParams: TQueryParams;
}

export function buildCatalogRequestParams<TQueryParams extends object>({
    page,
    pageSize,
    locale,
    queryParams,
}: CatalogRequestParams<TQueryParams>): URLSearchParams {
    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        locale,
    });

    Object.entries(queryParams).forEach(([key, value]) => {
        if (typeof value === "string" && value !== "") {
            params.set(key, value);
        }
    });

    return params;
}
