export interface TemplateManager {
    getRootTemplate(): string;

    getResultItemTemplate(id: string, title: string, term: string): string;
}
