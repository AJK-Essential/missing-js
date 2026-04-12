import { LitElement as S, css as v, html as b } from "lit";
import { property as h, state as f, queryAssignedElements as y, customElement as T } from "lit/decorators.js";
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
class C {
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
    let o = t + 1;
    for (; o <= this.size; )
      this.tree[o] += s, o += o & -o;
  }
  getCumulativeHeight(t) {
    let e = 0, s = t + 1;
    for (; s > 0; )
      e += this.tree[s], s -= s & -s;
    return e;
  }
  findIndexOfPixel(t) {
    if (t < 0) return 0;
    let e = 0, s = 0, o = 1 << Math.floor(Math.log2(this.size));
    for (; o > 0; ) {
      const r = e + o;
      r <= this.size && s + this.tree[r] <= t && (e = r, s += this.tree[e]), o >>= 1;
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
  for (var o = void 0, r = i.length - 1, l; r >= 0; r--)
    (l = i[r]) && (o = l(t, e, o) || o);
  return o && k(t, e, o), o;
};
class p extends S {
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
      const e = this.getBoundingClientRect(), s = e.top, o = e.bottom, r = t.composedPath()[0];
      if (this.tabbingElementSelector) {
        let l = Array.from(
          this.querySelectorAll(this.tabbingElementSelector)
        );
        if (l.includes(r)) {
          this.scrollTop = 0;
          let a;
          if (this.tabPressed && !this.shiftPressed) {
            if (t.preventDefault(), await this.runAfterTransitions(r), l.indexOf(r) !== l.length - 1) {
              if (r.getBoundingClientRect().top < s) {
                const u = l.find(
                  (g) => g.getBoundingClientRect().top >= s
                );
                u && u.focus();
                return;
              }
              a = this.getNextScrollDelta(
                r,
                "forwards",
                s,
                o
              );
            } else {
              let d = r.getBoundingClientRect();
              a = d.top - this.clientHeight / 2 + d.height / 2;
            }
            this.tabPressed = !1, this.shiftPressed = !1, this.noOpacityChange = !0, this.scrollByAmt(a), this.scrollCheck();
          } else if (this.tabPressed && this.shiftPressed) {
            if (t.preventDefault(), await this.runAfterTransitions(r), l.indexOf(r) !== 0) {
              if (r.getBoundingClientRect().bottom >= o) {
                const u = l.findLast(
                  (g) => g.getBoundingClientRect().bottom <= o
                );
                u && u.focus();
                return;
              }
              a = this.getNextScrollDelta(
                r,
                "backwards",
                s,
                o
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
  getNextScrollDelta(t, e, s, o) {
    let r = 0, l = t.getBoundingClientRect();
    if (e === "forwards") {
      const a = l.top < o && l.bottom <= o ? "completely-within" : l.top <= o && l.bottom > o ? "partially-within" : "out";
      a === "completely-within" ? r = 0 : (a === "partially-within" || a === "out") && (l.height >= this.clientHeight ? r = l.top - s : r = a === "out" ? l.top - this.clientHeight / 2 + l.height / 2 : l.bottom - o);
    } else {
      const a = l.bottom > s && l.top >= s ? "completely-within" : l.bottom >= s && l.top < s ? "partially-within" : "out";
      a === "completely-within" ? r = 0 : (a === "partially-within" || a === "out") && (l.height >= this.clientHeight ? r = l.bottom - o : r = a === "out" ? l.top - this.clientHeight / 2 + l.height / 2 : l.top - s);
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
    const e = window.getComputedStyle(t), s = parseFloat(e.transitionDuration) * 1e3, o = parseFloat(e.transitionDelay) * 1e3, r = s + o;
    r > 0 && await this.wait(r + 20);
  }
  jumpToScrollTop(t) {
  }
  onKeyDown(t, e) {
  }
  onKeyUp(t) {
  }
}
m([
  h({
    type: String,
    reflect: !0,
    attribute: "tabbing-element-selector"
  })
], p.prototype, "tabbingElementSelector");
m([
  h({ type: Boolean, reflect: !0, attribute: "default-tabbing" })
], p.prototype, "defaultTabbing");
m([
  h({
    type: Boolean,
    reflect: !0,
    attribute: "default-arrow-up-navigation"
  })
], p.prototype, "defaultArrowUpNavigation");
m([
  h({
    type: Boolean,
    reflect: !0,
    attribute: "default-arrow-down-navigation"
  })
], p.prototype, "defaultArrowDownNavigation");
m([
  h({
    type: Boolean,
    reflect: !0,
    attribute: "default-page-up-navigation"
  })
], p.prototype, "defaultPageUpNavigation");
m([
  h({
    type: Boolean,
    reflect: !0,
    attribute: "default-page-down-navigation"
  })
], p.prototype, "defaultPageDownNavigation");
m([
  h({ type: Object })
], p.prototype, "keyboardIncrements");
m([
  h({
    type: Number,
    reflect: !0,
    attribute: "tabbing-item-transition-time"
  })
], p.prototype, "tabbingItemTransitionTime");
/**
 * Missing JS - @missing-js/swipe-physics-emitter
 * @license MIT
 * Copyright (c) 2026 Missing JS / AJK-Essential.
 * ---------------------------------------------------------
 * Licensed under the MIT License.
 * Free for personal and commercial use.
 */
class Y {
  constructor() {
    this.friction = 0.95, this.velocityX = 0, this.velocityY = 0, this.isDragging = !1, this.lastX = 0, this.lastY = 0, this.lastTime = 0, this.startX = 0, this.startY = 0, this.startTime = 0, this.animationId = null, this.pointerMoveListener = this.onPointerMove.bind(this), this.pointerDownListener = this.onPointerDown.bind(this), this.pointerUpListener = this.onPointerUp.bind(this), this.physicsLoop = () => {
      if (this.isDragging) return;
      const t = performance.now(), e = t - this.lastTime;
      this.lastTime = t;
      const s = Math.min(e, 64), o = s / 16.66;
      this.velocityX *= Math.pow(this.friction, o), this.velocityY *= Math.pow(this.friction, o);
      const r = this.velocityX * s, l = this.velocityY * s;
      this.dispatch(r, l, !1), Math.abs(this.velocityX) > 0.01 || Math.abs(this.velocityY) > 0.01 ? this.animationId = requestAnimationFrame(this.physicsLoop) : this.stopMovement();
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
    const o = {
      deltaX: t,
      deltaY: e,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      isDragging: s
    }, r = new CustomEvent("swipe-detected", {
      detail: o,
      bubbles: !0,
      composed: !0
    });
    this.target.dispatchEvent(r);
  }
  onPointerDown(t) {
    this.target && t.pointerType !== "mouse" && (this.stopMovement(), this.isDragging = !0, this.startX = t.clientX, this.startY = t.clientY, this.startTime = performance.now(), this.lastX = this.startX, this.lastY = this.startY, this.lastTime = this.startTime, this.target.setPointerCapture(t.pointerId), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.target.addEventListener("pointermove", this.pointerMoveListener), this.target.addEventListener("pointerup", this.pointerUpListener));
  }
  onPointerMove(t) {
    if (!this.isDragging) return;
    const e = performance.now(), s = t.clientX - this.lastX, o = t.clientY - this.lastY, r = e - this.lastTime;
    if (r > 0) {
      const l = s / r, a = o / r;
      this.velocityX = this.velocityX * 0.6 + l * 0.4, this.velocityY = this.velocityY * 0.6 + a * 0.4;
    }
    this.dispatch(s, o, !0), this.lastX = t.clientX, this.lastY = t.clientY, this.lastTime = e;
  }
  onPointerUp(t) {
    if (!this.isDragging || !this.target) return;
    this.target.releasePointerCapture(t.pointerId), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.isDragging = !1;
    const e = performance.now(), s = Math.abs(t.clientX - this.startX), o = Math.abs(t.clientY - this.startY), r = e - this.startTime;
    if (e - this.lastTime > 50) {
      this.stopMovement();
      return;
    }
    if (s < 10 && o < 10 && r < 200) {
      this.stopMovement();
      return;
    }
    this.lastTime = performance.now(), this.animationId = requestAnimationFrame(this.physicsLoop);
  }
  destroy() {
    this.target && (this.target.removeEventListener("pointerdown", this.pointerDownListener), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.target = null), this.stopMovement();
  }
}
var H = Object.defineProperty, x = Object.getOwnPropertyDescriptor, c = (i, t, e, s) => {
  for (var o = s > 1 ? void 0 : s ? x(t, e) : t, r = i.length - 1, l; r >= 0; r--)
    (l = i[r]) && (o = (s ? l(t, e, o) : l(o)) || o);
  return s && o && H(t, e, o), o;
};
let n = class extends p {
  constructor() {
    super(...arguments), this.items = [], this.defaultHeight = 200, this.numOfItems = 2, this.uniqueSelector = "", this.arrowClickScrollTopDelta = 40, this.needsTransition = !1, this.swipeDeltaMultiplier = 1, this.globalScrollY = 0, this.initialized = !1, this.virtualScrollHeight = this.clientHeight, this.containerHeight = 100, this.translateY = "", this.startIndex = 0, this.hostClientHeight = this.clientHeight, this.containerResizeObserver = new ResizeObserver(
      this.containerResize.bind(this)
    ), this.hostResizeObserver = new ResizeObserver(this.hostResize.bind(this)), this.hostSwipeListener = this.onHostSwipe.bind(this), this.fakeScrollbarDraggingListener = this.onFakeScrollbarDragging.bind(this), this.fakeScrollbarDragReleaseListener = this.onFakeScrollbarDragRelease.bind(this), this.fakeScrollbarDragStopListener = this.onFakeScrollbarDragStop.bind(this), this.dimensionChangedListener = this.dimensionChangedCB.bind(this), this.pauseUpdate = !1, this.scrolling = !1, this.localScrollY = 0, this.rawHeightUpdates = {}, this.scrollWaitTime = 250, this.jumpSkipping = !1;
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
      if (this.slotChangedResolve && (this.slotChangedResolve(), this.slotChangedResolve = void 0), this.pauseUpdate) {
        this.classList.add("by-pass");
        const e = this.innerSlot.assignedElements({
          flatten: !0
        });
        await this.tillPainted(), await this.tillStable([this.container, ...e]), this.localScrollY = this.getComputedLocalScrollY(), this.updateMemoryWithNewHeights(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (t = this.fakeScrollbar) == null || t.setToScrollTop(this.globalScrollY), this.pauseUpdate = !1, this.style.opacity = "1", this.dispatchEvent(new CustomEvent("scroll-stopped")), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
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
      this.ft = new C(this.items.length), this.rawHeights = new Float64Array(this.items.length).fill(
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
    super.updated(i), this.fakeScrollbar && (i.has("hostClientHeight") || i.has("virtualScrollHeight")) && (this.fakeScrollbar.targetClientHeight = this.hostClientHeight, this.fakeScrollbar.targetScrollHeight = this.virtualScrollHeight), i.has("swipeScroll") && (this.swipeScroll ? (this.swipePhysics = new Y(), this.swipePhysics.emitFor(this)) : (t = this.swipePhysics) == null || t.destroy());
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
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.classList.add("by-pass"), this.jumpToScrollTop(i.computedTargetScrollTop), this.dispatchEvent(new CustomEvent("scrolling")), this.scrollTop = 0;
  }
  setScrollTopAndTransform(i, t = !0) {
    var e;
    if (this.ft) {
      const s = (e = this.ft) == null ? void 0 : e.findIndexOfPixel(i), o = s !== 0 ? this.ft.getCumulativeHeight(s - 1) : 0, r = -(i - o);
      this.translateY = `${r}px`, this.startIndex = s, t && this.dispatchEvent(
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
      if (this.scrollTimeout && clearTimeout(this.scrollTimeout), this.updateMemoryWithNewHeights(), this.updateContainerHeight(), this.localScrollY = this.getComputedLocalScrollY(), this.direction = i > 0 ? "DOWN" : i < 0 ? "UP" : "STABLE", this.dispatchEvent(new CustomEvent("scrolling")), this.scrolling = !0, t ? this.classList.add("by-pass") : this.classList.remove("by-pass"), this.direction === "DOWN" && this.localScrollY + i > this.containerHeight - this.clientHeight && this.startIndex + this.numOfItems <= this.items.length - 1) {
        this.classList.add("by-pass"), this.pauseUpdate = !0;
        const s = this.querySelector(
          this.uniqueSelector
        ).getBoundingClientRect().height, o = this.containerHeight - s, l = this.localScrollY + i - s - o, a = this.startIndex + 1, d = o + l;
        this.translateY = `${-d}px`, this.startIndex = a, this.noOpacityChange ? this.noOpacityChange = !1 : this.style.opacity = "0", this.dispatchEvent(
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
        const s = this.querySelectorAll(this.uniqueSelector), r = s[s.length - 1].getBoundingClientRect().height, l = this.containerHeight - r, u = this.containerHeight - this.localScrollY + Math.abs(i) - r - l, g = l + u;
        this.translateY = `calc(-100% + ${g}px)`;
        const w = this.startIndex - 1;
        this.startIndex = w, this.noOpacityChange ? this.noOpacityChange = !1 : this.style.opacity = "0", this.dispatchEvent(
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
    var l;
    if (!this.ft) return;
    this.updateMemoryWithNewHeights();
    const e = t.length, s = this.items.length, o = e - s;
    if (o <= 0) return;
    const r = new Float64Array(e);
    i === "append" ? (r.set(this.rawHeights), r.fill(this.defaultHeight, s)) : (r.fill(this.defaultHeight, 0, o), r.set(this.rawHeights, o)), this.rawHeights = r, this.items = t, this.ft.initAll(this.rawHeights), this.updateTotalVirtualHeight(), this.setScrollStateFromCurrentView(), (l = this.fakeScrollbar) == null || l.setToScrollTop(this.globalScrollY);
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
    var o;
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.classList.add("by-pass"), this.scrollTop = 0;
    const s = Math.min(
      Math.max(0, i),
      this.virtualScrollHeight - this.clientHeight
    );
    this.classList.add("by-pass"), this.pauseUpdate = !1, this.scrolling = !0, this.globalScrollY = s, this.setScrollTopAndTransform(s, e), t && ((o = this.fakeScrollbar) == null || o.setToScrollTop(s));
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
  async onKeyDown(i, t) {
    switch (this.scrollTimeout && clearTimeout(this.scrollTimeout), i) {
      case "arrowup":
      case "arrowdown":
        this.scrolling = !0, this.repeatedScrollByPixels(t);
        break;
      case "pagedown":
      case "pageup":
        this.scrolling = !0, requestAnimationFrame(async () => {
          if (this.pauseUpdate) return;
          this.updateMemoryWithNewHeights();
          let s = this.getCurrentGlobalScrollYFromView() + t;
          s = Math.min(
            Math.max(0, s),
            this.virtualScrollHeight - this.clientHeight
          ), await this.accurateJumpTo(s);
        });
    }
  }
  onKeyUp(i) {
    this.tickFrame && cancelAnimationFrame(this.tickFrame);
    const t = i.toLowerCase();
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
  stableJumpTo(i) {
    this.tickFrame && cancelAnimationFrame(this.tickFrame), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.classList.add("by-pass"), this.jumpToScrollTop(i);
  }
  onPageResize(i, t) {
    var e, s;
    if (this.ft) {
      const o = t.height;
      this.scrolling ? (this.rawHeightUpdates[i] = o, this.updateTotalVirtualHeight()) : (this.updateMemoryWithNewHeights(), (e = this.ft) == null || e.update(i, o), this.updateTotalVirtualHeight(), this.localScrollY = this.getComputedLocalScrollY(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (s = this.fakeScrollbar) == null || s.setToScrollTop(this.globalScrollY));
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
        var o;
        this.updateMemoryWithNewHeights(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (o = this.fakeScrollbar) == null || o.setToScrollTop(this.globalScrollY);
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
  async accurateJumpTo(i) {
    requestAnimationFrame(async () => {
      var o;
      if (!this.ft || (this.scrolling = !0, this.jumpSkipping)) return;
      const t = this.getCurrentGlobalScrollYFromView(), e = i - t;
      this.containerHeight = parseFloat(this.containerComputedStyle.height);
      let s = this.getComputedLocalScrollY();
      if (s + e < 0 || s + e > this.containerHeight - this.clientHeight) {
        this.jumpSkipping = !0;
        const r = this.startIndex;
        this.style.opacity = "0", this.stableJumpTo(this.globalScrollY + e), await this.updateComplete, await this.waitForSlotChangedEvent(), await this.allStable(), await Promise.all(this.listItems.map((u) => u.isReady)), this.updateMemoryWithNewHeights();
        const a = (r !== 0 ? this.ft.getCumulativeHeight(r - 1) : 0) + s + e, d = this.ft.findIndexOfPixel(
          a
        );
        this.stableJumpTo(a), await this.updateComplete, d !== this.startIndex && await this.waitForSlotChangedEvent(), await this.allStable(), await Promise.all(this.listItems.map((u) => u.isReady)), this.style.opacity = "1", this.dispatchEvent(new CustomEvent("scrolling")), this.jumpSkipping = !1;
        return;
      }
      s += e, this.translateY = `${-s}px`, this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + s, (o = this.fakeScrollbar) == null || o.setToScrollTop(this.globalScrollY), this.dispatchEvent(new CustomEvent("scrolling"));
    });
  }
  createSlotChangedPromise() {
    return new Promise((i) => {
      this.slotChangedResolve = i;
    });
  }
  async waitForSlotChangedEvent() {
    await this.createSlotChangedPromise();
  }
  getCurrentGlobalScrollYFromView() {
    const i = this.getComputedLocalScrollY();
    return (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + i;
  }
};
n.styles = v`
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
  y()
], n.prototype, "listItems", 2);
n = c([
  T("missing-page-virtualizer")
], n);
export {
  n as MissingPageVirtualizer
};
//# sourceMappingURL=index.js.map
