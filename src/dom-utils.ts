export function insertAfter(newNode: HTMLElement, referenceNode: HTMLElement): void {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

export function getInnerHeight(element): number {
    const computed = getComputedStyle(element);
    const padding = parseInt(computed.paddingTop) + parseInt(computed.paddingBottom);
    return element.clientHeight - padding
}

export function scrollToElement(container: HTMLElement, innerElement: HTMLElement): void {
    const topPosition = innerElement.offsetTop;
    const height = innerElement.offsetHeight;
    const containerHeight = getInnerHeight(container);
    const containerScrollPosition = container.scrollTop;
    if (topPosition < containerScrollPosition) {
        container.scrollTop = topPosition;
    } else if (topPosition + height > containerScrollPosition + containerHeight) {
        container.scrollTop = topPosition + height - containerHeight;
    }
}
