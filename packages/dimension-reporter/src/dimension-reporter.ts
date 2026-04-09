import { LitElement, html, css } from "lit";
import {
  customElement,
  property,
  queryAssignedElements,
} from "lit/decorators.js";

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

  @queryAssignedElements({ flatten: true })
  private _listItems!: Array<HTMLElement>;

  private io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.intersectionRatio === 0) {
          entry.target.classList.remove("fade-in");
        } else {
          entry.target.classList.add("fade-in");
        }
      }
    },
    {
      threshold: new Array(101).fill(0).map((_, ind) => ind / 100),
    },
  );

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
      }
    }
  });

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
    return html`
      <slot
        @slotchange="${() => {
          this.io.disconnect();
          if (this.isPage) {
            if (this._listItems && this._listItems.length) {
              this._listItems.forEach((listItem) => {
                listItem.classList.add("observed");
                this.io.observe(listItem);
              });
            }
          }
        }}"
      ></slot>
    `;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.resizeObserver.observe(this);
  }

  override disconnectedCallback(): void {
    this.resizeObserver.disconnect();
    if (this.io) {
      this.io.disconnect();
    }
    super.disconnectedCallback();
  }
  refreshIO() {
    if (!this.isPage) return;
    if (this.io) {
      this.io.disconnect();
    }
    this.io.observe(this);
  }
}
