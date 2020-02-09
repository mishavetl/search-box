import { Api } from './api'
import {ApiResponse} from "./api-response";

export class DataProvider {
    private api: Api;

    public idProperty: string = 'id';
    public termProperty: string = 'name';

    public page: number = 1;
    public count: number;
    public more: boolean = true;
    public data: Map<string, ApiResponse> = new Map<string, ApiResponse>();

    public setUrl(url: string): void {
        this.api = new Api(url);
    }

    public getResults(term: string): Promise<object[]> {
        const key = term + '\n' + this.page;
        if (this.data.has(key)) {
            return new Promise((resolve) => {
                this.more = this.data.get(key).pagination.more;
                this.count = this.data.get(key).pagination.count;
                resolve(this.data.get(key).results);
            });
        }
        return new Promise((resolve, reject) => {
            this.api.getResults(term, this.page).then((response) => {
                this.more = response.data.pagination.more;
                this.count = response.data.pagination.count;
                this.data.set(key, response.data);
                resolve(response.data.results);
            }).catch(reason => {
                reject(reason);
            });
        });
    }
}
