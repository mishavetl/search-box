import { last, each } from 'lodash';
import { scrollToElement } from './dom-utils';


export class TermInputKeyboardHandler {
    private keyDownEvent = (event) => this.handle(event);

    constructor(private termInputElement: HTMLElement,
                private resultsElement: HTMLElement,
                private closeSearchBox: Function,
                private pickElement: Function) {
        this.bindEvents();
    }

    private bindEvents(): void {
        this.termInputElement.addEventListener('keydown', this.keyDownEvent);
    }

    public unbind(): void {
        this.termInputElement.removeEventListener('keypress', this.keyDownEvent);
    }

    private arrowUp(): void {
        const hoveredList = this.resultsElement.querySelectorAll('li.hovered');
        const hovered = hoveredList[0];
        if (hovered.previousElementSibling === null) {
            return;
        }
        const toBeHovered = <HTMLElement> hovered.previousElementSibling;
        toBeHovered.classList.add('hovered');
        scrollToElement(this.resultsElement, toBeHovered);
        each(hoveredList, (hovered) => hovered.classList.remove('hovered'));
    }

    private arrowDown(): void {
        const hoveredList = this.resultsElement.querySelectorAll('li.hovered');
        const hovered = last(hoveredList);
        if (hovered.nextElementSibling === null) {
            return;
        }
        const toBeHovered = <HTMLElement> hovered.nextElementSibling;
        toBeHovered.classList.add('hovered');
        scrollToElement(this.resultsElement, toBeHovered);
        each(hoveredList, (hovered) => hovered.classList.remove('hovered'));
    }

    private enter(): void {
        const hovered = this.resultsElement.querySelector('li.hovered');
        this.pickElement(hovered);
    }

    private escape(): void {
        this.termInputElement.blur();
        this.closeSearchBox();
    }

    private pageUp(): void {
        const toBeHovered = <HTMLElement> this.resultsElement.children[0];
        if (toBeHovered.classList.contains('hovered')) {
            return;
        }
        const hoveredList = this.resultsElement.querySelectorAll('li.hovered');
        toBeHovered.classList.add('hovered');
        scrollToElement(this.resultsElement, toBeHovered);
        each(hoveredList, (hovered) => hovered.classList.remove('hovered'));
    }

    public handle(evt: KeyboardEvent): void {
        if (evt.defaultPrevented) {
            return;
        }

        switch (evt.key) {
            case 'Down': // IE/Edge specific value
            case 'ArrowDown':
                this.arrowDown();
                break;
            case 'Up': // IE/Edge specific value
            case 'ArrowUp':
                this.arrowUp();
                break;
            case 'Enter':
                this.enter();
                break;
            case 'Esc': // IE/Edge specific value
            case 'Escape':
                this.escape();
                break;
            case 'PageUp':
                this.pageUp();
                break;
            default:
                return;
        }

        evt.preventDefault();
    }
}
