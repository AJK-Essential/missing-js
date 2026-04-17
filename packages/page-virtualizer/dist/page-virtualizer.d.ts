import { MissingFakeScrollbar } from '@missing-js/fake-scrollbar';
import { MissingDimensionReporter } from '@missing-js/dimension-reporter';
import { virtualiserKeyboardBase } from './keyboard-base.js';

export type LoadEvent = CustomEvent<{
    indices: number[];
}>;
export declare class MissingPageVirtualizer extends virtualiserKeyboardBase {
    items: unknown[];
    defaultHeight: number;
    numOfItems: number;
    uniqueSelector: string;
    arrowClickScrollTopDelta: number;
    needsTransition: boolean;
    fakeScrollbar?: MissingFakeScrollbar;
    swipeScroll?: boolean;
    swipeDeltaMultiplier: number;
    protected globalScrollY: number;
    private initialized;
    private virtualScrollHeight;
    private containerHeight;
    private translateY;
    private startIndex;
    private hostClientHeight;
    private containerClientWidth;
    listItems: Array<MissingDimensionReporter>;
    private containerResizeObserver;
    private hostResizeObserver;
    private hostSwipeListener;
    private fakeScrollbarDraggingListener;
    private fakeScrollbarDragReleaseListener;
    private fakeScrollbarDragStopListener;
    private ft?;
    private dimensionChangedListener;
    private rawHeights;
    private pauseUpdate;
    private scrolling;
    private localScrollY;
    private rawHeightUpdates;
    private container;
    private containerComputedStyle;
    private innerSlot;
    private scrollTimeout?;
    private scrollWaitTime;
    private swipePhysics?;
    private slotChangedResolve?;
    private jumpSkipping;
    private accumulatedDelta;
    private pendingViewTranslate?;
    private recoveryTimeout?;
    static styles: import('lit').CSSResult;
    render(): import('lit-html').TemplateResult<1>;
    initialize(): void;
    updated(changedProperties: Map<string, unknown>): void;
    disconnectedCallback(): void;
    protected scrollByAmt(amt: number, byPassTransitions?: boolean): void;
    private onPowerScroll;
    private setScrollTopAndTransform;
    getTranslateXY(data: {
        element: HTMLElement;
    } | {
        styleDeclaration: CSSStyleDeclaration;
    }): {
        translateX: number;
        translateY: number;
    };
    updateContainerHeight(): void;
    containerResize(): void;
    dimensionChangedCB(e: Event): void;
    slowScrollBy(delta?: number, byPassTransitions?: boolean): void;
    updateTotalVirtualHeight(): void;
    addNewData(type: "append" | "prepend", newItems: typeof this.items): void;
    goToPageIndex(pageIndex: number): void;
    jumpToScrollTop(scrollTop: number, setInternalFakeScrollbarPosition?: boolean, dispatchEvent?: boolean): void;
    getCurrentScrollTop(): number;
    tillPainted(): Promise<unknown>;
    tillStable(elements: Element[]): Promise<void>;
    allStable(elementsToCheckAnimationEnd?: Element[]): Promise<void>;
    private hostResize;
    private onFakeScrollbarDragging;
    private onFakeScrollbarDragStop;
    private onFakeScrollbarDragRelease;
    setScrollStateFromCurrentView(localScrollY?: number): void;
    updateMemoryWithNewHeights(): void;
    getCurrentPageIndex(): number | undefined;
    getPageIndexForScrollTop(scrollTop: number): number | undefined;
    protected onKeyDown(key: "arrowdown" | "arrowup" | "pageup" | "pagedown", increment: number): Promise<void>;
    protected onKeyUp(key: typeof KeyboardEvent.prototype.key): void;
    protected stableJumpTo(scrollTop: number): void;
    onPageResize(index: number, element: MissingDimensionReporter): void;
    onElementResize(element: MissingDimensionReporter): void;
    getComputedLocalScrollY(): number;
    runAfterAllTransitions(transitioners: HTMLElement[]): Promise<void>;
    jumpRelease(): void;
    onHostSwipe(e: Event): void;
    /**
     * This function is for highly accurate jumps to a particular
     * location. Accuracy means, this function will take into account the
     * updated heights after render and then correctly move to the required
     * scrollTop. Little computationally expensive as Lit has to
     * render twice, but if it is needed say to jump across
     * a 1000 pages like a page up or page down, this
     * function will come in handy.
     *
     * Make sure ` this.updateMemoryWithNewHeights();
     * this.setScrollStateFromCurrentView();` are called before
     * calling this function
     * @param scrollTop
     */
    accurateJumpTo(scrollTop: number): Promise<void>;
    private createSlotChangedPromise;
    private waitForSlotChangedEvent;
    private getCurrentGlobalScrollYFromView;
    setView(): void;
    executeSetView(): void;
}
//# sourceMappingURL=page-virtualizer.d.ts.map