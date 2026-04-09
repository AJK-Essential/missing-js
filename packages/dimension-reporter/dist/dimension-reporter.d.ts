import { LitElement } from 'lit';

export declare class MissingDimensionReporter extends LitElement {
    height: number;
    width: number;
    oldHeight: number;
    oldWidth: number;
    isPage: boolean;
    isVirtualizerItem: boolean;
    private _listItems;
    private io;
    resizeObserver: ResizeObserver;
    static styles: import('lit').CSSResult;
    render(): import('lit-html').TemplateResult<1>;
    connectedCallback(): void;
    disconnectedCallback(): void;
    refreshIO(): void;
}
//# sourceMappingURL=dimension-reporter.d.ts.map