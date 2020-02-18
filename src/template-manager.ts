export interface TemplateManager {
    getRootTemplate(): string;

    getResultItemTemplate(id: string, title: string, term: string, first: boolean): string;

    getSpinner(): string;

    getEmptyResultItem(): string;
}
