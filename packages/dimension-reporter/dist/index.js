import { css as p, LitElement as g, html as u } from "lit";
import { property as o, customElement as b } from "lit/decorators.js";
/**
 * Missing JS - missing-dimension-reporter
 * @license MIT
 * Copyright (c) 2026 Missing JS / AJK-Essential.
 * ---------------------------------------------------------
 * Licensed under the MIT License.
 * Free for personal and commercial use.
 */
var m = Object.defineProperty, f = Object.getOwnPropertyDescriptor, h = (c, e, l, n) => {
  for (var t = n > 1 ? void 0 : n ? f(e, l) : e, s = c.length - 1, r; s >= 0; s--)
    (r = c[s]) && (t = (n ? r(e, l, t) : r(t)) || t);
  return n && t && m(e, l, t), t;
};
let i = class extends g {
  constructor() {
    super(...arguments), this.height = this.clientHeight, this.width = this.clientWidth, this.oldHeight = 0, this.oldWidth = 0, this.isPage = !1, this.resizeObserver = new ResizeObserver((c) => {
      const e = this.renderRoot.querySelector("slot");
      if (e == null ? void 0 : e.assignedElements({ flatten: !0 }).length) {
        const t = c[0].contentRect, s = t.height, r = t.width, d = Math.abs(s - this.height) > 0.5, a = Math.abs(r - this.width) > 0.5;
        (d || a) && (this.oldHeight = this.height, this.oldWidth = this.width, this.height = s, this.width = r, this.dispatchEvent(
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
    return u` <slot></slot> `;
  }
  connectedCallback() {
    super.connectedCallback(), this.resizeObserver.observe(this);
  }
  disconnectedCallback() {
    this.resizeObserver.disconnect(), super.disconnectedCallback();
  }
};
i.styles = p`
    :host {
      display: block;
      width: var(--width, fit-content);
      height: var(--height, fit-content);
    }
  `;
h([
  o({ type: Number, reflect: !0 })
], i.prototype, "height", 2);
h([
  o({ type: Number, reflect: !0 })
], i.prototype, "width", 2);
h([
  o({ type: Number, reflect: !0, attribute: "old-height" })
], i.prototype, "oldHeight", 2);
h([
  o({ type: Number, reflect: !0, attribute: "old-width" })
], i.prototype, "oldWidth", 2);
h([
  o({ type: Boolean, reflect: !0, attribute: "is-page" })
], i.prototype, "isPage", 2);
i = h([
  b("missing-dimension-reporter")
], i);
export {
  i as MissingDimensionReporter
};
//# sourceMappingURL=index.js.map
