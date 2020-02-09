export interface ApiResponse {
    pagination: {
        more: boolean;
        count: number;
    };
    results: object[];
}
