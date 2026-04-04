import { LitElement } from 'lit';

export declare class virtualiserKeyboardBase extends LitElement {
    tabbingElementSelector?: string;
    defaultTabbing: boolean;
    defaultArrowUpNavigation: boolean;
    defaultArrowDownNavigation: boolean;
    defaultPageUpNavigation: boolean;
    defaultPageDownNavigation: boolean;
    keyboardIncrements: {
        arrowdown: number;
        arrowup: number;
        pagedown: number;
        pageup: number;
    };
    tabbingItemTransitionTime?: number;
    private shiftPressed;
    private tabPressed;
    private keyboardDownEventListener;
    private keyboardUpEventListener;
    private documentKeyboardDownListener;
    wait(ms: number): Promise<unknown>;
    protected setupKeyboardInteractions(): void;
    getNextScrollDelta(tabbedElement: HTMLElement, direction: "forwards" | "backwards", thisTop: number, thisBottom: number): number;
    disconnectedCallback(): void;
    protected scrollByAmt(amt: number, byPassTransitions?: boolean): void;
    protected scrollCheck(): void;
    protected tickFrame?: number;
    protected scrollAmt: number;
    protected direction: "UP" | "DOWN" | "STABLE";
    private tick;
    protected repeatedScrollByPixels: (amt: number) => void;
    keyboardDownEventCB(e: KeyboardEvent): void;
    keyboardUpEventCB(e: KeyboardEvent): void;
    documentKeyboardDownCB(e: KeyboardEvent): void;
    runAfterTransitions(tabbedElement: HTMLElement): Promise<void>;
    protected jumpToScrollTop(scrollTop: number): void;
    protected onKeyDown(key: "arrowdown" | "arrowup" | "pageup" | "pagedown", increment: number): void;
    protected onKeyUp(key: typeof KeyboardEvent.prototype.key): void;
}
//# sourceMappingURL=keyboard-base.d.ts.map