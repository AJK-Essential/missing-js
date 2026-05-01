import { LitElement as v, css as y, html as S } from "lit";
import { property as h, state as f, queryAssignedElements as T, customElement as Y } from "lit/decorators.js";
/**
 * Missing JS - @missing-js/page-virtualizer (Pro)
 * @license PolyForm Noncommercial 1.0.0
 * Copyright (c) 2026 Missing JS / AJK-Essential.
 * ---------------------------------------------------------
 * This version is for non-commercial use only.
 * Commercial license required for for-profit entities.
 * Sunset Clause: Automatically transitions to MIT after Jan 1, 2029.
 * Licensing: Purchase link will be updated soon
 */
class b {
  constructor(t) {
    this.size = t, this.tree = new Float64Array(t + 1);
  }
  /**
   * Bulk initialization in O(N) time.
   * Perfect for setting all pages to a 'defaultHeight' at startup.
   */
  // Use this for PREPEND and APPEND (Index shifts)
  initAll(t) {
    t.length > this.size ? (this.size = t.length, this.tree = new Float64Array(this.size + 1)) : this.tree.fill(0), this.values = t;
    for (let e = 0; e < t.length; e++)
      this.tree[e + 1] = t[e];
    for (let e = 1; e <= t.length; e++) {
      let i = e + (e & -e);
      i <= t.length && (this.tree[i] += this.tree[e]);
    }
  }
  /**
   * Updates the height of an item at a specific index.
   * Time Complexity: O(log N)
   */
  update(t, e) {
    const i = e - this.values[t];
    if (i === 0) return;
    this.values[t] = e;
    let s = t + 1;
    for (; s <= this.size; )
      this.tree[s] += i, s += s & -s;
  }
  getCumulativeHeight(t) {
    let e = 0, i = t + 1;
    for (; i > 0; )
      e += this.tree[i], i -= i & -i;
    return e;
  }
  findIndexOfPixel(t) {
    if (t < 0) return 0;
    let e = 0, i = 0, s = 1 << Math.floor(Math.log2(this.size));
    for (; s > 0; ) {
      const r = e + s;
      r <= this.size && i + this.tree[r] <= t && (e = r, i += this.tree[e]), s >>= 1;
    }
    return e;
  }
  getSingleHeight(t) {
    return this.values[t];
  }
  getValues() {
    return this.values;
  }
}
var H = Object.defineProperty, p = (l, t, e, i) => {
  for (var s = void 0, r = l.length - 1, o; r >= 0; r--)
    (o = l[r]) && (s = o(t, e, s) || s);
  return s && H(t, e, s), s;
};
class g extends v {
  constructor() {
    super(...arguments), this.defaultTabbing = !1, this.defaultArrowUpNavigation = !1, this.defaultArrowDownNavigation = !1, this.defaultPageUpNavigation = !1, this.defaultPageDownNavigation = !1, this.keyboardIncrements = {
      arrowdown: 5,
      arrowup: -5,
      pagedown: 100,
      pageup: -100
    }, this.shiftPressed = !1, this.tabPressed = !1, this.keyboardDownEventListener = this.keyboardDownEventCB.bind(this), this.keyboardUpEventListener = this.keyboardUpEventCB.bind(this), this.documentKeyboardDownListener = this.documentKeyboardDownCB.bind(this), this.noOpacityChange = !1, this.scrollAmt = 0, this.direction = "STABLE", this.tick = () => {
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
      const e = this.getBoundingClientRect(), i = e.top, s = e.bottom, r = t.composedPath()[0];
      if (this.tabbingElementSelector) {
        let o = Array.from(
          this.querySelectorAll(this.tabbingElementSelector)
        );
        if (o.includes(r)) {
          this.scrollTop = 0;
          let a;
          if (this.tabPressed && !this.shiftPressed) {
            if (t.preventDefault(), await this.runAfterTransitions(r), o.indexOf(r) !== o.length - 1) {
              if (r.getBoundingClientRect().top < i) {
                const u = o.find(
                  (m) => m.getBoundingClientRect().top >= i
                );
                u && u.focus();
                return;
              }
              a = this.getNextScrollDelta(
                r,
                "forwards",
                i,
                s
              );
            } else {
              let d = r.getBoundingClientRect();
              a = d.top - this.clientHeight / 2 + d.height / 2;
            }
            this.tabPressed = !1, this.shiftPressed = !1, this.noOpacityChange = !0, this.scrollByAmt(a), this.scrollCheck();
          } else if (this.tabPressed && this.shiftPressed) {
            if (t.preventDefault(), await this.runAfterTransitions(r), o.indexOf(r) !== 0) {
              if (r.getBoundingClientRect().bottom >= s) {
                const u = o.findLast(
                  (m) => m.getBoundingClientRect().bottom <= s
                );
                u && u.focus();
                return;
              }
              a = this.getNextScrollDelta(
                r,
                "backwards",
                i,
                s
              );
            } else {
              let d = r.getBoundingClientRect();
              a = d.top - this.clientHeight / 2 + d.height / 2;
            }
            this.tabPressed = !1, this.shiftPressed = !1, this.noOpacityChange = !0, this.scrollByAmt(a), this.scrollCheck();
          }
        }
      }
    });
  }
  getNextScrollDelta(t, e, i, s) {
    let r = 0, o = t.getBoundingClientRect();
    if (e === "forwards") {
      const a = o.top < s && o.bottom <= s ? "completely-within" : o.top <= s && o.bottom > s ? "partially-within" : "out";
      a === "completely-within" ? r = 0 : (a === "partially-within" || a === "out") && (o.height >= this.clientHeight ? r = o.top - i : r = a === "out" ? o.top - this.clientHeight / 2 + o.height / 2 : o.bottom - s);
    } else {
      const a = o.bottom > i && o.top >= i ? "completely-within" : o.bottom >= i && o.top < i ? "partially-within" : "out";
      a === "completely-within" ? r = 0 : (a === "partially-within" || a === "out") && (o.height >= this.clientHeight ? r = o.bottom - s : r = a === "out" ? o.top - this.clientHeight / 2 + o.height / 2 : o.top - i);
    }
    return r;
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
    const e = window.getComputedStyle(t), i = parseFloat(e.transitionDuration) * 1e3, s = parseFloat(e.transitionDelay) * 1e3, r = i + s;
    r > 0 && await this.wait(r + 20);
  }
  jumpToScrollTop(t) {
  }
  onKeyDown(t, e) {
  }
  onKeyUp(t) {
  }
}
p([
  h({
    type: String,
    reflect: !0,
    attribute: "tabbing-element-selector"
  })
], g.prototype, "tabbingElementSelector");
p([
  h({ type: Boolean, reflect: !0, attribute: "default-tabbing" })
], g.prototype, "defaultTabbing");
p([
  h({
    type: Boolean,
    reflect: !0,
    attribute: "default-arrow-up-navigation"
  })
], g.prototype, "defaultArrowUpNavigation");
p([
  h({
    type: Boolean,
    reflect: !0,
    attribute: "default-arrow-down-navigation"
  })
], g.prototype, "defaultArrowDownNavigation");
p([
  h({
    type: Boolean,
    reflect: !0,
    attribute: "default-page-up-navigation"
  })
], g.prototype, "defaultPageUpNavigation");
p([
  h({
    type: Boolean,
    reflect: !0,
    attribute: "default-page-down-navigation"
  })
], g.prototype, "defaultPageDownNavigation");
p([
  h({ type: Object })
], g.prototype, "keyboardIncrements");
p([
  h({
    type: Number,
    reflect: !0,
    attribute: "tabbing-item-transition-time"
  })
], g.prototype, "tabbingItemTransitionTime");
/**
 * Missing JS - @missing-js/swipe-physics-emitter
 * @license MIT
 * Copyright (c) 2026 Missing JS / AJK-Essential.
 * ---------------------------------------------------------
 * Licensed under the MIT License.
 * Free for personal and commercial use.
 */
class w {
  constructor() {
    this.friction = 0.92, this.launchMultiplier = 1.2, this.snapThreshold = 0.15, this.velocityX = 0, this.velocityY = 0, this.isDragging = !1, this.lastX = 0, this.lastY = 0, this.lastTime = 0, this.velocityBuffer = [], this.animationId = null, this.pointerMoveListener = this.onPointerMove.bind(this), this.pointerDownListener = this.onPointerDown.bind(this), this.pointerUpListener = this.onPointerUp.bind(this), this.physicsLoop = () => {
      if (this.isDragging) return;
      const t = performance.now(), e = Math.min(t - this.lastTime, 20);
      this.lastTime = t;
      const i = Math.pow(this.friction, e / 16.66);
      this.velocityX *= i, this.velocityY *= i;
      const s = this.velocityX * e, r = this.velocityY * e;
      if (Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2) < this.snapThreshold) {
        this.stopMovement(), this.dispatch(0, 0, !1);
        return;
      }
      this.dispatch(s, r, !1), this.animationId = requestAnimationFrame(this.physicsLoop);
    };
  }
  emitFor(t) {
    this.target = t, this.target.style.touchAction = "none", this.target.style.userSelect = "none", this.target.addEventListener("pointerdown", this.pointerDownListener);
  }
  stopMovement() {
    this.animationId && (cancelAnimationFrame(this.animationId), this.animationId = null), this.velocityX = 0, this.velocityY = 0, this.velocityBuffer = [];
  }
  dispatch(t, e, i) {
    this.target && (!i && Math.abs(t) < 0.1 && Math.abs(e) < 0.1 || this.target.dispatchEvent(
      new CustomEvent("swipe-detected", {
        detail: {
          deltaX: t,
          deltaY: e,
          velocityX: this.velocityX,
          velocityY: this.velocityY,
          isDragging: i
        },
        bubbles: !0,
        composed: !0
      })
    ));
  }
  onPointerDown(t) {
    !this.target || t.pointerType === "mouse" || (this.stopMovement(), this.isDragging = !0, this.lastX = t.clientX, this.lastY = t.clientY, this.lastTime = performance.now(), this.target.setPointerCapture(t.pointerId), this.target.addEventListener("pointermove", this.pointerMoveListener), this.target.addEventListener("pointerup", this.pointerUpListener));
  }
  onPointerMove(t) {
    if (!this.isDragging) return;
    const e = performance.now(), i = e - this.lastTime;
    if (i < 4) return;
    const s = t.clientX - this.lastX, r = t.clientY - this.lastY;
    this.velocityBuffer.push({ vx: s / i, vy: r / i, t: e }), this.velocityBuffer.length > 6 && this.velocityBuffer.shift(), this.lastX = t.clientX, this.lastY = t.clientY, this.lastTime = e, this.dispatch(s, r, !0);
  }
  onPointerUp(t) {
    if (!this.isDragging) return;
    if (this.isDragging = !1, this.target && (this.target.releasePointerCapture(t.pointerId), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener)), performance.now() - this.lastTime > 50 || this.velocityBuffer.length === 0) {
      this.stopMovement();
      return;
    }
    let e = 0, i = 0, s = 0;
    this.velocityBuffer.forEach((r, o) => {
      const a = Math.pow(o + 1, 2);
      i += r.vx * a, s += r.vy * a, e += a;
    }), this.velocityX = i / e * this.launchMultiplier, this.velocityY = s / e * this.launchMultiplier, this.lastTime = performance.now(), this.animationId = requestAnimationFrame(this.physicsLoop);
  }
  destroy() {
    this.stopMovement(), this.target && this.target.removeEventListener("pointerdown", this.pointerDownListener);
  }
}
var C = Object.defineProperty, k = Object.getOwnPropertyDescriptor, c = (l, t, e, i) => {
  for (var s = i > 1 ? void 0 : i ? k(t, e) : t, r = l.length - 1, o; r >= 0; r--)
    (o = l[r]) && (s = (i ? o(t, e, s) : o(s)) || s);
  return i && s && C(t, e, s), s;
};
let n = class extends g {
  constructor() {
    super(...arguments), this.items = [], this.defaultHeight = 200, this.numOfItems = 2, this.uniqueSelector = "", this.arrowClickScrollTopDelta = 40, this.needsTransition = !1, this.swipeDeltaMultiplier = 1, this.defaultWheeling = !0, this.globalScrollY = 0, this.initialized = !1, this.virtualScrollHeight = this.clientHeight, this.containerHeight = 100, this.translateY = 0, this.startIndex = 0, this.hostClientHeight = this.clientHeight, this.containerClientWidth = this.clientWidth, this.containerResizeObserver = new ResizeObserver(
      this.containerResize.bind(this)
    ), this.hostResizeObserver = new ResizeObserver(this.hostResize.bind(this)), this.hostSwipeListener = this.onHostSwipe.bind(this), this.fakeScrollbarDraggingListener = this.onFakeScrollbarDragging.bind(this), this.fakeScrollbarDragReleaseListener = this.onFakeScrollbarDragRelease.bind(this), this.fakeScrollbarDragStopListener = this.onFakeScrollbarDragStop.bind(this), this.dimensionChangedListener = this.dimensionChangedCB.bind(this), this.pauseUpdate = !1, this.scrolling = !1, this.localScrollY = 0, this.rawHeightUpdates = {}, this.scrollWaitTime = 250, this.jumpSkipping = !1, this.accumulatedDelta = 0;
  }
  render() {
    return S`
      ${this.initialized ? S`
            <div
              class="container"
              style="--translateY:${this.translateY}px;"
              tabindex="0"
            >
              <slot
                @slotchange="${async (l) => {
      this.slotChangedResolve && (this.slotChangedResolve(), this.slotChangedResolve = void 0);
    }}"
              ></slot>
            </div>
            <div class="ghosts" style="width:${this.containerClientWidth}px">
              <slot name="next-previous"></slot>
            </div>
          ` : ""}
    `;
  }
  initialize() {
    this.initialized = !0, this.addEventListener("dimension-changed", this.dimensionChangedListener), this.needsTransition && this.classList.add("smooth"), this.updateComplete.then(() => {
      this.ft = new b(this.items.length), this.rawHeights = new Float64Array(this.items.length).fill(
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
      const l = this.renderRoot;
      this.container = l.querySelector(".container"), this.innerSlot = l.querySelector("slot"), this.containerComputedStyle = getComputedStyle(this.container), this.containerResizeObserver.observe(this.container), this.hostResizeObserver.observe(this), this.addEventListener("swipe-detected", this.hostSwipeListener), this.dispatchEvent(
        new CustomEvent("load", {
          detail: {
            indices: [this.startIndex, this.startIndex + this.numOfItems - 1]
          }
        })
      ), this.addEventListener("scroll", () => {
        this.scrollTop = 0;
      }), this.defaultWheeling && this.addEventListener("wheel", (t) => {
        this.slowScrollBy(t.deltaY, !0);
      }), this.setupKeyboardInteractions();
    });
  }
  updated(l) {
    var t;
    super.updated(l), this.fakeScrollbar && (l.has("hostClientHeight") || l.has("virtualScrollHeight")) && (this.fakeScrollbar.targetClientHeight = this.hostClientHeight, this.fakeScrollbar.targetScrollHeight = this.virtualScrollHeight), l.has("swipeScroll") && (this.swipeScroll ? (this.swipePhysics = new w(), this.swipePhysics.emitFor(this)) : (t = this.swipePhysics) == null || t.destroy());
  }
  disconnectedCallback() {
    this.removeEventListener(
      "dimension-changed",
      this.dimensionChangedListener
    ), this.removeEventListener("swipe-detected", this.hostSwipeListener), this.fakeScrollbar && (this.fakeScrollbar.removeEventListener(
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
  scrollByAmt(l, t = !1) {
    this.slowScrollBy(l, t);
  }
  onPowerScroll(l) {
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.classList.add("by-pass"), this.jumpToScrollTop(l.computedTargetScrollTop), this.dispatchEvent(new CustomEvent("scrolling")), this.scrollTop = 0;
  }
  setScrollTopAndTransform(l, t = !0) {
    var e;
    if (this.ft) {
      const i = (e = this.ft) == null ? void 0 : e.findIndexOfPixel(l), s = i !== 0 ? this.ft.getCumulativeHeight(i - 1) : 0, r = -(l - s);
      this.translateY = r, this.localScrollY = -r, this.startIndex = i, t && this.dispatchEvent(
        new CustomEvent("load", {
          detail: {
            indices: [this.startIndex, this.startIndex + this.numOfItems - 1]
          }
        })
      );
    }
  }
  getTranslateXY(l) {
    let t;
    "element" in l ? t = window.getComputedStyle(l.element) : t = l.styleDeclaration;
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
    }).length !== this.numOfItems || this.pauseUpdate || (this.containerHeight = parseFloat(this.containerComputedStyle.height));
  }
  containerResize() {
    this.containerClientWidth = parseFloat(this.containerComputedStyle.width), this.updateContainerHeight();
  }
  dimensionChangedCB(l) {
    if (this.scrollTop = 0, !this.ft) return;
    let e = l.detail.target;
    const i = parseInt(e.dataset.pageIndex);
    i > this.items.length - 1 || (e.isPage ? this.onPageResize(i, e) : this.onElementResize(e));
  }
  slowScrollBy(l = 0, t = !1) {
    var d;
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.dispatchEvent(new CustomEvent("scroll-stopped")), this.scrolling = !1;
    }, this.scrollWaitTime), this.updateMemoryWithNewHeights(), this.dispatchEvent(new CustomEvent("scrolling")), this.scrolling = !0, t ? this.classList.add("by-pass") : this.classList.remove("by-pass"), this.localScrollY = isNaN(this.translateY) ? 0 : -this.translateY, this.localScrollY += l;
    const e = this.startIndex === 0 ? 0 : this.ft.getCumulativeHeight(this.startIndex - 1);
    this.globalScrollY = e + this.localScrollY;
    const i = Math.min(
      Math.max(0, this.globalScrollY),
      this.virtualScrollHeight - this.clientHeight
    ), s = i - this.globalScrollY;
    this.localScrollY -= s, this.globalScrollY = i, (d = this.fakeScrollbar) == null || d.setToScrollTop(this.globalScrollY);
    const r = this.ft.findIndexOfPixel(this.globalScrollY), o = r !== 0 ? this.ft.getCumulativeHeight(r - 1) : 0, a = -(this.globalScrollY - o);
    if (this.pauseUpdate) {
      this.accumulatedDelta += l, this.container.style.setProperty(
        "--translateY",
        `${-this.localScrollY}px`
      );
      return;
    }
    r !== this.startIndex ? (this.container.style.setProperty(
      "--translateY",
      `${-this.localScrollY}px`
    ), this.pauseUpdate = !0, this.classList.add("by-pass"), this.startIndex = r, this.pendingViewTranslate = a, this.recoveryTimeout && clearTimeout(this.recoveryTimeout), this.recoveryTimeout = setTimeout(() => {
      this.pauseUpdate && (console.warn("Recovery: Angular took > 500ms. Forcing setView."), this.setView());
    }, 500), this.dispatchEvent(
      new CustomEvent("load", {
        detail: {
          indices: [this.startIndex, this.startIndex + this.numOfItems - 1]
        }
      })
    )) : this.translateY = a;
  }
  updateTotalVirtualHeight() {
    if (this.ft && this.fakeScrollbar) {
      const l = this.items.length - 1;
      this.virtualScrollHeight = this.ft.getCumulativeHeight(l), this.fakeScrollbar.targetScrollHeight = this.virtualScrollHeight, this.globalScrollY = Math.min(
        Math.max(0, this.globalScrollY),
        this.virtualScrollHeight - this.clientHeight
      );
    }
  }
  addNewData(l, t) {
    var o;
    if (!this.ft) return;
    this.updateMemoryWithNewHeights();
    const e = t.length, i = this.items.length, s = e - i;
    if (s <= 0) return;
    const r = new Float64Array(e);
    l === "append" ? (r.set(this.rawHeights), r.fill(this.defaultHeight, i)) : (r.fill(this.defaultHeight, 0, s), r.set(this.rawHeights, s)), this.rawHeights = r, this.items = t, this.ft.initAll(this.rawHeights), this.updateTotalVirtualHeight(), this.setScrollStateFromCurrentView(), (o = this.fakeScrollbar) == null || o.setToScrollTop(this.globalScrollY);
  }
  goToPageIndex(l) {
    if (this.ft) {
      const t = Math.min(
        Math.max(0, l),
        this.rawHeights.length - 1
      );
      l < 0 ? console.warn(
        "pageIndex provided is less than min page-index of 0. Therefore showing page of pageIndex=0"
      ) : l > this.rawHeights.length - 1 && console.warn(
        `pageIndex provided is greater than max page-index of ${this.rawHeights.length - 1}. Therefore showing page of pageIndex=${this.rawHeights.length - 1} `
      );
      const e = t === 0 ? 0 : this.ft.getCumulativeHeight(t - 1);
      this.jumpToScrollTop(e);
    }
  }
  jumpToScrollTop(l, t = !0, e = !0) {
    var s;
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.classList.add("by-pass"), this.scrollTop = 0;
    const i = Math.min(
      Math.max(0, l),
      this.virtualScrollHeight - this.clientHeight
    );
    this.classList.add("by-pass"), this.pauseUpdate = !1, this.scrolling = !0, this.globalScrollY = i, this.setScrollTopAndTransform(i, e), t && ((s = this.fakeScrollbar) == null || s.setToScrollTop(i));
  }
  getCurrentScrollTop() {
    return this.globalScrollY;
  }
  tillPainted() {
    return new Promise((l) => {
      requestAnimationFrame(() => requestAnimationFrame(l));
    });
  }
  async tillStable(l) {
    await this.tillPainted();
    const t = l.flatMap(
      (e) => e.getAnimations({ subtree: !0 })
    );
    t.length && await Promise.allSettled(t.map((e) => e.finished));
  }
  async allStable(l = []) {
    await this.tillPainted();
    const t = this.innerSlot.assignedElements({ flatten: !0 });
    await this.tillStable([
      ...l,
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
    var l;
    this.updateMemoryWithNewHeights(), this.setScrollStateFromCurrentView(), (l = this.fakeScrollbar) == null || l.setToScrollTop(this.globalScrollY), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrolling = !1;
    }, this.scrollWaitTime), this.dispatchEvent(new CustomEvent("scroll-stopped"));
  }
  setScrollStateFromCurrentView(l) {
    this.classList.add("by-pass"), this.localScrollY = l || this.getComputedLocalScrollY(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, this.globalScrollY = Math.min(
      Math.max(0, this.globalScrollY),
      this.virtualScrollHeight - this.clientHeight
    ), this.setScrollTopAndTransform(this.globalScrollY);
  }
  updateMemoryWithNewHeights() {
    const l = Object.entries(this.rawHeightUpdates);
    if (l.length !== 0 && this.ft) {
      for (const [t, e] of l) {
        const i = parseInt(t);
        this.rawHeights[i] !== e && (this.ft.update(i, e), this.rawHeights[i] = e);
      }
      this.rawHeightUpdates = {}, this.updateTotalVirtualHeight();
    }
  }
  getCurrentPageIndex() {
    var l;
    return (l = this.ft) == null ? void 0 : l.findIndexOfPixel(this.globalScrollY);
  }
  getPageIndexForScrollTop(l) {
    var t;
    return (t = this.ft) == null ? void 0 : t.findIndexOfPixel(l);
  }
  async onKeyDown(l, t) {
    switch (this.scrollTimeout && clearTimeout(this.scrollTimeout), l) {
      case "arrowup":
      case "arrowdown":
        this.slowScrollBy(t, !0);
        break;
      case "pagedown":
      case "pageup":
        this.slowScrollBy(t, !0);
    }
  }
  onKeyUp(l) {
    this.tickFrame && cancelAnimationFrame(this.tickFrame);
    const t = l.toLowerCase();
    if (t === "escape") {
      this.focus(), this.blur();
      return;
    }
    t !== "pageup" && t !== "pagedown" && t !== "arrowup" && t !== "arrowdown" || ((t === "pageup" || t === "pagedown") && this.allStable().then(() => {
      this.pauseUpdate || this.tickFrame && cancelAnimationFrame(this.tickFrame);
    }), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrolling = !1, this.updateMemoryWithNewHeights(), this.dispatchEvent(new CustomEvent("scroll-stopped"));
    }, this.scrollWaitTime));
  }
  stableJumpTo(l) {
    this.tickFrame && cancelAnimationFrame(this.tickFrame), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.classList.add("by-pass"), this.jumpToScrollTop(l);
  }
  onPageResize(l, t) {
    var e, i;
    if (this.ft) {
      const s = t.height;
      this.scrolling ? (this.rawHeightUpdates[l] = s, this.updateTotalVirtualHeight()) : (this.updateMemoryWithNewHeights(), (e = this.ft) == null || e.update(l, s), this.updateTotalVirtualHeight(), this.localScrollY = this.getComputedLocalScrollY(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (i = this.fakeScrollbar) == null || i.setToScrollTop(this.globalScrollY));
    }
  }
  onElementResize(l) {
    var e;
    if (this.scrolling || (e = this.fakeScrollbar) != null && e.dragging) return;
    const t = l.height - l.oldHeight;
    if (!this.pauseUpdate && l.getBoundingClientRect().bottom - t < 0) {
      this.classList.add("by-pass"), this.localScrollY = this.getComputedLocalScrollY(), this.localScrollY += t, this.translateY = -this.localScrollY;
      const i = this.innerSlot.assignedElements({
        flatten: !0
      });
      this.allStable(i).then(() => {
        var s;
        this.updateMemoryWithNewHeights(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (s = this.fakeScrollbar) == null || s.setToScrollTop(this.globalScrollY);
      });
    }
  }
  getComputedLocalScrollY() {
    return -this.getTranslateXY({
      styleDeclaration: this.containerComputedStyle
    }).translateY;
  }
  async runAfterAllTransitions(l) {
    for (let t of l)
      t && await this.runAfterTransitions(t);
  }
  jumpRelease() {
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrolling = !1, this.updateMemoryWithNewHeights(), this.setScrollStateFromCurrentView();
    }, this.scrollWaitTime);
  }
  onHostSwipe(l) {
    var i;
    if (this.scrollTop = 0, (i = this.fakeScrollbar) != null && i.dragging) {
      l.preventDefault();
      return;
    }
    const e = -l.detail.deltaY * this.swipeDeltaMultiplier;
    this.slowScrollBy(e, !0), this.dispatchEvent(new CustomEvent("scrolling"));
  }
  /**
   * This function is for highly accurate jumps to a particular
   * location. Accuracy means, this function will take into account the
   * updated heights after render and then correctly move to the required
   * scrollTop. Little computationally expensive as Lit has to
   * render twice, but if it is needed say to jump across
   * a 1000 pages like a page up or page down, this
   * function will come in handy.
   *
   * Make sure ` this.updateMemoryWithNewHeights();
   * this.setScrollStateFromCurrentView();` are called before
   * calling this function
   * @param scrollTop
   */
  async accurateJumpTo(l) {
    var s;
    if (!this.ft || this.jumpSkipping) return;
    this.updateMemoryWithNewHeights(), this.scrolling || (this.updateContainerHeight(), this.localScrollY = this.getComputedLocalScrollY()), this.scrolling = !0;
    const t = this.getCurrentGlobalScrollYFromView(), e = l - t, i = this.localScrollY;
    if (this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrolling = !1, this.dispatchEvent(new CustomEvent("scroll-stopped"));
    }, this.scrollWaitTime), this.dispatchEvent(new CustomEvent("scrolling")), this.classList.add("by-pass"), this.localScrollY + e < 0 || this.localScrollY + e > this.containerHeight - this.clientHeight) {
      this.jumpSkipping = !0;
      const r = this.startIndex;
      this.listItems.forEach((u) => u.style.opacity = "0"), this.stableJumpTo(this.globalScrollY + e), await this.updateComplete, await this.waitForSlotChangedEvent(), await this.allStable(), await Promise.all(this.listItems.map((u) => u.isReady)), this.updateMemoryWithNewHeights();
      const a = (r !== 0 ? this.ft.getCumulativeHeight(r - 1) : 0) + i + e, d = this.ft.findIndexOfPixel(
        a
      );
      this.stableJumpTo(a), await this.updateComplete, d !== this.startIndex && await this.waitForSlotChangedEvent(), await this.allStable(), await Promise.all(this.listItems.map((u) => u.isReady)), this.listItems.forEach((u) => u.style.opacity = "1"), this.jumpSkipping = !1;
      return;
    }
    this.localScrollY += e, this.translateY = -this.localScrollY, this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (s = this.fakeScrollbar) == null || s.setToScrollTop(this.globalScrollY);
  }
  createSlotChangedPromise() {
    return new Promise((l) => {
      this.slotChangedResolve = l;
    });
  }
  async waitForSlotChangedEvent() {
    await this.createSlotChangedPromise();
  }
  getCurrentGlobalScrollYFromView() {
    const l = this.getComputedLocalScrollY();
    return (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + l;
  }
  setView() {
    if (typeof this.pendingViewTranslate != "number") {
      this.pauseUpdate = !1;
      return;
    }
    this.executeSetView();
  }
  executeSetView() {
    var t;
    if (this.scrolling = !0, typeof this.pendingViewTranslate != "number")
      return;
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.dispatchEvent(new CustomEvent("scroll-stopped")), this.scrolling = !1;
    }, this.scrollWaitTime), this.classList.add("by-pass"), this.localScrollY = -this.pendingViewTranslate, this.accumulatedDelta && (this.localScrollY += this.accumulatedDelta, this.accumulatedDelta = 0), this.container.style.setProperty("--translateY", `${-this.localScrollY}px`), this.translateY = -this.localScrollY, this.pendingViewTranslate = void 0;
    const l = this.startIndex === 0 ? 0 : this.ft.getCumulativeHeight(this.startIndex - 1);
    this.globalScrollY = l + this.localScrollY, (t = this.fakeScrollbar) == null || t.setToScrollTop(this.globalScrollY), this.pauseUpdate = !1;
  }
};
n.styles = y`
    * {
      box-sizing: border-box;
    }
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      --transform-transition-time: 0.3s;
    }
    :host([swipe-scroll]),
    :host([swipe-scroll]) .container,
    :host([swipe-scroll]) ::slotted(*) {
      touch-action: none;
      overscroll-behavior: none;
      -webkit-user-drag: none;
      user-select: none;
    }
    .container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: fit-content;
      transform: translate3D(0, var(--translateY), 0);
      will-change: transform;
      min-height: 150vh;
      /* Add this to force the browser to keep the buffer pages in GPU memory */
      backface-visibility: hidden;
      contain: layout paint;
    }
    :host(.smooth:not(.by-pass)) .container {
      transition: transform var(--transform-transition-time) ease;
    }
    .ghosts {
      position: fixed;
      top: 99999px;
      visibility: hidden;
      z-index: -1;
      opacity: 0;
      contain: layout paint;
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
  h({ type: Boolean, reflect: !0, attribute: "swipe-scroll" })
], n.prototype, "swipeScroll", 2);
c([
  h({
    type: Number,
    reflect: !0,
    attribute: "swipe-delta-multiplier"
  })
], n.prototype, "swipeDeltaMultiplier", 2);
c([
  h({
    type: Boolean
  })
], n.prototype, "defaultWheeling", 2);
c([
  f()
], n.prototype, "globalScrollY", 2);
c([
  f()
], n.prototype, "initialized", 2);
c([
  f()
], n.prototype, "virtualScrollHeight", 2);
c([
  f()
], n.prototype, "containerHeight", 2);
c([
  f()
], n.prototype, "translateY", 2);
c([
  h({ type: Number, reflect: !0 })
], n.prototype, "startIndex", 2);
c([
  h({ type: Number, reflect: !0 })
], n.prototype, "hostClientHeight", 2);
c([
  h({ type: Number, reflect: !0 })
], n.prototype, "containerClientWidth", 2);
c([
  T()
], n.prototype, "listItems", 2);
n = c([
  Y("missing-page-virtualizer")
], n);
class x extends HTMLElement {
  constructor() {
    super(), this.items = [], this.defaultHeight = 200, this.numOfItems = 2, this.uniqueSelector = "", this.needsTransition = !1, this.globalScrollY = 0, this.initialized = !1, this.virtualScrollHeight = this.clientHeight, this.translateY = "", this.startIndex = 0, this.pauseUpdate = !1, this.scrolling = !1, this.localScrollY = 0, this.rawHeightUpdates = {}, this.scrollWaitTime = 250, this.thisTop = 0, this.containerClientWidth = this.clientWidth, this._swipeScroll = !1, this.hostSwipeListener = this.onHostSwipe.bind(this), this.fakeScrollbarDraggingListener = this.onFakeScrollbarDragging.bind(this), this.fakeScrollbarDragReleaseListener = this.onFakeScrollbarDragRelease.bind(this), this.fakeScrollbarDragStopListener = this.onFakeScrollbarDragStop.bind(this), this.dimensionChangedListener = this.dimensionChangedCB.bind(this), this.containerResizeObserver = new ResizeObserver(
      this.containerResize.bind(this)
    ), this.hostResizeObserver = new ResizeObserver(this.hostResize.bind(this));
  }
  /**
   * Getters & Setters & Observers.
   */
  get swipeScroll() {
    return this._swipeScroll;
  }
  set swipeScroll(t) {
    this._swipeScroll !== t && (this._swipeScroll = t, this.onSwipeScrollChange());
  }
  onSwipeScrollChange() {
    var t;
    this._swipeScroll ? (this.swipePhysics = new w(), this.swipePhysics.emitFor(this)) : (t = this.swipePhysics) == null || t.destroy();
  }
  /**
   * Public methods
   */
  connectedCallback() {
  }
  initialize() {
    this.initialized = !0, this.addEventListener("dimension-changed", this.dimensionChangedListener), this.fakeScrollbar && (this.fakeScrollbar.addEventListener(
      "dragging",
      this.fakeScrollbarDraggingListener
    ), this.fakeScrollbar.addEventListener(
      "dragRelease",
      this.fakeScrollbarDragReleaseListener
    ), this.fakeScrollbar.addEventListener(
      "drag-stopped",
      this.fakeScrollbarDragStopListener
    )), this.ft = new b(this.items.length), this.rawHeights = new Float64Array(this.items.length).fill(
      this.defaultHeight
    ), this.ft.initAll(this.rawHeights), this.updateTotalVirtualHeight(), this.containerComputedStyle = getComputedStyle(this.container), this.addEventListener("scroll", () => {
      this.scrollTop = 0;
    }), this.setScrollTopAndTransform(this.globalScrollY), this.hostResizeObserver.observe(this), this.containerResizeObserver.observe(this.container), this.addEventListener("swipe-detected", this.hostSwipeListener);
  }
  addNewData(t, e) {
    var a;
    if (!this.ft) return;
    this.updateMemoryWithNewHeights();
    const i = e.length, s = this.items.length, r = i - s;
    if (r <= 0) return;
    const o = new Float64Array(i);
    t === "append" ? (o.set(this.rawHeights), o.fill(this.defaultHeight, s)) : (o.fill(this.defaultHeight, 0, r), o.set(this.rawHeights, r)), this.rawHeights = o, this.items = e, this.ft.initAll(this.rawHeights), this.updateTotalVirtualHeight(), this.setScrollStateFromCurrentView(), (a = this.fakeScrollbar) == null || a.setToScrollTop(this.globalScrollY);
  }
  /**
   * Private methods
   */
  containerResize() {
    this.containerClientWidth = parseFloat(this.containerComputedStyle.width), this.nextPrevious && (this.nextPrevious.style.width = this.containerClientWidth + "px");
  }
  hostResize() {
    this.fakeScrollbar && (this.fakeScrollbar.targetClientHeight = this.clientHeight), this.thisTop = this.getBoundingClientRect().top;
  }
  onFakeScrollbarDragging() {
  }
  onFakeScrollbarDragRelease() {
  }
  onFakeScrollbarDragStop() {
  }
  dimensionChangedCB(t) {
    if (this.scrollTop = 0, !this.ft) return;
    let i = t.detail.target;
    const s = parseInt(i.dataset.pageIndex);
    s > this.items.length - 1 || (i.isPage ? this.onPageResize(s, i) : this.onElementResize(i));
  }
  onPageResize(t, e) {
    var i;
    if (this.ft) {
      const s = e.height;
      this.scrolling ? (this.rawHeightUpdates[t] = s, this.updateTotalVirtualHeight()) : (this.updateMemoryWithNewHeights(), this.ft.update(t, s), this.updateTotalVirtualHeight(), this.localScrollY = -parseFloat(this.translateY), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (i = this.fakeScrollbar) == null || i.setToScrollTop(this.globalScrollY));
    }
  }
  onElementResize(t) {
    var i, s;
    if (this.scrolling || (i = this.fakeScrollbar) != null && i.dragging) return;
    const e = t.height - t.oldHeight;
    !this.pauseUpdate && t.getBoundingClientRect().bottom - e < this.thisTop && (this.classList.add("by-pass"), this.localScrollY = -parseFloat(this.translateY), this.localScrollY += e, this.translateY = `${-this.localScrollY}px`, this.updateMemoryWithNewHeights(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (s = this.fakeScrollbar) == null || s.setToScrollTop(this.globalScrollY));
  }
  updateMemoryWithNewHeights() {
    const t = Object.entries(this.rawHeightUpdates);
    if (t.length !== 0 && this.ft) {
      for (const [e, i] of t) {
        const s = parseInt(e);
        this.rawHeights[s] !== i && (this.ft.update(s, i), this.rawHeights[s] = i);
      }
      this.rawHeightUpdates = {}, this.updateTotalVirtualHeight();
    }
  }
  updateTotalVirtualHeight() {
    if (this.ft) {
      const t = this.items.length - 1;
      this.virtualScrollHeight = this.ft.getCumulativeHeight(t), this.fakeScrollbar && (this.fakeScrollbar.targetScrollHeight = this.virtualScrollHeight), this.globalScrollY = Math.min(
        Math.max(0, this.globalScrollY),
        this.virtualScrollHeight - this.clientHeight
      );
    }
  }
  setScrollTopAndTransform(t, e = !0) {
    var i;
    if (this.ft) {
      const s = (i = this.ft) == null ? void 0 : i.findIndexOfPixel(t), r = s !== 0 ? this.ft.getCumulativeHeight(s - 1) : 0, o = -(t - r);
      this.translateY = `${o}px`, this.localScrollY = -o, this.startIndex = s, e && this.dispatchEvent(
        new CustomEvent("load", {
          detail: {
            indices: [this.startIndex, this.startIndex + this.numOfItems - 1],
            translateY: this.translateY
          }
        })
      );
    }
  }
  setScrollStateFromCurrentView(t) {
    this.classList.add("by-pass"), this.localScrollY = -parseFloat(this.translateY), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, this.globalScrollY = Math.min(
      Math.max(0, this.globalScrollY),
      this.virtualScrollHeight - this.clientHeight
    ), this.setScrollTopAndTransform(this.globalScrollY);
  }
  slowScrollBy(t = 0, e = !1) {
    var u;
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrolling = !1;
    }, this.scrollWaitTime), this.updateMemoryWithNewHeights(), this.dispatchEvent(new CustomEvent("scrolling")), this.scrolling = !0, e ? this.classList.add("by-pass") : this.classList.remove("by-pass"), this.localScrollY = this.translateY !== "" ? -parseFloat(this.translateY) : 0, this.localScrollY += t;
    const i = this.startIndex === 0 ? 0 : this.ft.getCumulativeHeight(this.startIndex - 1);
    this.globalScrollY = i + this.localScrollY;
    const s = Math.min(
      Math.max(0, this.globalScrollY),
      this.virtualScrollHeight - this.clientHeight
    ), r = s - this.globalScrollY;
    this.localScrollY -= r, this.globalScrollY = s, (u = this.fakeScrollbar) == null || u.setToScrollTop(this.globalScrollY);
    const o = this.ft.findIndexOfPixel(this.globalScrollY), a = o !== 0 ? this.ft.getCumulativeHeight(o - 1) : 0, d = -(this.globalScrollY - a);
    o !== this.startIndex ? (this.classList.add("by-pass"), this.startIndex = o, this.translateY = `${d}px`) : this.translateY = `${d}px`, this.setScrollTopAndTransform(this.globalScrollY);
  }
  onHostSwipe(t) {
    var s;
    if (this.scrollTop = 0, (s = this.fakeScrollbar) != null && s.dragging) {
      t.preventDefault();
      return;
    }
    const i = -t.detail.deltaY;
    this.slowScrollBy(i, !0), this.dispatchEvent(new CustomEvent("scrolling"));
  }
}
customElements.define(
  "missing-page-virtualizer-vanilla",
  x
);
export {
  n as MissingPageVirtualizer,
  x as MissingPageVirtualizerVanilla
};
//# sourceMappingURL=index.js.map
