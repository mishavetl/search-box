import { TemplateManager } from './template-manager'

export class DefaultTemplateManager implements TemplateManager {
    getRootTemplate(): string {
        return `
            <div class="search-box-root">
                <input class="search-box-term-input" />
                <ul class="search-box-results"></ul>
            </div>
        `;
    }

    getResultItemTemplate(id: string, title: string, term: string): string {
        return `
            <li class="search-box-result" data-id="${id}" data-value="${title}">
               ${title} 
            </li>
        `;
    }
}
