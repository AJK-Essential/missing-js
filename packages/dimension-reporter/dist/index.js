import { css as p, LitElement as u, html as b } from "lit";
import { property as n, customElement as g } from "lit/decorators.js";
/**
 * Missing JS - @missing-js/dimension-reporter
 * @license MIT
 * Copyright (c) 2026 Missing JS / AJK-Essential.
 * ---------------------------------------------------------
 * Licensed under the MIT License.
 * Free for personal and commercial use.
 */
var m = Object.defineProperty, y = Object.getOwnPropertyDescriptor, r = (s, i, c, l) => {
  for (var e = l > 1 ? void 0 : l ? y(i, c) : i, o = s.length - 1, h; o >= 0; o--)
    (h = s[o]) && (e = (l ? h(i, c, e) : h(e)) || e);
  return l && e && m(i, c, e), e;
};
let t = class extends u {
  constructor() {
    super(), this.height = this.clientHeight, this.width = this.clientWidth, this.oldHeight = 0, this.oldWidth = 0, this.isPage = !1, this.isVirtualizerItem = !1, this.resizeObserver = new ResizeObserver((s) => {
      const i = this.renderRoot.querySelector("slot");
      if (i == null ? void 0 : i.assignedElements({ flatten: !0 }).length) {
        const e = s[0].borderBoxSize, o = e[0].blockSize, h = e[0].inlineSize, a = Math.abs(o - this.height) > 0, d = Math.abs(h - this.width) > 0;
        (a || d) && (this.oldHeight = this.height, this.oldWidth = this.width, this.height = o, this.width = h, this.dispatchEvent(
          new CustomEvent("dimension-changed", {
            detail: { target: this },
            bubbles: !0,
            composed: !0
          })
        ), this._resolveReady && (this._resolveReady(s), this._resolveReady = null));
      }
    }), this.isReady = new Promise((s) => {
      this._resolveReady = s;
    });
  }
  render() {
    return b` <slot></slot> `;
  }
  connectedCallback() {
    super.connectedCallback(), this.resizeObserver.observe(this);
  }
  disconnectedCallback() {
    this.resizeObserver.disconnect(), super.disconnectedCallback();
  }
};
t.styles = p`
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
  n({ type: Number, reflect: !0 })
], t.prototype, "height", 2);
r([
  n({ type: Number, reflect: !0 })
], t.prototype, "width", 2);
r([
  n({ type: Number, reflect: !0, attribute: "old-height" })
], t.prototype, "oldHeight", 2);
r([
  n({ type: Number, reflect: !0, attribute: "old-width" })
], t.prototype, "oldWidth", 2);
r([
  n({ type: Boolean, reflect: !0, attribute: "is-page" })
], t.prototype, "isPage", 2);
r([
  n({ type: Boolean, reflect: !0, attribute: "is-virtualizer-item" })
], t.prototype, "isVirtualizerItem", 2);
t = r([
  g("missing-dimension-reporter")
], t);
export {
  t as MissingDimensionReporter
};
//# sourceMappingURL=index.js.map
