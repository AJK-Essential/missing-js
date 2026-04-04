import { LitElement as w, css as y, html as b } from "lit";
import { property as h, state as p, customElement as v } from "lit/decorators.js";
class T {
  constructor(t) {
    this.size = t, this.tree = new Float64Array(t + 1);
  }
  /**
   * Bulk initialization in O(N) time.
   * Perfect for setting all pages to a 'defaultHeight' at startup.
   */
  initAll(t) {
    this.values = t;
    for (let e = 0; e < this.size; e++)
      this.tree[e + 1] = t[e];
    for (let e = 1; e <= this.size; e++) {
      let s = e + (e & -e);
      s <= this.size && (this.tree[s] += this.tree[e]);
    }
  }
  /**
   * Updates the height of an item at a specific index.
   * Time Complexity: O(log N)
   */
  update(t, e) {
    const s = e - this.values[t];
    if (s === 0) return;
    this.values[t] = e;
    let l = t + 1;
    for (; l <= this.size; )
      this.tree[l] += s, l += l & -l;
  }
  getCumulativeHeight(t) {
    let e = 0, s = t + 1;
    for (; s > 0; )
      e += this.tree[s], s -= s & -s;
    return e;
  }
  findIndexOfPixel(t) {
    if (t < 0) return 0;
    let e = 0, s = 0, l = 1 << Math.floor(Math.log2(this.size));
    for (; l > 0; ) {
      const o = e + l;
      o <= this.size && s + this.tree[o] <= t && (e = o, s += this.tree[e]), l >>= 1;
    }
    return e;
  }
  getSingleHeight(t) {
    return this.values[t];
  }
}
var k = Object.defineProperty, f = (i, t, e, s) => {
  for (var l = void 0, o = i.length - 1, r; o >= 0; o--)
    (r = i[o]) && (l = r(t, e, l) || l);
  return l && k(t, e, l), l;
};
class u extends w {
  constructor() {
    super(...arguments), this.defaultTabbing = !1, this.defaultArrowUpNavigation = !1, this.defaultArrowDownNavigation = !1, this.defaultPageUpNavigation = !1, this.defaultPageDownNavigation = !1, this.keyboardIncrements = {
      arrowdown: 5,
      arrowup: -5,
      pagedown: 2e3,
      pageup: -2e3
    }, this.shiftPressed = !1, this.tabPressed = !1, this.keyboardDownEventListener = this.keyboardDownEventCB.bind(this), this.keyboardUpEventListener = this.keyboardUpEventCB.bind(this), this.documentKeyboardDownListener = this.documentKeyboardDownCB.bind(this), this.scrollAmt = 0, this.direction = "STABLE", this.tick = () => {
      this.tickFrame && cancelAnimationFrame(this.tickFrame), this.scrollAmt && (this.scrollByAmt(this.scrollAmt, !0), this.tickFrame = requestAnimationFrame(this.tick.bind(this)));
    }, this.repeatedScrollByPixels = (t) => {
      this.tickFrame && cancelAnimationFrame(this.tickFrame), this.scrollAmt = t, this.scrollByAmt(t, !0), this.tickFrame = requestAnimationFrame(this.tick.bind(this));
    };
  }
  async wait(t) {
    return new Promise((e) => setTimeout(e, t));
  }
  setupKeyboardInteractions() {
    this.addEventListener("keydown", this.keyboardDownEventListener), window.addEventListener("keyup", this.keyboardUpEventListener), document.body.addEventListener(
      "keydown",
      this.documentKeyboardDownListener
    ), this.defaultTabbing && this.addEventListener("focusin", async (t) => {
      const e = this.getBoundingClientRect(), s = e.top, l = e.bottom, o = t.composedPath()[0];
      if (this.tabbingElementSelector) {
        let r = Array.from(
          this.querySelectorAll(this.tabbingElementSelector)
        );
        if (r.includes(o)) {
          this.scrollTop = 0;
          let a;
          if (this.tabPressed && !this.shiftPressed) {
            if (t.preventDefault(), await this.runAfterTransitions(o), r.indexOf(o) !== r.length - 1) {
              if (o.getBoundingClientRect().top < s) {
                const g = r.find(
                  (m) => m.getBoundingClientRect().top >= s
                );
                g && g.focus();
                return;
              }
              a = this.getNextScrollDelta(
                o,
                "forwards",
                s,
                l
              );
            } else {
              let d = o.getBoundingClientRect();
              a = d.top - this.clientHeight / 2 + d.height / 2;
            }
            this.tabPressed = !1, this.shiftPressed = !1, this.scrollByAmt(a), this.scrollCheck();
          } else if (this.tabPressed && this.shiftPressed) {
            if (t.preventDefault(), await this.runAfterTransitions(o), r.indexOf(o) !== 0) {
              if (o.getBoundingClientRect().bottom >= l) {
                const g = r.findLast(
                  (m) => m.getBoundingClientRect().bottom <= l
                );
                g && g.focus();
                return;
              }
              a = this.getNextScrollDelta(
                o,
                "backwards",
                s,
                l
              );
            } else {
              let d = o.getBoundingClientRect();
              a = d.top - this.clientHeight / 2 + d.height / 2;
            }
            this.tabPressed = !1, this.shiftPressed = !1, this.scrollByAmt(a), this.scrollCheck();
          }
        }
      }
    });
  }
  getNextScrollDelta(t, e, s, l) {
    let o = 0, r = t.getBoundingClientRect();
    if (e === "forwards") {
      const a = r.top < l && r.bottom <= l ? "completely-within" : r.top <= l && r.bottom > l ? "partially-within" : "out";
      a === "completely-within" ? o = 0 : (a === "partially-within" || a === "out") && (r.height >= this.clientHeight ? o = r.top - s : o = a === "out" ? r.top - this.clientHeight / 2 + r.height / 2 : r.bottom - l);
    } else {
      const a = r.bottom > s && r.top >= s ? "completely-within" : r.bottom >= s && r.top < s ? "partially-within" : "out";
      a === "completely-within" ? o = 0 : (a === "partially-within" || a === "out") && (r.height >= this.clientHeight ? o = r.bottom - l : o = a === "out" ? r.top - this.clientHeight / 2 + r.height / 2 : r.top - s);
    }
    return o;
  }
  disconnectedCallback() {
    this.removeEventListener("keydown", this.keyboardDownEventListener), window.removeEventListener("keyup", this.keyboardUpEventListener), document.body.removeEventListener(
      "keydown",
      this.documentKeyboardDownListener
    ), super.disconnectedCallback();
  }
  scrollByAmt(t, e = !1) {
  }
  scrollCheck() {
  }
  keyboardDownEventCB(t) {
    const e = t.key.toLowerCase();
    switch (e) {
      case "arrowdown":
        this.defaultArrowDownNavigation && (this.focus(), this.onKeyDown(e, this.keyboardIncrements[e]));
        break;
      case "arrowup":
        this.defaultArrowUpNavigation && (this.focus(), this.onKeyDown(e, this.keyboardIncrements[e]));
        break;
      case "pagedown":
        this.defaultPageDownNavigation && (this.focus(), t.preventDefault(), this.onKeyDown(e, this.keyboardIncrements[e]));
        break;
      case "pageup":
        this.defaultPageUpNavigation && (this.focus(), t.preventDefault(), this.onKeyDown(e, this.keyboardIncrements[e]));
        break;
    }
  }
  keyboardUpEventCB(t) {
    this.tickFrame && cancelAnimationFrame(this.tickFrame), this.scrollAmt = 0, this.tabPressed = !1, this.shiftPressed = !1, this.onKeyUp(t.key.toLowerCase());
  }
  documentKeyboardDownCB(t) {
    this.tabPressed = t.key.toLowerCase() === "tab", this.shiftPressed = t.shiftKey;
  }
  async runAfterTransitions(t) {
    if (this.tabbingItemTransitionTime !== void 0) {
      await this.wait(this.tabbingItemTransitionTime);
      return;
    }
    const e = window.getComputedStyle(t), s = parseFloat(e.transitionDuration) * 1e3, l = parseFloat(e.transitionDelay) * 1e3, o = s + l;
    o > 0 && await this.wait(o + 20);
  }
  jumpToScrollTop(t) {
  }
  onKeyDown(t, e) {
  }
  onKeyUp(t) {
  }
}
f([
  h({
    type: String,
    reflect: !0,
    attribute: "tabbing-element-selector"
  })
], u.prototype, "tabbingElementSelector");
f([
  h({ type: Boolean, reflect: !0, attribute: "default-tabbing" })
], u.prototype, "defaultTabbing");
f([
  h({
    type: Boolean,
    reflect: !0,
    attribute: "default-arrow-up-navigation"
  })
], u.prototype, "defaultArrowUpNavigation");
f([
  h({
    type: Boolean,
    reflect: !0,
    attribute: "default-arrow-down-navigation"
  })
], u.prototype, "defaultArrowDownNavigation");
f([
  h({
    type: Boolean,
    reflect: !0,
    attribute: "default-page-up-navigation"
  })
], u.prototype, "defaultPageUpNavigation");
f([
  h({
    type: Boolean,
    reflect: !0,
    attribute: "default-page-down-navigation"
  })
], u.prototype, "defaultPageDownNavigation");
f([
  h({ type: Object })
], u.prototype, "keyboardIncrements");
f([
  h({
    type: Number,
    reflect: !0,
    attribute: "tabbing-item-transition-time"
  })
], u.prototype, "tabbingItemTransitionTime");
var H = Object.defineProperty, C = Object.getOwnPropertyDescriptor, c = (i, t, e, s) => {
  for (var l = s > 1 ? void 0 : s ? C(t, e) : t, o = i.length - 1, r; o >= 0; o--)
    (r = i[o]) && (l = (s ? r(t, e, l) : r(l)) || l);
  return s && l && H(t, e, l), l;
};
let n = class extends u {
  constructor() {
    super(...arguments), this.items = [], this.defaultHeight = 200 * 10, this.numOfItems = 2, this.uniqueSelector = "", this.arrowClickScrollTopDelta = 40, this.needsTransition = !1, this.globalScrollY = 0, this.initialized = !1, this.virtualScrollHeight = this.clientHeight, this.containerHeight = 100, this.translateY = "", this.startIndex = 0, this.hostClientHeight = this.clientHeight, this.containerResizeObserver = new ResizeObserver(
      this.containerResize.bind(this)
    ), this.hostResizeObserver = new ResizeObserver(this.hostResize.bind(this)), this.fakeScrollbarDraggingListener = this.onFakeScrollbarDragging.bind(this), this.fakeScrollbarDragReleaseListener = this.onFakeScrollbarDragRelease.bind(this), this.fakeScrollbarDragStopListener = this.onFakeScrollbarDragStop.bind(this), this.dimensionChangedListener = this.dimensionChangedCB.bind(this), this.pauseUpdate = !1, this.scrolling = !1, this.localScrollY = 0, this.rawHeightUpdates = {}, this.scrollWaitTime = 250;
  }
  render() {
    return b`
      ${this.initialized ? b`
            <div
              class="container"
              style="--translateY:${this.translateY}"
              tabindex="0"
            >
              <slot
                @slotchange="${async (i) => {
      var t;
      if (this.pauseUpdate) {
        this.classList.add("by-pass");
        const e = this.innerSlot.assignedElements({
          flatten: !0
        });
        await this.tillPainted(), await this.tillStable([this.container, ...e]), this.localScrollY = this.getComputedLocalScrollY(), this.updateMemoryWithNewHeights(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (t = this.fakeScrollbar) == null || t.setToScrollTop(this.globalScrollY), this.pauseUpdate = !1, this.dispatchEvent(new CustomEvent("scroll-stopped")), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
          this.scrolling = !1;
        }, this.scrollWaitTime);
      }
    }}"
              ></slot>
            </div>
          ` : ""}
    `;
  }
  initialize() {
    this.initialized = !0, this.addEventListener("dimension-changed", this.dimensionChangedListener), this.needsTransition && this.classList.add("smooth"), this.updateComplete.then(() => {
      this.ft = new T(this.items.length), this.rawHeights = new Float64Array(this.items.length).fill(
        this.defaultHeight
      ), this.ft.initAll(this.rawHeights), this.fakeScrollbar && (this.fakeScrollbar.addEventListener(
        "dragging",
        this.fakeScrollbarDraggingListener
      ), this.fakeScrollbar.addEventListener(
        "dragRelease",
        this.fakeScrollbarDragReleaseListener
      ), this.fakeScrollbar.addEventListener(
        "drag-stopped",
        this.fakeScrollbarDragStopListener
      )), this.updateTotalVirtualHeight();
      const i = this.renderRoot;
      this.container = i.querySelector(".container"), this.innerSlot = i.querySelector("slot"), this.containerComputedStyle = getComputedStyle(this.container), this.containerResizeObserver.observe(this.container), this.hostResizeObserver.observe(this), this.dispatchEvent(
        new CustomEvent("load", {
          detail: {
            indices: [this.startIndex, this.startIndex + this.numOfItems - 1]
          }
        })
      ), this.addEventListener("scroll", () => {
        this.scrollTop = 0;
      }), this.addEventListener("wheel", (t) => {
        this.slowScrollBy(t.deltaY);
      }), this.setupKeyboardInteractions();
    });
  }
  updated(i) {
    super.updated(i), this.fakeScrollbar && (i.has("hostClientHeight") || i.has("virtualScrollHeight")) && (this.fakeScrollbar.targetClientHeight = this.hostClientHeight, this.fakeScrollbar.targetScrollHeight = this.virtualScrollHeight);
  }
  disconnectedCallback() {
    this.removeEventListener(
      "dimension-changed",
      this.dimensionChangedListener
    ), this.fakeScrollbar && (this.fakeScrollbar.removeEventListener(
      "dragging",
      this.fakeScrollbarDraggingListener
    ), this.fakeScrollbar.removeEventListener(
      "dragRelease",
      this.fakeScrollbarDragReleaseListener
    ), this.fakeScrollbar.removeEventListener(
      "drag-stopped",
      this.fakeScrollbarDragStopListener
    )), this.containerResizeObserver.disconnect(), this.hostResizeObserver.disconnect(), super.disconnectedCallback();
  }
  scrollByAmt(i, t = !1) {
    this.slowScrollBy(i, t);
  }
  onPowerScroll(i) {
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.classList.add("by-pass"), this.jumpToScrollTop(i.computedTargetScrollTop), this.dispatchEvent(new CustomEvent("scrolling")), this.scrollTop = 0;
  }
  setScrollTopAndTransform(i, t = !0) {
    var e;
    if (this.ft) {
      const s = (e = this.ft) == null ? void 0 : e.findIndexOfPixel(i), l = s !== 0 ? this.ft.getCumulativeHeight(s - 1) : 0, o = -(i - l);
      this.translateY = `${o}px`, this.startIndex = s, t && this.dispatchEvent(
        new CustomEvent("load", {
          detail: {
            indices: [this.startIndex, this.startIndex + this.numOfItems - 1]
          }
        })
      );
    }
  }
  getTranslateXY(i) {
    let t;
    "element" in i ? t = window.getComputedStyle(i.element) : t = i.styleDeclaration;
    const e = new DOMMatrixReadOnly(t.transform);
    return {
      translateX: e.m41,
      // m41 holds the translateX value
      translateY: e.m42
      // m42 holds the translateY value
    };
  }
  updateContainerHeight() {
    var t;
    (t = this.fakeScrollbar) != null && t.dragging || this.innerSlot.assignedElements({
      flatten: !0
    }).length !== this.numOfItems || (this.containerHeight = parseFloat(this.containerComputedStyle.height));
  }
  containerResize() {
    this.updateContainerHeight();
  }
  dimensionChangedCB(i) {
    if (this.scrollTop = 0, !this.ft) return;
    let e = i.detail.target;
    const s = parseInt(e.dataset.pageIndex);
    s > this.items.length - 1 || (e.isPage ? this.onPageResize(s, e) : this.onElementResize(e));
  }
  // TODO: See if this function can be eliminated in future updates
  slowScrollBy(i = 0, t = !1) {
    var e;
    if (!this.pauseUpdate)
      if (this.scrollTimeout && clearTimeout(this.scrollTimeout), this.updateMemoryWithNewHeights(), this.updateContainerHeight(), this.localScrollY = this.getComputedLocalScrollY(), this.direction = i > 0 ? "DOWN" : i < 0 ? "UP" : "STABLE", this.dispatchEvent(new CustomEvent("scrolling")), this.scrolling = !0, t ? this.classList.add("by-pass") : this.classList.remove("by-pass"), this.direction === "DOWN" && this.localScrollY + i > this.containerHeight - this.clientHeight && this.startIndex + this.numOfItems <= this.items.length - 1) {
        this.classList.add("by-pass"), this.pauseUpdate = !0;
        const s = this.querySelector(
          this.uniqueSelector
        ).getBoundingClientRect().height, l = this.containerHeight - s, r = this.localScrollY + i - s - l, a = this.startIndex + 1, d = l + r;
        this.translateY = `${-d}px`, this.startIndex = a, this.dispatchEvent(
          new CustomEvent("load", {
            detail: {
              indices: [this.startIndex, this.startIndex + this.numOfItems - 1]
            }
          })
        ), this.needsTransition && !t && this.container.animate(
          [
            // Keyframes
            { transform: `translateY(${-d + i}px)` },
            // Start
            { transform: `translateY(${-d}px)` }
            // End
          ],
          {
            // Timing options
            duration: 300,
            easing: "ease"
          }
        ).finished.then(() => {
        });
      } else if (this.direction === "UP" && this.localScrollY + i <= 0 && this.startIndex - 1 >= 0) {
        this.classList.add("by-pass"), this.pauseUpdate = !0;
        const s = this.querySelectorAll(this.uniqueSelector), o = s[s.length - 1].getBoundingClientRect().height, r = this.containerHeight - o, g = this.containerHeight - this.localScrollY + Math.abs(i) - o - r, m = r + g;
        this.translateY = `calc(-100% + ${m}px)`;
        const S = this.startIndex - 1;
        this.startIndex = S, this.dispatchEvent(
          new CustomEvent("load", {
            detail: {
              indices: [this.startIndex, this.startIndex + this.numOfItems - 1]
            }
          })
        ), this.needsTransition && !t && this.container.animate(
          [
            // Keyframes
            {
              transform: `translateY(calc(-100% + ${m + i}px))`
            },
            // Start
            {
              transform: `translateY(calc(-100% + ${m}px))`
            }
            // End
          ],
          {
            // Timing options
            duration: 300,
            easing: "ease"
          }
        ).finished.then(() => {
        });
      } else
        this.localScrollY += i, this.localScrollY = Math.min(
          Math.max(0, this.localScrollY),
          this.containerHeight - this.clientHeight
        ), this.translateY = `${-this.localScrollY}px`, this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (e = this.fakeScrollbar) == null || e.setToScrollTop(this.globalScrollY), this.allStable().then(() => {
          this.pauseUpdate || (this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
            this.scrolling = !1, this.dispatchEvent(new CustomEvent("scroll-stopped"));
          }, this.scrollWaitTime));
        });
  }
  updateTotalVirtualHeight() {
    if (this.ft && this.fakeScrollbar) {
      const i = this.items.length - 1;
      this.virtualScrollHeight = this.ft.getCumulativeHeight(i), this.fakeScrollbar.targetScrollHeight = this.virtualScrollHeight, this.globalScrollY = Math.min(
        Math.max(0, this.globalScrollY),
        this.virtualScrollHeight - this.clientHeight
      );
    }
  }
  addNewData(i, t) {
    var o, r;
    const e = t.length, s = this.items.length, l = new Float64Array(e).fill(this.defaultHeight);
    switch (i) {
      case "append":
        l.set(this.rawHeights), this.rawHeights = l, (o = this.ft) == null || o.initAll(this.rawHeights);
        break;
      case "prepend":
        {
          const a = e - s;
          l.set(this.rawHeights, a), this.rawHeights = l, (r = this.ft) == null || r.initAll(this.rawHeights);
        }
        break;
    }
  }
  goToPageIndex(i) {
    if (this.ft) {
      const t = Math.min(
        Math.max(0, i),
        this.rawHeights.length - 1
      );
      i < 0 ? console.warn(
        "pageIndex provided is less than min page-index of 0. Therefore showing page of pageIndex=0"
      ) : i > this.rawHeights.length - 1 && console.warn(
        `pageIndex provided is greater than max page-index of ${this.rawHeights.length - 1}. Therefore showing page of pageIndex=${this.rawHeights.length - 1} `
      );
      const e = t === 0 ? 0 : this.ft.getCumulativeHeight(t - 1);
      this.jumpToScrollTop(e);
    }
  }
  jumpToScrollTop(i, t = !0, e = !0) {
    var l;
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.classList.add("by-pass"), this.scrollTop = 0;
    const s = Math.min(
      Math.max(0, i),
      this.virtualScrollHeight - this.clientHeight
    );
    this.classList.add("by-pass"), this.pauseUpdate = !1, this.scrolling = !0, this.globalScrollY = s, this.setScrollTopAndTransform(s, e), t && ((l = this.fakeScrollbar) == null || l.setToScrollTop(s));
  }
  getCurrentScrollTop() {
    return this.globalScrollY;
  }
  tillPainted() {
    return new Promise((i) => {
      requestAnimationFrame(() => requestAnimationFrame(i));
    });
  }
  async tillStable(i) {
    await this.tillPainted();
    const t = i.flatMap(
      (e) => e.getAnimations({ subtree: !0 })
    );
    t.length && await Promise.allSettled(t.map((e) => e.finished));
  }
  async allStable(i = []) {
    await this.tillPainted();
    const t = this.innerSlot.assignedElements({ flatten: !0 });
    await this.tillStable([
      ...i,
      this.container,
      ...t
    ]);
  }
  hostResize() {
    this.hostClientHeight = this.clientHeight;
  }
  onFakeScrollbarDragging() {
    this.fakeScrollbar && this.onPowerScroll(this.fakeScrollbar);
  }
  onFakeScrollbarDragStop() {
    this.updateMemoryWithNewHeights(), this.setScrollStateFromCurrentView(), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrolling = !1;
    }, this.scrollWaitTime), this.dispatchEvent(new CustomEvent("scroll-stopped"));
  }
  onFakeScrollbarDragRelease() {
    var i;
    this.updateMemoryWithNewHeights(), this.setScrollStateFromCurrentView(), (i = this.fakeScrollbar) == null || i.setToScrollTop(this.globalScrollY), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrolling = !1;
    }, this.scrollWaitTime), this.dispatchEvent(new CustomEvent("scroll-stopped"));
  }
  setScrollStateFromCurrentView(i) {
    this.classList.add("by-pass"), this.localScrollY = i || this.getComputedLocalScrollY(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, this.globalScrollY = Math.min(
      Math.max(0, this.globalScrollY),
      this.virtualScrollHeight - this.clientHeight
    ), this.setScrollTopAndTransform(this.globalScrollY);
  }
  updateMemoryWithNewHeights() {
    const i = Object.entries(this.rawHeightUpdates);
    if (i.length !== 0 && this.ft) {
      for (const [t, e] of i) {
        const s = parseInt(t);
        this.rawHeights[s] !== e && (this.ft.update(s, e), this.rawHeights[s] = e);
      }
      this.rawHeightUpdates = {}, this.updateTotalVirtualHeight();
    }
  }
  getCurrentPageIndex() {
    var i;
    return (i = this.ft) == null ? void 0 : i.findIndexOfPixel(this.globalScrollY);
  }
  getPageIndexForScrollTop(i) {
    var t;
    return (t = this.ft) == null ? void 0 : t.findIndexOfPixel(i);
  }
  onKeyDown(i, t) {
    switch (this.scrollTimeout && clearTimeout(this.scrollTimeout), i) {
      case "arrowup":
      case "arrowdown":
        this.scrolling = !0, this.repeatedScrollByPixels(t);
        break;
      case "pagedown":
      case "pageup":
        this.scrolling = !0, requestAnimationFrame(() => {
          this.updateMemoryWithNewHeights(), this.setScrollStateFromCurrentView(), this.stableJumpTo(this.globalScrollY + t);
        }), this.dispatchEvent(new CustomEvent("scrolling"));
    }
  }
  onKeyUp(i) {
    this.tickFrame && cancelAnimationFrame(this.tickFrame), this.scrollTimeout && clearTimeout(this.scrollTimeout);
    const t = i.toLowerCase();
    (t === "pageup" || t === "pagedown") && this.allStable().then(() => {
      this.tickFrame && cancelAnimationFrame(this.tickFrame), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
        this.scrolling = !1, this.updateMemoryWithNewHeights(), this.setScrollStateFromCurrentView();
      }, this.scrollWaitTime);
    }), this.dispatchEvent(new CustomEvent("scroll-stopped"));
  }
  stableJumpTo(i) {
    this.tickFrame && cancelAnimationFrame(this.tickFrame), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.classList.add("by-pass"), this.jumpToScrollTop(i);
  }
  onPageResize(i, t) {
    var e, s;
    if (this.ft) {
      const l = t.height;
      this.scrolling ? (this.rawHeightUpdates[i] = l, this.updateTotalVirtualHeight()) : (this.updateMemoryWithNewHeights(), (e = this.ft) == null || e.update(i, l), this.updateTotalVirtualHeight(), this.localScrollY = this.getComputedLocalScrollY(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (s = this.fakeScrollbar) == null || s.setToScrollTop(this.globalScrollY));
    }
  }
  onElementResize(i) {
    var e;
    if (this.scrolling || (e = this.fakeScrollbar) != null && e.dragging) return;
    const t = i.height - i.oldHeight;
    if (!this.pauseUpdate && i.getBoundingClientRect().bottom - t < 0) {
      this.classList.add("by-pass"), this.localScrollY = this.getComputedLocalScrollY(), this.localScrollY += t, this.translateY = `${-this.localScrollY}px`;
      const s = this.innerSlot.assignedElements({
        flatten: !0
      });
      this.allStable(s).then(() => {
        var l;
        this.updateMemoryWithNewHeights(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (l = this.fakeScrollbar) == null || l.setToScrollTop(this.globalScrollY);
      });
    }
  }
  getComputedLocalScrollY() {
    return -this.getTranslateXY({
      styleDeclaration: this.containerComputedStyle
    }).translateY;
  }
  async runAfterAllTransitions(i) {
    for (let t of i)
      t && await this.runAfterTransitions(t);
  }
  jumpRelease() {
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrolling = !1, this.updateMemoryWithNewHeights(), this.setScrollStateFromCurrentView();
    }, this.scrollWaitTime);
  }
};
n.styles = y`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      --transform-transition-time: 0.3s;
    }
    .container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: fit-content;
      transform: translateY(var(--translateY));
      will-change: transform;
      min-height: 150vh;
      /* Add this to force the browser to keep the buffer pages in GPU memory */
      backface-visibility: hidden;
    }
    :host(.smooth:not(.by-pass)) .container {
      transition: transform var(--transform-transition-time) ease;
    }
  `;
c([
  h({ type: Array })
], n.prototype, "items", 2);
c([
  h({ type: String, reflect: !0 })
], n.prototype, "defaultHeight", 2);
c([
  h({ type: Number, reflect: !0, attribute: "num-of-items" })
], n.prototype, "numOfItems", 2);
c([
  h({ type: String, reflect: !0, attribute: "unique-selector" })
], n.prototype, "uniqueSelector", 2);
c([
  h({
    type: Number,
    reflect: !0,
    attribute: "arrow-click-scroll-delta"
  })
], n.prototype, "arrowClickScrollTopDelta", 2);
c([
  h({ type: Boolean, reflect: !0, attribute: "needs-transition" })
], n.prototype, "needsTransition", 2);
c([
  h({ type: Object })
], n.prototype, "fakeScrollbar", 2);
c([
  p()
], n.prototype, "globalScrollY", 2);
c([
  p()
], n.prototype, "initialized", 2);
c([
  p()
], n.prototype, "virtualScrollHeight", 2);
c([
  p()
], n.prototype, "containerHeight", 2);
c([
  p()
], n.prototype, "translateY", 2);
c([
  h({ type: Number, reflect: !0 })
], n.prototype, "startIndex", 2);
c([
  h({ type: Number, reflect: !0 })
], n.prototype, "hostClientHeight", 2);
n = c([
  v("missing-page-virtualizer")
], n);
export {
  n as MissingPageVirtualizer
};
//# sourceMappingURL=index.js.map
