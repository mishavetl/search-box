import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { ApiResponse } from './api-response'

export class Api {
    private api: AxiosInstance;

    constructor(url: string) {
        this.api = axios.create({
            baseURL: url,
            responseType: 'json',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    getResults(term: string, page: number): Promise<AxiosResponse<ApiResponse>> {
        return this.api.get<ApiResponse>('/', {
            params: {term, page}
        });
    }

    getTitle(id: string) {
        return this.api.get('/', {
            params: {id}
        });
    }
}
