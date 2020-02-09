import { TemplateManager } from './template-manager'

export class DefaultTemplateManager implements TemplateManager {
    getRootTemplate(): string {
        return `
            <div class="search-box-term-input-container">
                <input class="search-box-term-input" />
                <div class="search-box-arrow-up">&#8963;</div>
                <div class="search-box-arrow-down">&#8964;</div>
            </div>
            <ul class="search-box-results"></ul>
        `;
    }

    getResultItemTemplate(id: string, title: string, term: string): string {
        return `
            <li class="search-box-result" data-id="${id}" data-value="${title}">
               ${title} 
            </li>
        `;
    }

    getSpinner(): string {
        return `<div class="loader">Loading...</div>`;
    }

    getEmptyResultItem(): string {
        return '<li class="search-box-empty-item">No entries found</li>'
    }
}
