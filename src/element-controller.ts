import { DataProvider } from './data-provider'
import { TemplateManager } from './template-manager'
import { insertAfter } from './dom-utils'
import { debounce, map, has, each } from 'lodash'

export class ElementController {
    private originalInputDefaultHiddenAttribute: boolean;
    private readonly originalInputElement: HTMLInputElement;

    private rootElement: HTMLDivElement;
    private rootTemplateElement: HTMLDivElement;
    private termInputElement: HTMLInputElement;
    private resultsElement: HTMLInputElement;

    private dataProvider: DataProvider;
    private templateManager: TemplateManager;

    private focusInEvent;
    private focusOutEvent;
    private changeEvent;
    private resultPickEvent;
    private resultElementsEvents: [HTMLElement, EventListener][];

    private debouncedUpdateResults = debounce( () => this.updateResults(this.termInputElement.value), 500);

    public constructor(
        dataProvider: DataProvider, templateManager: TemplateManager, originalInputElement: HTMLInputElement
    ) {
        this.dataProvider = dataProvider;
        this.templateManager = templateManager;
        this.originalInputElement = originalInputElement;
        this.addTemplate();
        this.addEvents();
    }

    private addTemplate(): void {
        this.originalInputDefaultHiddenAttribute = this.originalInputElement.hidden;
        this.originalInputElement.hidden = true;
        this.rootElement = <HTMLDivElement> document.createElement('div');
        this.rootElement.innerHTML = this.templateManager.getRootTemplate();
        insertAfter(this.rootElement, this.originalInputElement);
        this.termInputElement = this.rootElement.querySelector('.search-box-term-input');
        this.resultsElement = this.rootElement.querySelector('.search-box-results');
        this.rootTemplateElement = this.rootElement.querySelector('.search-box-root');
    }

    private removeTemplate(): void {
        this.originalInputElement.hidden = this.originalInputDefaultHiddenAttribute;
        this.rootElement.parentNode.removeChild(this.rootElement);
    }

    private onTermInputElementFocusIn(): void {
        this.termInputElement.placeholder = this.termInputElement.value;
        this.termInputElement.value = '';
        this.onTermInputChangeElement();
        this.rootTemplateElement.classList.toggle('picking');
    }

    private onTermInputElementFocusOut(): void {
        if (this.termInputElement.value === '') {
            this.termInputElement.value = this.termInputElement.placeholder;
            this.termInputElement.placeholder = '';
        }
        this.rootTemplateElement.classList.toggle('picking');
    }

    private async updateResults(term: string) {
        const results: object[] = await this.dataProvider.getResults(term);
        const resultsHtml: string = map(results, (result) => {
            return this.templateManager.getResultItemTemplate(
                result[this.dataProvider.idProperty], result[this.dataProvider.termProperty], term
            );
        }).join('');
        this.removeResultsEvents();
        this.resultsElement.innerHTML = resultsHtml;
        this.addResultsEvents();
    }

    private onTermInputChangeElement() {
        if (has(this.dataProvider.data, this.termInputElement.value)) {
            this.updateResults(this.termInputElement.value);
            return;
        }
        this.debouncedUpdateResults();
    }

    private onResultElementClick(event: Event): void {
        const resultElement: HTMLElement = <HTMLElement> event.target;
        const id = resultElement.getAttribute('data-id');
        this.originalInputElement.value = id;
        this.termInputElement.setAttribute('data-id', id);
        this.termInputElement.value = resultElement.getAttribute('data-value');
    }

    private addResultsEvents() {
        this.resultElementsEvents = map(this.resultsElement.querySelectorAll('.search-box-result'), (element: HTMLElement) => {
            const callback = (event) => this.resultPickEvent(event);
            element.addEventListener('click', callback);
            return [element, callback];
        });
    }

    private removeResultsEvents() {
        each(this.resultElementsEvents, (elementEventTuple) => {
            const [element, callback] = elementEventTuple;
            element.removeEventListener('click', callback);
        });
    }

    private addEvents(): void {
        this.focusInEvent = () => this.onTermInputElementFocusIn();
        this.focusOutEvent = () => this.onTermInputElementFocusOut();
        this.changeEvent = () => this.onTermInputChangeElement();
        this.resultPickEvent = (event) => this.onResultElementClick(event);
        this.termInputElement.addEventListener('focusin', this.focusInEvent);
        this.termInputElement.addEventListener('focusout', this.focusOutEvent);
        this.termInputElement.addEventListener('input', this.changeEvent);
    }

    private removeEvents(): void {
        this.termInputElement.removeEventListener('focusin', this.focusInEvent);
        this.termInputElement.removeEventListener('focusout', this.focusOutEvent);
        this.termInputElement.removeEventListener('input', this.changeEvent);
        this.termInputElement.removeEventListener('click', this.resultPickEvent);
    }

    public unbind(): void {
        this.removeEvents();
        this.removeTemplate();
    }
}
