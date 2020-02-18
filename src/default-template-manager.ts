import { TemplateManager } from './template-manager'

export class DefaultTemplateManager implements TemplateManager {
    getRootTemplate(): string {
        return `
            <div class="search-box-term-input-container">
                <input class="search-box-term-input" placeholder="Click for options" />
                <div class="search-box-arrow-up">&#8963;</div>
                <div class="search-box-arrow-down">&#8964;</div>
                <div class="search-box-clear">&#10005;</div>
            </div>
            <ul class="search-box-results"></ul>
        `;
    }

    getResultItemTemplate(id: string, title: string, term: string, first: boolean): string {
        const hoveredClass = first ? ' hovered' : '';
        return `
            <li class="search-box-result${hoveredClass}" data-id="${id}" data-value="${title}">
               ${title} 
            </li>
        `;
    }

    getSpinner(): string {
        return `<div class="search-box-loader">Loading...</div>`;
    }

    getEmptyResultItem(): string {
        return '<li class="search-box-empty-item">No entries found</li>'
    }
}
