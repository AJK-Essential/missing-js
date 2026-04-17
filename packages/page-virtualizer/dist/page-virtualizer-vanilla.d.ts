import { MissingFakeScrollbar } from '@missing-js/fake-scrollbar';

export type LoadEventVanilla = CustomEvent<{
    indices: number[];
    translateY: string;
}>;
export declare class MissingPageVirtualizerVanilla extends HTMLElement {
    constructor();
    /**
     * Public properties
     */
    items: unknown[];
    defaultHeight: number;
    numOfItems: number;
    uniqueSelector: string;
    needsTransition: boolean;
    fakeScrollbar?: MissingFakeScrollbar;
    container?: HTMLElement;
    nextPrevious?: HTMLElement;
    /**
     * Getters & Setters & Observers.
     */
    get swipeScroll(): boolean;
    set swipeScroll(needsScroll: boolean);
    private onSwipeScrollChange;
    /**
     * States
     */
    protected globalScrollY: number;
    private initialized;
    private virtualScrollHeight;
    private translateY;
    private startIndex;
    private ft?;
    private rawHeights;
    private pauseUpdate;
    private scrolling;
    private localScrollY;
    private rawHeightUpdates;
    private containerComputedStyle;
    private scrollTimeout?;
    private scrollWaitTime;
    private thisTop;
    private containerClientWidth;
    private swipePhysics?;
    private _swipeScroll;
    /**
     * Class Method binders
     */
    private hostSwipeListener;
    private fakeScrollbarDraggingListener;
    private fakeScrollbarDragReleaseListener;
    private fakeScrollbarDragStopListener;
    private dimensionChangedListener;
    /**
     * Observers
     */
    private containerResizeObserver;
    private hostResizeObserver;
    /**
     * Public methods
     */
    connectedCallback(): void;
    initialize(): void;
    addNewData(type: "append" | "prepend", newItems: typeof this.items): void;
    /**
     * Private methods
     */
    private containerResize;
    private hostResize;
    private onFakeScrollbarDragging;
    private onFakeScrollbarDragRelease;
    private onFakeScrollbarDragStop;
    private dimensionChangedCB;
    private onPageResize;
    private onElementResize;
    private updateMemoryWithNewHeights;
    private updateTotalVirtualHeight;
    private setScrollTopAndTransform;
    private setScrollStateFromCurrentView;
    slowScrollBy(delta?: number, byPassTransitions?: boolean): void;
    private onHostSwipe;
}
//# sourceMappingURL=page-virtualizer-vanilla.d.ts.map