import { DataProvider } from './data-provider'
import { TemplateManager } from './template-manager'
import { insertAfter } from './dom-utils'
import { debounce, map, each } from 'lodash'

export class ElementController {
    private originalInputDefaultHiddenAttribute: boolean;
    private readonly originalInputElement: HTMLInputElement;

    private rootElement: HTMLDivElement;
    private termInputElement: HTMLInputElement;
    private resultsElement: HTMLInputElement;

    private dataProvider: DataProvider;
    private templateManager: TemplateManager;

    private focusInEvent;
    private focusOutEvent;
    private changeEvent;
    private resultPickEvent;
    private scrollEvent;
    private resultElementsEvents: [HTMLElement, EventListener][] = [];

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
        this.rootElement.classList.add('search-box-root');
    }

    private removeTemplate(): void {
        this.originalInputElement.hidden = this.originalInputDefaultHiddenAttribute;
        this.rootElement.parentNode.removeChild(this.rootElement);
    }

    private onTermInputElementFocusIn(): void {
        this.termInputElement.placeholder = this.termInputElement.value;
        this.termInputElement.value = '';
        this.onTermInputChangeElement();
        this.rootElement.classList.add('picking');
    }

    private onTermInputElementFocusOut(event: FocusEvent): void {
        if (this.rootElement.querySelectorAll(':hover').length > 0) {
            event.preventDefault();
            return;
        }
        if (this.termInputElement.value === '') {
            this.termInputElement.value = this.termInputElement.placeholder;
            this.termInputElement.placeholder = '';
        }
        this.rootElement.classList.remove('picking');
    }

    private async updateResults(term: string, merge= false) {
        if (!merge) {
            this.dataProvider.page = 1;
        }
        const results: object[] = await this.dataProvider.getResults(term);
        const resultsHtml: string = map(results, (result) => {
            return this.templateManager.getResultItemTemplate(
                result[this.dataProvider.idProperty], result[this.dataProvider.termProperty], term
            );
        }).join('');
        this.removeResultsEvents();
        if (resultsHtml === '') {
            this.resultsElement.innerHTML = this.templateManager.getEmptyResultItem();
        } else {
            if (merge) {
                this.resultsElement.innerHTML += resultsHtml;
            } else {
                this.resultsElement.innerHTML = resultsHtml;
            }
            this.addResultsEvents();
        }
    }

    private onTermInputChangeElement() {
        if (this.dataProvider.data.has(this.termInputElement.value + '\n' + this.dataProvider.page)) {
            this.updateResults(this.termInputElement.value);
            return;
        }
        this.removeResultsEvents();
        this.resultsElement.innerHTML = this.templateManager.getSpinner();
        this.debouncedUpdateResults();
    }

    private onResultElementClick(event: Event): void {
        const resultElement: HTMLElement = <HTMLElement> event.target;
        const id = resultElement.getAttribute('data-id');
        this.originalInputElement.setAttribute('value', id);
        this.termInputElement.setAttribute('data-id', id);
        this.termInputElement.value = resultElement.getAttribute('data-value');
        this.rootElement.classList.remove('picking');
    }

    private onResultsElementScroll(): void {
        if (this.resultsElement.scrollTop + this.resultsElement.offsetHeight >= this.resultsElement.scrollHeight) {
            if (this.dataProvider.more) {
                ++this.dataProvider.page;
                this.dataProvider.more = false;
                this.updateResults(this.termInputElement.value, true);
            }
        }
    }

    private addResultsEvents() {
        this.resultElementsEvents = map(this.resultsElement.querySelectorAll('.search-box-result'), (element: HTMLElement) => {
            element.addEventListener('click', this.resultPickEvent);
            return [element, this.resultPickEvent];
        });
    }

    private removeResultsEvents() {
        each(this.resultElementsEvents, (elementEventTuple) => {
            const [element, callback] = elementEventTuple;
            element.removeEventListener('click', callback);
        });
        this.resultElementsEvents = [];
    }

    private addEvents(): void {
        this.focusInEvent = () => this.onTermInputElementFocusIn();
        this.focusOutEvent = (event) => this.onTermInputElementFocusOut(event);
        this.changeEvent = () => this.onTermInputChangeElement();
        this.resultPickEvent = (event) => this.onResultElementClick(event);
        this.scrollEvent = () => this.onResultsElementScroll();
        this.termInputElement.addEventListener('focusin', this.focusInEvent);
        this.termInputElement.addEventListener('focusout', this.focusOutEvent);
        this.termInputElement.addEventListener('input', this.changeEvent);
        this.resultsElement.addEventListener('scroll', this.scrollEvent);
    }

    private removeEvents(): void {
        this.removeResultsEvents();
        this.termInputElement.removeEventListener('focusin', this.focusInEvent);
        this.termInputElement.removeEventListener('focusout', this.focusOutEvent);
        this.termInputElement.removeEventListener('input', this.changeEvent);
        this.resultsElement.removeEventListener('scroll', this.scrollEvent);
    }

    public unbind(): void {
        this.removeEvents();
        this.removeTemplate();
    }
}
