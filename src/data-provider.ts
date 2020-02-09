import { has } from 'lodash'
import { Api } from './api'

export class DataProvider {
    private api: Api;

    public idProperty: string = 'id';
    public termProperty: string = 'name';

    public page: number = 1;
    public count: number;
    public more: boolean = true;
    public data: Map<string, object[]> = new Map<string, object[]>();

    public setUrl(url: string): void {
        this.api = new Api(url);
    }

    public getResults(term: string): Promise<object[]> {
        if (has(this.data, term)) {
            return new Promise((resolve) => {
                resolve(this.data[term]);
            });
        }
        return new Promise((resolve, reject) => {
            this.api.getResults(term, this.page).then((response) => {
                this.more = response.data.pagination.more;
                this.count = response.data.pagination.count;
                this.data[term] = response.data.results;
                resolve(response.data.results);
            }).catch(reason => {
                reject(reason);
            });
        });
    }
}
