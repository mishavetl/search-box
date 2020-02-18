import { DataProvider } from './data-provider'
import { TemplateManager } from './template-manager'
import { insertAfter } from './dom-utils'
import debounce from 'lodash/debounce'
import map from 'lodash/map'
import each from 'lodash/each'
import { TermInputKeyboardHandler } from './term-input-keyboard-handler';

export class ElementController {
    private originalInputDefaultTypeAttribute: string;
    private readonly originalInputElement: HTMLInputElement;

    private termInputKeyboardHandler: TermInputKeyboardHandler;

    private rootElement: HTMLDivElement;
    private termInputElement: HTMLInputElement;
    private resultsElement: HTMLInputElement;

    private dataProvider: DataProvider;
    private templateManager: TemplateManager;

    private focusInEvent;
    private focusOutEvent;
    private changeEvent;
    private scrollEvent;
    private arrowFocusEvent;
    private clearEvent;

    private resultPickEvent;
    private resultMouseOverEvent;

    private resultElementsMouseOverEvents: [HTMLElement, EventListener][] = [];
    private resultElementsClickEvents: [HTMLElement, EventListener][] = [];

    private debouncedUpdateResults;

    public constructor(
        dataProvider: DataProvider, templateManager: TemplateManager, originalInputElement: HTMLInputElement
    ) {
        this.dataProvider = dataProvider;
        this.templateManager = templateManager;
        this.originalInputElement = originalInputElement;
        this.addTemplate();
        this.addEvents();
        this.initializeValue();
        this.termInputKeyboardHandler = new TermInputKeyboardHandler(
            this.termInputElement,
            this.resultsElement,
            () => this.close(),
            (resultElement) => this.pickElement(resultElement)
        );
    }

    private async initializeValue() {
        if (this.originalInputElement.value != '') {
            const title = await this.dataProvider.getTitle(this.originalInputElement.value);
            this.originalInputElement.setAttribute('data-value', title);
            this.termInputElement.value = title;
            this.rootElement.classList.add('picked');
        }
    }

    private addTemplate(): void {
        this.originalInputDefaultTypeAttribute = this.originalInputElement.type;
        this.originalInputElement.type = 'hidden';
        this.rootElement = <HTMLDivElement> document.createElement('div');
        this.rootElement.innerHTML = this.templateManager.getRootTemplate();
        insertAfter(this.rootElement, this.originalInputElement);
        this.termInputElement = this.rootElement.querySelector('.search-box-term-input');
        this.resultsElement = this.rootElement.querySelector('.search-box-results');
        this.rootElement.classList.add('search-box-root');
    }

    private removeTemplate(): void {
        this.originalInputElement.type = this.originalInputDefaultTypeAttribute;
        this.rootElement.parentNode.removeChild(this.rootElement);
    }

    public open(): void {
        this.termInputElement.focus();

        if (this.termInputElement.value == '' ||
            this.originalInputElement.getAttribute('data-value') == this.termInputElement.value
        ) {
            this.termInputElement.placeholder = this.termInputElement.value;
            this.termInputElement.value = '';
        }
        this.onTermInputElementChange(new Event('change'));
        this.rootElement.classList.add('picking');
    }

    public close(): void {
        if (this.termInputElement.value === '') {
            this.termInputElement.value = this.termInputElement.placeholder;
            this.termInputElement.placeholder = 'Click for options';
        }
        this.rootElement.classList.remove('picking');
    }

    private onTermInputElementFocusIn(): void {
        this.open();
    }

    private onTermInputElementFocusOut(event: FocusEvent): void {
        if (this.rootElement.querySelectorAll(':hover').length > 0) {
            event.preventDefault();
            return;
        }
        this.close();
    }

    private async updateResults(term: string, merge= false) {
        if (!merge) {
            this.dataProvider.page = 1;
        }
        const results: object[] = await this.dataProvider.getResults(term);
        const resultsHtml: string = map(results, (result, index) => {
            return this.templateManager.getResultItemTemplate(
                result[this.dataProvider.idProperty],
                result[this.dataProvider.termProperty],
                term,
                index === 0
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
        this.rootElement.classList.remove('search-box-root-loading');
    }

    private onTermInputElementChange(evt: Event): void {
        if (this.dataProvider.data.has(this.termInputElement.value + '\n' + this.dataProvider.page)) {
            this.updateResults(this.termInputElement.value);
            return;
        }
        this.removeResultsEvents();
        this.rootElement.classList.add('search-box-root-loading');
        this.resultsElement.innerHTML = this.templateManager.getSpinner();
        this.debouncedUpdateResults();
    }

    private onTermInputElementKeyDown(evt: KeyboardEvent): void {
        this.termInputKeyboardHandler.handle(evt);
    }

    private setValue(id: string, value: string): void {
        this.originalInputElement.setAttribute('value', id);
        this.originalInputElement.setAttribute('data-value', value);
        this.originalInputElement.dispatchEvent(new Event('value-set'));
        this.termInputElement.setAttribute('data-id', id);
        this.termInputElement.value = value;
        this.termInputElement.placeholder = 'Click for options';
        this.rootElement.classList.remove('picking');
    }

    private pickElement(resultElement: HTMLElement): void {
        this.setValue(resultElement.getAttribute('data-id'), resultElement.getAttribute('data-value'));
        this.rootElement.classList.add('picked');
        this.termInputElement.blur();
    }

    private onResultElementClick(event: Event): void {
        const resultElement: HTMLElement = <HTMLElement> event.target;
        this.pickElement(resultElement);
    }

    private onResultElementMouseOver(event: Event): void {
        const resultElement: HTMLElement = <HTMLElement> event.target;
        const previouslyHovered = this.resultsElement.querySelector('li.hovered');
        if (previouslyHovered !== null) {
            previouslyHovered.classList.remove('hovered');
        }
        resultElement.classList.add('hovered');
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

    private onClearEvent(): void {
        this.setValue('', '');
        this.rootElement.classList.remove('picked');
    }

    private addResultsEvents(): void {
        this.resultElementsMouseOverEvents = map(this.resultsElement.querySelectorAll('.search-box-result'), (element: HTMLElement) => {
            element.addEventListener('mouseover', this.resultMouseOverEvent);
            return [element, this.resultMouseOverEvent];
        });
        this.resultElementsClickEvents = map(this.resultsElement.querySelectorAll('.search-box-result'), (element: HTMLElement) => {
            element.addEventListener('click', this.resultPickEvent);
            return [element, this.resultPickEvent];
        });
    }

    private removeResultsEvents(): void {
        each(this.resultElementsMouseOverEvents, (elementEventTuple) => {
            const [element, callback] = elementEventTuple;
            element.removeEventListener('mouseover', callback);
        });
        each(this.resultElementsClickEvents, (elementEventTuple) => {
            const [element, callback] = elementEventTuple;
            element.removeEventListener('click', callback);
        });
        this.resultElementsClickEvents = [];
    }

    private addEvents(): void {
        this.focusInEvent = () => this.onTermInputElementFocusIn();
        this.focusOutEvent = (event) => this.onTermInputElementFocusOut(event);
        this.changeEvent = (event) => this.onTermInputElementChange(event);
        this.scrollEvent = () => this.onResultsElementScroll();
        this.arrowFocusEvent = () => this.termInputElement.focus();
        this.clearEvent = () => this.onClearEvent();
        this.debouncedUpdateResults = debounce( () => this.updateResults(this.termInputElement.value), 300);

        this.resultMouseOverEvent = (event) => this.onResultElementMouseOver(event);
        this.resultPickEvent = (event) => this.onResultElementClick(event);

        this.termInputElement.addEventListener('focusin', this.focusInEvent);
        this.termInputElement.addEventListener('focusout', this.focusOutEvent);
        this.termInputElement.addEventListener('input', this.changeEvent);
        this.rootElement.querySelector('.search-box-arrow-up').addEventListener('click', this.arrowFocusEvent);
        this.rootElement.querySelector('.search-box-arrow-down').addEventListener('click', this.arrowFocusEvent);
        this.rootElement.querySelector('.search-box-clear').addEventListener('click', this.clearEvent);
        this.resultsElement.addEventListener('scroll', this.scrollEvent);
    }

    private removeEvents(): void {
        this.removeResultsEvents();
        this.termInputElement.removeEventListener('focusin', this.focusInEvent);
        this.termInputElement.removeEventListener('focusout', this.focusOutEvent);
        this.termInputElement.removeEventListener('input', this.changeEvent);
        this.rootElement.querySelector('.search-box-arrow-up').removeEventListener('click', this.arrowFocusEvent);
        this.rootElement.querySelector('.search-box-arrow-down').removeEventListener('click', this.arrowFocusEvent);
        this.rootElement.querySelector('.search-box-clear').removeEventListener('click', this.clearEvent);
        this.resultsElement.removeEventListener('scroll', this.scrollEvent);
    }

    public unbind(): void {
        this.removeEvents();
        this.removeTemplate();
        this.termInputKeyboardHandler.unbind();
    }
}
