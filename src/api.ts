import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { ApiResponse } from './api-response'

export class Api {
    constructor(private url: string) {}

    getResults(term: string, page: number): Promise<AxiosResponse<ApiResponse>> {
        return axios.get<ApiResponse>(this.url, {
            responseType: 'json',
            headers: {
                'Content-Type': 'application/json'
            },
            params: {term, page}
        });
    }

    getTitle(id: string) {
        return axios.get(this.url, {
            params: {id}
        });
    }
}
