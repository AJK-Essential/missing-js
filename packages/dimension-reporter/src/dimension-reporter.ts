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

  resizeObserver = new ResizeObserver((entries) => {
    const slot = this.renderRoot.querySelector("slot");
    const containsElements = slot?.assignedElements({ flatten: true }).length;
    if (containsElements) {
      const entry = entries[0];
      const rect = entry.contentRect;
      const newHeight = rect.height;
      const newWidth = rect.width;
      // 0.5 below is to avoid sub-pixel change reporting
      const heightChanged = Math.abs(newHeight - this.height) > 0.5;
      const widthChanged = Math.abs(newWidth - this.width) > 0.5;
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
      }
    }
  });

  static override styles = css`
    :host {
      display: block;
      width: var(--width, fit-content);
      height: var(--height, fit-content);
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
