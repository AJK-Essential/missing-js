import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("missing-dimension-reporter")
export class MissingDimensionReporter extends LitElement {
  @property({ type: Number, reflect: true })
  height = this.clientHeight;

  @property({ type: Number, reflect: true })
  width = this.clientWidth;

  @property({ type: Number, reflect: true, attribute: "old-height" })
  oldHeight = 0;

  @property({ type: Number, reflect: true, attribute: "old-width" })
  oldWidth = 0;

  @property({ type: Boolean, reflect: true, attribute: "is-page" })
  isPage = false;

  @property({ type: Boolean, reflect: true, attribute: "is-virtualizer-item" })
  isVirtualizerItem = false;

  private _resolveReady?: ((value: ResizeObserverEntry[]) => void) | null;
  public isReady: Promise<ResizeObserverEntry[]>;

  resizeObserver = new ResizeObserver((entries) => {
    const slot = this.renderRoot.querySelector("slot");
    const containsElements = slot?.assignedElements({ flatten: true }).length;
    if (containsElements) {
      const entry = entries[0];
      const rect = entry.borderBoxSize;
      const newHeight = rect[0].blockSize;
      const newWidth = rect[0].inlineSize;
      const heightChanged = Math.abs(newHeight - this.height) > 0;
      const widthChanged = Math.abs(newWidth - this.width) > 0;
      if (heightChanged || widthChanged) {
        this.oldHeight = this.height;
        this.oldWidth = this.width;
        this.height = newHeight;
        this.width = newWidth;
        this.dispatchEvent(
          new CustomEvent("dimension-changed", {
            detail: { target: this },
            bubbles: true,
            composed: true,
          }),
        );
        if (this._resolveReady) {
          this._resolveReady(entries);
          this._resolveReady = null;
        }
      }
    }
  });
  constructor() {
    super();
    // Initialize the "remote control" for our promise
    // we store the resolve function in a variable to call
    // it later so as to finish the promise
    this.isReady = new Promise((resolve) => {
      this._resolveReady = resolve;
    });
  }
  static override styles = css`
    * {
      box-sizing: border-box;
    }
    :host {
      display: block;
      width: var(--width, fit-content);
      height: var(--height, fit-content);
      position: relative;
    }
  `;

  override render() {
    return html` <slot></slot> `;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.resizeObserver.observe(this);
  }

  override disconnectedCallback(): void {
    this.resizeObserver.disconnect();

    super.disconnectedCallback();
  }
}
