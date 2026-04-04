import { LitElement } from 'lit';

export type DraggingEvent = CustomEvent<{
    scrollTop: number;
}>;
export type ArrowClickedEvent = DraggingEvent;
export declare class MissingFakeScrollbar extends LitElement {
    targetScrollHeight: number;
    targetClientHeight: number;
    arrowClickScrollTopDelta: number;
    computedTargetScrollTop: number;
    trackOffset: number;
    trackHeight: number;
    computedThumbSize: number;
    thumbTop: number;
    dragging: boolean;
    private mouseDownOffsetY;
    private thumb?;
    private track?;
    private mouseMoveListener;
    private mouseUpListener;
    private resizeObserverListener;
    private resizeObserver;
    private mouseMoveEventDebounceListener;
    static styles: import('lit').CSSResult;
    protected render(): import('lit-html').TemplateResult<1>;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected updated(changedProperties: Map<string, unknown>): void;
    private reconfigureThumbSize;
    private initialiseMouseDown;
    private mouseMoveCB;
    private mouseUpCB;
    setToScrollTop(scrollTop: number): void;
    changeScrollTop(delta: number): void;
    private resizeObserverCB;
}
//# sourceMappingURL=fake-scrollbar.d.ts.map