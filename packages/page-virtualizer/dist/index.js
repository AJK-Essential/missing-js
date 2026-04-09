import { LitElement as S, css as v, html as b } from "lit";
import { property as n, state as f, customElement as y } from "lit/decorators.js";
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
class T {
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
      let s = e + (e & -e);
      s <= t.length && (this.tree[s] += this.tree[e]);
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
    let r = t + 1;
    for (; r <= this.size; )
      this.tree[r] += s, r += r & -r;
  }
  getCumulativeHeight(t) {
    let e = 0, s = t + 1;
    for (; s > 0; )
      e += this.tree[s], s -= s & -s;
    return e;
  }
  findIndexOfPixel(t) {
    if (t < 0) return 0;
    let e = 0, s = 0, r = 1 << Math.floor(Math.log2(this.size));
    for (; r > 0; ) {
      const o = e + r;
      o <= this.size && s + this.tree[o] <= t && (e = o, s += this.tree[e]), r >>= 1;
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
var k = Object.defineProperty, m = (i, t, e, s) => {
  for (var r = void 0, o = i.length - 1, l; o >= 0; o--)
    (l = i[o]) && (r = l(t, e, r) || r);
  return r && k(t, e, r), r;
};
class u extends S {
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
      const e = this.getBoundingClientRect(), s = e.top, r = e.bottom, o = t.composedPath()[0];
      if (this.tabbingElementSelector) {
        let l = Array.from(
          this.querySelectorAll(this.tabbingElementSelector)
        );
        if (l.includes(o)) {
          this.scrollTop = 0;
          let h;
          if (this.tabPressed && !this.shiftPressed) {
            if (t.preventDefault(), await this.runAfterTransitions(o), l.indexOf(o) !== l.length - 1) {
              if (o.getBoundingClientRect().top < s) {
                const p = l.find(
                  (g) => g.getBoundingClientRect().top >= s
                );
                p && p.focus();
                return;
              }
              h = this.getNextScrollDelta(
                o,
                "forwards",
                s,
                r
              );
            } else {
              let d = o.getBoundingClientRect();
              h = d.top - this.clientHeight / 2 + d.height / 2;
            }
            this.tabPressed = !1, this.shiftPressed = !1, this.scrollByAmt(h), this.scrollCheck();
          } else if (this.tabPressed && this.shiftPressed) {
            if (t.preventDefault(), await this.runAfterTransitions(o), l.indexOf(o) !== 0) {
              if (o.getBoundingClientRect().bottom >= r) {
                const p = l.findLast(
                  (g) => g.getBoundingClientRect().bottom <= r
                );
                p && p.focus();
                return;
              }
              h = this.getNextScrollDelta(
                o,
                "backwards",
                s,
                r
              );
            } else {
              let d = o.getBoundingClientRect();
              h = d.top - this.clientHeight / 2 + d.height / 2;
            }
            this.tabPressed = !1, this.shiftPressed = !1, this.scrollByAmt(h), this.scrollCheck();
          }
        }
      }
    });
  }
  getNextScrollDelta(t, e, s, r) {
    let o = 0, l = t.getBoundingClientRect();
    if (e === "forwards") {
      const h = l.top < r && l.bottom <= r ? "completely-within" : l.top <= r && l.bottom > r ? "partially-within" : "out";
      h === "completely-within" ? o = 0 : (h === "partially-within" || h === "out") && (l.height >= this.clientHeight ? o = l.top - s : o = h === "out" ? l.top - this.clientHeight / 2 + l.height / 2 : l.bottom - r);
    } else {
      const h = l.bottom > s && l.top >= s ? "completely-within" : l.bottom >= s && l.top < s ? "partially-within" : "out";
      h === "completely-within" ? o = 0 : (h === "partially-within" || h === "out") && (l.height >= this.clientHeight ? o = l.bottom - r : o = h === "out" ? l.top - this.clientHeight / 2 + l.height / 2 : l.top - s);
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
    const e = window.getComputedStyle(t), s = parseFloat(e.transitionDuration) * 1e3, r = parseFloat(e.transitionDelay) * 1e3, o = s + r;
    o > 0 && await this.wait(o + 20);
  }
  jumpToScrollTop(t) {
  }
  onKeyDown(t, e) {
  }
  onKeyUp(t) {
  }
}
m([
  n({
    type: String,
    reflect: !0,
    attribute: "tabbing-element-selector"
  })
], u.prototype, "tabbingElementSelector");
m([
  n({ type: Boolean, reflect: !0, attribute: "default-tabbing" })
], u.prototype, "defaultTabbing");
m([
  n({
    type: Boolean,
    reflect: !0,
    attribute: "default-arrow-up-navigation"
  })
], u.prototype, "defaultArrowUpNavigation");
m([
  n({
    type: Boolean,
    reflect: !0,
    attribute: "default-arrow-down-navigation"
  })
], u.prototype, "defaultArrowDownNavigation");
m([
  n({
    type: Boolean,
    reflect: !0,
    attribute: "default-page-up-navigation"
  })
], u.prototype, "defaultPageUpNavigation");
m([
  n({
    type: Boolean,
    reflect: !0,
    attribute: "default-page-down-navigation"
  })
], u.prototype, "defaultPageDownNavigation");
m([
  n({ type: Object })
], u.prototype, "keyboardIncrements");
m([
  n({
    type: Number,
    reflect: !0,
    attribute: "tabbing-item-transition-time"
  })
], u.prototype, "tabbingItemTransitionTime");
/**
 * Missing JS - @missing-js/swipe-physics-emitter
 * @license MIT
 * Copyright (c) 2026 Missing JS / AJK-Essential.
 * ---------------------------------------------------------
 * Licensed under the MIT License.
 * Free for personal and commercial use.
 */
/**
 * Missing JS - @missing-js/swipe-physics-emitter
 * @license MIT
 * Copyright (c) 2026 Missing JS / AJK-Essential.
 * ---------------------------------------------------------
 * Licensed under the MIT License.
 * Free for personal and commercial use.
 */
class C {
  constructor() {
    this.friction = 0.95, this.velocityX = 0, this.velocityY = 0, this.isDragging = !1, this.lastX = 0, this.lastY = 0, this.lastTime = 0, this.startX = 0, this.startY = 0, this.startTime = 0, this.animationId = null, this.pointerMoveListener = this.onPointerMove.bind(this), this.pointerDownListener = this.onPointerDown.bind(this), this.pointerUpListener = this.onPointerUp.bind(this), this.physicsLoop = () => {
      if (this.isDragging) return;
      this.velocityX *= this.friction, this.velocityY *= this.friction;
      const t = this.velocityX * 16, e = this.velocityY * 16;
      this.dispatch(t, e, !1), (Math.abs(this.velocityX) > 0.05 || Math.abs(this.velocityY) > 0.05) && (this.animationId = requestAnimationFrame(this.physicsLoop));
    };
  }
  emitFor(t) {
    this.target = t, this.target.style.touchAction = "none", this.target.addEventListener("pointerdown", this.pointerDownListener);
  }
  stopMovement() {
    this.animationId && (cancelAnimationFrame(this.animationId), this.animationId = null), this.velocityX = 0, this.velocityY = 0;
  }
  dispatch(t, e, s) {
    if (!this.target) return;
    const r = {
      deltaX: t,
      deltaY: e,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      isDragging: s
    }, o = new CustomEvent(
      "swipe-detected",
      {
        detail: r,
        bubbles: !0,
        composed: !0
      }
    );
    this.target.dispatchEvent(o);
  }
  onPointerDown(t) {
    this.target && t.pointerType !== "mouse" && (this.stopMovement(), this.isDragging = !0, this.startX = t.clientX, this.startY = t.clientY, this.startTime = performance.now(), this.lastX = this.startX, this.lastY = this.startY, this.lastTime = this.startTime, this.target.setPointerCapture(t.pointerId), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.target.addEventListener("pointermove", this.pointerMoveListener), this.target.addEventListener("pointerup", this.pointerUpListener));
  }
  onPointerMove(t) {
    if (!this.isDragging) return;
    const e = performance.now(), s = t.clientX - this.lastX, r = t.clientY - this.lastY, o = e - this.lastTime;
    o > 0 && (this.velocityX = s / o, this.velocityY = r / o), this.dispatch(s, r, !0), this.lastX = t.clientX, this.lastY = t.clientY, this.lastTime = e;
  }
  onPointerUp(t) {
    this.isDragging && this.target && (this.target.releasePointerCapture(t.pointerId), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.isDragging = !1, Math.abs(t.clientX - this.startX), Math.abs(t.clientY - this.startY), performance.now() - this.startTime, this.animationId = requestAnimationFrame(this.physicsLoop));
  }
  destroy() {
    this.target && (this.target.removeEventListener("pointerdown", this.pointerDownListener), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.target = null), this.stopMovement();
  }
}
var H = Object.defineProperty, Y = Object.getOwnPropertyDescriptor, c = (i, t, e, s) => {
  for (var r = s > 1 ? void 0 : s ? Y(t, e) : t, o = i.length - 1, l; o >= 0; o--)
    (l = i[o]) && (r = (s ? l(t, e, r) : l(r)) || r);
  return s && r && H(t, e, r), r;
};
let a = class extends u {
  constructor() {
    super(...arguments), this.items = [], this.defaultHeight = 200, this.numOfItems = 2, this.uniqueSelector = "", this.arrowClickScrollTopDelta = 40, this.needsTransition = !1, this.swipeDeltaMultiplier = 1, this.globalScrollY = 0, this.initialized = !1, this.virtualScrollHeight = this.clientHeight, this.containerHeight = 100, this.translateY = "", this.startIndex = 0, this.fadeInItems = !1, this.hostClientHeight = this.clientHeight, this.containerResizeObserver = new ResizeObserver(
      this.containerResize.bind(this)
    ), this.hostResizeObserver = new ResizeObserver(this.hostResize.bind(this)), this.hostSwipeListener = this.onHostSwipe.bind(this), this.fakeScrollbarDraggingListener = this.onFakeScrollbarDragging.bind(this), this.fakeScrollbarDragReleaseListener = this.onFakeScrollbarDragRelease.bind(this), this.fakeScrollbarDragStopListener = this.onFakeScrollbarDragStop.bind(this), this.dimensionChangedListener = this.dimensionChangedCB.bind(this), this.pauseUpdate = !1, this.scrolling = !1, this.localScrollY = 0, this.rawHeightUpdates = {}, this.scrollWaitTime = 250;
  }
  render() {
    return b`
      ${this.initialized ? b`
            <div
              class="container"
              style="--translateY:${this.translateY};"
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
          this.scrolling = !1, this.fadeInItems = !1;
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
      this.container = i.querySelector(".container"), this.innerSlot = i.querySelector("slot"), this.containerComputedStyle = getComputedStyle(this.container), this.containerResizeObserver.observe(this.container), this.hostResizeObserver.observe(this), this.addEventListener("swipe-detected", this.hostSwipeListener), this.dispatchEvent(
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
    var t;
    super.updated(i), this.fakeScrollbar && (i.has("hostClientHeight") || i.has("virtualScrollHeight")) && (this.fakeScrollbar.targetClientHeight = this.hostClientHeight, this.fakeScrollbar.targetScrollHeight = this.virtualScrollHeight), i.has("swipeScroll") && (this.swipeScroll ? (this.swipePhysics = new C(), this.swipePhysics.emitFor(this)) : (t = this.swipePhysics) == null || t.destroy());
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
  scrollByAmt(i, t = !1) {
    this.slowScrollBy(i, t);
  }
  onPowerScroll(i) {
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.fadeInItems = !1, this.classList.add("by-pass"), this.jumpToScrollTop(i.computedTargetScrollTop), this.dispatchEvent(new CustomEvent("scrolling")), this.scrollTop = 0;
  }
  setScrollTopAndTransform(i, t = !0) {
    var e;
    if (this.ft) {
      const s = (e = this.ft) == null ? void 0 : e.findIndexOfPixel(i), r = s !== 0 ? this.ft.getCumulativeHeight(s - 1) : 0, o = -(i - r);
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
    }).length !== this.numOfItems || this.pauseUpdate || (this.containerHeight = parseFloat(this.containerComputedStyle.height));
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
      if (this.scrollTimeout && clearTimeout(this.scrollTimeout), this.fadeInItems = !0, this.updateMemoryWithNewHeights(), this.updateContainerHeight(), this.localScrollY = this.getComputedLocalScrollY(), this.direction = i > 0 ? "DOWN" : i < 0 ? "UP" : "STABLE", this.dispatchEvent(new CustomEvent("scrolling")), this.scrolling = !0, t ? this.classList.add("by-pass") : this.classList.remove("by-pass"), this.direction === "DOWN" && this.localScrollY + i > this.containerHeight - this.clientHeight && this.startIndex + this.numOfItems <= this.items.length - 1) {
        this.classList.add("by-pass"), this.pauseUpdate = !0;
        const s = this.querySelector(
          this.uniqueSelector
        ).getBoundingClientRect().height, r = this.containerHeight - s, l = this.localScrollY + i - s - r, h = this.startIndex + 1, d = r + l;
        this.translateY = `${-d}px`, this.startIndex = h, this.dispatchEvent(
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
        const s = this.querySelectorAll(this.uniqueSelector), o = s[s.length - 1].getBoundingClientRect().height, l = this.containerHeight - o, p = this.containerHeight - this.localScrollY + Math.abs(i) - o - l, g = l + p;
        this.translateY = `calc(-100% + ${g}px)`;
        const w = this.startIndex - 1;
        this.startIndex = w, this.dispatchEvent(
          new CustomEvent("load", {
            detail: {
              indices: [this.startIndex, this.startIndex + this.numOfItems - 1]
            }
          })
        ), this.needsTransition && !t && this.container.animate(
          [
            // Keyframes
            {
              transform: `translateY(calc(-100% + ${g + i}px))`
            },
            // Start
            {
              transform: `translateY(calc(-100% + ${g}px))`
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
            this.scrolling = !1, this.fadeInItems = !1, this.dispatchEvent(new CustomEvent("scroll-stopped"));
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
    var l;
    if (!this.ft) return;
    this.updateMemoryWithNewHeights();
    const e = t.length, s = this.items.length, r = e - s;
    if (r <= 0) return;
    const o = new Float64Array(e);
    i === "append" ? (o.set(this.rawHeights), o.fill(this.defaultHeight, s)) : (o.fill(this.defaultHeight, 0, r), o.set(this.rawHeights, r)), this.rawHeights = o, this.items = t, this.ft.initAll(this.rawHeights), this.updateTotalVirtualHeight(), this.setScrollStateFromCurrentView(), (l = this.fakeScrollbar) == null || l.setToScrollTop(this.globalScrollY);
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
    var r;
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.classList.add("by-pass"), this.scrollTop = 0;
    const s = Math.min(
      Math.max(0, i),
      this.virtualScrollHeight - this.clientHeight
    );
    this.classList.add("by-pass"), this.pauseUpdate = !1, this.scrolling = !0, this.globalScrollY = s, this.setScrollTopAndTransform(s, e), t && ((r = this.fakeScrollbar) == null || r.setToScrollTop(s));
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
        this.fadeInItems = !0, this.scrolling = !0, this.repeatedScrollByPixels(t);
        break;
      case "pagedown":
      case "pageup":
        this.fadeInItems = !1, this.scrolling = !0, requestAnimationFrame(() => {
          this.pauseUpdate || (this.updateMemoryWithNewHeights(), this.setScrollStateFromCurrentView(), this.accurateJumpTo(this.globalScrollY + t));
        });
    }
  }
  onKeyUp(i) {
    this.tickFrame && cancelAnimationFrame(this.tickFrame), this.scrollTimeout && clearTimeout(this.scrollTimeout);
    const t = i.toLowerCase();
    (t === "pageup" || t === "pagedown") && this.allStable().then(() => {
      this.pauseUpdate || this.tickFrame && cancelAnimationFrame(this.tickFrame);
    }), t === "escape" && (this.focus(), this.blur()), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrolling = !1, this.updateMemoryWithNewHeights(), this.setScrollStateFromCurrentView(), this.dispatchEvent(new CustomEvent("scroll-stopped"));
    }, this.scrollWaitTime);
  }
  stableJumpTo(i) {
    this.tickFrame && cancelAnimationFrame(this.tickFrame), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.classList.add("by-pass"), this.jumpToScrollTop(i);
  }
  onPageResize(i, t) {
    var e, s;
    if (this.ft) {
      const r = t.height;
      this.scrolling ? (this.rawHeightUpdates[i] = r, this.updateTotalVirtualHeight()) : (this.updateMemoryWithNewHeights(), (e = this.ft) == null || e.update(i, r), this.updateTotalVirtualHeight(), this.localScrollY = this.getComputedLocalScrollY(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (s = this.fakeScrollbar) == null || s.setToScrollTop(this.globalScrollY));
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
        var r;
        this.updateMemoryWithNewHeights(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (r = this.fakeScrollbar) == null || r.setToScrollTop(this.globalScrollY);
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
  onHostSwipe(i) {
    var s;
    if (this.scrollTop = 0, (s = this.fakeScrollbar) != null && s.dragging) {
      i.preventDefault();
      return;
    }
    this.scrolling = !0;
    const e = -i.detail.deltaY * this.swipeDeltaMultiplier;
    this.slowScrollBy(e, !0), this.dispatchEvent(new CustomEvent("scrolling"));
  }
  /**
   * This function is for highly accurate jumps to a particular
   * location. Accuracy means, this function will take into account the
   * updated heights after render and then correctly move to the required
   * scrollTop. Little computationally expensive as Lit has to
   * render twice, but if it is needed say to jump across
   * a 1000 pages on a high frequency like a page up or page down, this
   * function will come in handy.
   *
   * Make sure ` this.updateMemoryWithNewHeights();
   * this.setScrollStateFromCurrentView();` are called before
   * calling this function
   * @param scrollTop
   */
  accurateJumpTo(i) {
    requestAnimationFrame(() => {
      if (this.fadeInItems = !1, this.scrolling = !0, this.pauseUpdate) return;
      const t = this.globalScrollY, e = i - t, s = this.getComputedLocalScrollY();
      if (s + e < 0 || s + e > this.containerHeight - this.clientHeight) {
        this.pauseUpdate = !0;
        const r = this.startIndex;
        this.container.style.opacity = "0", this.stableJumpTo(this.globalScrollY + e), this.updateComplete.then(() => {
          this.allStable().then(() => {
            this.updateMemoryWithNewHeights();
            const l = (r !== 0 ? this.ft.getCumulativeHeight(r - 1) : 0) + s + e;
            this.stableJumpTo(l), this.updateComplete.then(() => {
              this.allStable().then(() => {
                this.container.style.opacity = "1", this.dispatchEvent(new CustomEvent("scrolling"));
              });
            });
          });
        });
        return;
      }
      this.stableJumpTo(this.globalScrollY + e), this.dispatchEvent(new CustomEvent("scrolling"));
    });
  }
};
a.styles = v`
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
  n({ type: Array })
], a.prototype, "items", 2);
c([
  n({ type: String, reflect: !0 })
], a.prototype, "defaultHeight", 2);
c([
  n({ type: Number, reflect: !0, attribute: "num-of-items" })
], a.prototype, "numOfItems", 2);
c([
  n({ type: String, reflect: !0, attribute: "unique-selector" })
], a.prototype, "uniqueSelector", 2);
c([
  n({
    type: Number,
    reflect: !0,
    attribute: "arrow-click-scroll-delta"
  })
], a.prototype, "arrowClickScrollTopDelta", 2);
c([
  n({ type: Boolean, reflect: !0, attribute: "needs-transition" })
], a.prototype, "needsTransition", 2);
c([
  n({ type: Object })
], a.prototype, "fakeScrollbar", 2);
c([
  n({ type: Boolean, reflect: !0, attribute: "swipe-scroll" })
], a.prototype, "swipeScroll", 2);
c([
  n({
    type: Number,
    reflect: !0,
    attribute: "swipe-delta-multiplier"
  })
], a.prototype, "swipeDeltaMultiplier", 2);
c([
  f()
], a.prototype, "globalScrollY", 2);
c([
  f()
], a.prototype, "initialized", 2);
c([
  f()
], a.prototype, "virtualScrollHeight", 2);
c([
  f()
], a.prototype, "containerHeight", 2);
c([
  f()
], a.prototype, "translateY", 2);
c([
  n({ type: Number, reflect: !0 })
], a.prototype, "startIndex", 2);
c([
  n({ type: Boolean, reflect: !0, attribute: "fade-in-items" })
], a.prototype, "fadeInItems", 2);
c([
  n({ type: Number, reflect: !0 })
], a.prototype, "hostClientHeight", 2);
a = c([
  y("missing-page-virtualizer")
], a);
export {
  a as MissingPageVirtualizer
};
//# sourceMappingURL=index.js.map
