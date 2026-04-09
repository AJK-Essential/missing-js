import { css as p, LitElement as u, html as b } from "lit";
import { property as h, queryAssignedElements as f, customElement as g } from "lit/decorators.js";
/**
 * Missing JS - @missing-js/dimension-reporter
 * @license MIT
 * Copyright (c) 2026 Missing JS / AJK-Essential.
 * ---------------------------------------------------------
 * Licensed under the MIT License.
 * Free for personal and commercial use.
 */
/**
 * Missing JS - @missing-js/dimension-reporter
 * @license MIT
 * Copyright (c) 2026 Missing JS / AJK-Essential.
 * ---------------------------------------------------------
 * Licensed under the MIT License.
 * Free for personal and commercial use.
 */
var m = Object.defineProperty, v = Object.getOwnPropertyDescriptor, r = (e, t, c, l) => {
  for (var i = l > 1 ? void 0 : l ? v(t, c) : t, o = e.length - 1, n; o >= 0; o--)
    (n = e[o]) && (i = (l ? n(t, c, i) : n(i)) || i);
  return l && i && m(t, c, i), i;
};
let s = class extends u {
  constructor() {
    super(...arguments), this.height = this.clientHeight, this.width = this.clientWidth, this.oldHeight = 0, this.oldWidth = 0, this.isPage = !1, this.isVirtualizerItem = !1, this.io = new IntersectionObserver(
      (e) => {
        for (const t of e)
          t.intersectionRatio === 0 ? t.target.classList.remove("fade-in") : t.target.classList.add("fade-in");
      },
      {
        threshold: new Array(101).fill(0).map((e, t) => t / 100)
      }
    ), this.resizeObserver = new ResizeObserver((e) => {
      const t = this.renderRoot.querySelector("slot");
      if (t == null ? void 0 : t.assignedElements({ flatten: !0 }).length) {
        const i = e[0].borderBoxSize, o = i[0].blockSize, n = i[0].inlineSize, a = Math.abs(o - this.height) > 0, d = Math.abs(n - this.width) > 0;
        (a || d) && (this.oldHeight = this.height, this.oldWidth = this.width, this.height = o, this.width = n, this.dispatchEvent(
          new CustomEvent("dimension-changed", {
            detail: { target: this },
            bubbles: !0,
            composed: !0
          })
        ));
      }
    });
  }
  render() {
    return b`
      <slot
        @slotchange="${() => {
      this.io.disconnect(), this.isPage && this._listItems && this._listItems.length && this._listItems.forEach((e) => {
        e.classList.add("observed"), this.io.observe(e);
      });
    }}"
      ></slot>
    `;
  }
  connectedCallback() {
    super.connectedCallback(), this.resizeObserver.observe(this);
  }
  disconnectedCallback() {
    this.resizeObserver.disconnect(), this.io && this.io.disconnect(), super.disconnectedCallback();
  }
  refreshIO() {
    this.isPage && (this.io && this.io.disconnect(), this.io.observe(this));
  }
};
s.styles = p`
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
r([
  h({ type: Number, reflect: !0 })
], s.prototype, "height", 2);
r([
  h({ type: Number, reflect: !0 })
], s.prototype, "width", 2);
r([
  h({ type: Number, reflect: !0, attribute: "old-height" })
], s.prototype, "oldHeight", 2);
r([
  h({ type: Number, reflect: !0, attribute: "old-width" })
], s.prototype, "oldWidth", 2);
r([
  h({ type: Boolean, reflect: !0, attribute: "is-page" })
], s.prototype, "isPage", 2);
r([
  h({ type: Boolean, reflect: !0, attribute: "is-virtualizer-item" })
], s.prototype, "isVirtualizerItem", 2);
r([
  f({ flatten: !0 })
], s.prototype, "_listItems", 2);
s = r([
  g("missing-dimension-reporter")
], s);
export {
  s as MissingDimensionReporter
};
//# sourceMappingURL=index.js.map
