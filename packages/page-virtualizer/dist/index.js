import { LitElement as k, css as y, html as w } from "lit";
import { property as n, state as m, queryAssignedElements as T, customElement as Y } from "lit/decorators.js";
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
    for (let i = 0; i < t.length; i++)
      this.tree[i + 1] = t[i];
    for (let i = 1; i <= t.length; i++) {
      let s = i + (i & -i);
      s <= t.length && (this.tree[s] += this.tree[i]);
    }
  }
  /**
   * Updates the height of an item at a specific index.
   * Time Complexity: O(log N)
   */
  update(t, i) {
    const s = i - this.values[t];
    if (s === 0) return;
    this.values[t] = i;
    let l = t + 1;
    for (; l <= this.size; )
      this.tree[l] += s, l += l & -l;
  }
  getCumulativeHeight(t) {
    let i = 0, s = t + 1;
    for (; s > 0; )
      i += this.tree[s], s -= s & -s;
    return i;
  }
  findIndexOfPixel(t) {
    if (t < 0) return 0;
    let i = 0, s = 0, l = 1 << Math.floor(Math.log2(this.size));
    for (; l > 0; ) {
      const o = i + l;
      o <= this.size && s + this.tree[o] <= t && (i = o, s += this.tree[i]), l >>= 1;
    }
    return i;
  }
  getSingleHeight(t) {
    return this.values[t];
  }
  getValues() {
    return this.values;
  }
}
var E = Object.defineProperty, b = (e, t, i, s) => {
  for (var l = void 0, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (l = r(t, i, l) || l);
  return l && E(t, i, l), l;
};
class f extends k {
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
    return new Promise((i) => setTimeout(i, t));
  }
  setupKeyboardInteractions() {
    this.addEventListener("keydown", this.keyboardDownEventListener), window.addEventListener("keyup", this.keyboardUpEventListener), document.body.addEventListener(
      "keydown",
      this.documentKeyboardDownListener
    ), this.defaultTabbing && this.addEventListener("focusin", async (t) => {
      const i = this.getBoundingClientRect(), s = i.top, l = i.bottom, o = t.composedPath()[0];
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
                const h = r.find(
                  (S) => S.getBoundingClientRect().top >= s
                );
                h && h.focus();
                return;
              }
              a = this.getNextScrollDelta(
                o,
                "forwards",
                s,
                l
              );
            } else {
              let c = o.getBoundingClientRect();
              a = c.top - this.clientHeight / 2 + c.height / 2;
            }
            this.tabPressed = !1, this.shiftPressed = !1, this.noOpacityChange = !0, this.scrollByAmt(a), this.scrollCheck();
          } else if (this.tabPressed && this.shiftPressed) {
            if (t.preventDefault(), await this.runAfterTransitions(o), r.indexOf(o) !== 0) {
              if (o.getBoundingClientRect().bottom >= l) {
                const h = r.findLast(
                  (S) => S.getBoundingClientRect().bottom <= l
                );
                h && h.focus();
                return;
              }
              a = this.getNextScrollDelta(
                o,
                "backwards",
                s,
                l
              );
            } else {
              let c = o.getBoundingClientRect();
              a = c.top - this.clientHeight / 2 + c.height / 2;
            }
            this.tabPressed = !1, this.shiftPressed = !1, this.noOpacityChange = !0, this.scrollByAmt(a), this.scrollCheck();
          }
        }
      }
    });
  }
  getNextScrollDelta(t, i, s, l) {
    let o = 0, r = t.getBoundingClientRect();
    if (i === "forwards") {
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
  scrollByAmt(t, i = !1) {
  }
  scrollCheck() {
  }
  keyboardDownEventCB(t) {
    const i = t.key.toLowerCase();
    switch (i) {
      case "arrowdown":
        this.defaultArrowDownNavigation && (this.focus(), this.onKeyDown(i, this.keyboardIncrements[i]));
        break;
      case "arrowup":
        this.defaultArrowUpNavigation && (this.focus(), this.onKeyDown(i, this.keyboardIncrements[i]));
        break;
      case "pagedown":
        this.defaultPageDownNavigation && (this.focus(), t.preventDefault(), this.onKeyDown(i, this.keyboardIncrements[i]));
        break;
      case "pageup":
        this.defaultPageUpNavigation && (this.focus(), t.preventDefault(), this.onKeyDown(i, this.keyboardIncrements[i]));
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
    const i = window.getComputedStyle(t), s = parseFloat(i.transitionDuration) * 1e3, l = parseFloat(i.transitionDelay) * 1e3, o = s + l;
    o > 0 && await this.wait(o + 20);
  }
  jumpToScrollTop(t) {
  }
  onKeyDown(t, i) {
  }
  onKeyUp(t) {
  }
}
b([
  n({
    type: String,
    reflect: !0,
    attribute: "tabbing-element-selector"
  })
], f.prototype, "tabbingElementSelector");
b([
  n({ type: Boolean, reflect: !0, attribute: "default-tabbing" })
], f.prototype, "defaultTabbing");
b([
  n({
    type: Boolean,
    reflect: !0,
    attribute: "default-arrow-up-navigation"
  })
], f.prototype, "defaultArrowUpNavigation");
b([
  n({
    type: Boolean,
    reflect: !0,
    attribute: "default-arrow-down-navigation"
  })
], f.prototype, "defaultArrowDownNavigation");
b([
  n({
    type: Boolean,
    reflect: !0,
    attribute: "default-page-up-navigation"
  })
], f.prototype, "defaultPageUpNavigation");
b([
  n({
    type: Boolean,
    reflect: !0,
    attribute: "default-page-down-navigation"
  })
], f.prototype, "defaultPageDownNavigation");
b([
  n({ type: Object })
], f.prototype, "keyboardIncrements");
b([
  n({
    type: Number,
    reflect: !0,
    attribute: "tabbing-item-transition-time"
  })
], f.prototype, "tabbingItemTransitionTime");
/**
 * Missing JS - @missing-js/swipe-physics-emitter
 * @license MIT
 * Copyright (c) 2026 Missing JS / AJK-Essential.
 * ---------------------------------------------------------
 * Licensed under the MIT License.
 * Free for personal and commercial use.
 */
class H {
  constructor() {
    this.friction = 0.95, this.velocityX = 0, this.velocityY = 0, this.isDragging = !1, this.lastX = 0, this.lastY = 0, this.lastTime = 0, this.startX = 0, this.startY = 0, this.startTime = 0, this.animationId = null, this.pendingDeltaX = 0, this.pendingDeltaY = 0, this.moveRequested = !1, this.pointerMoveListener = this.onPointerMove.bind(this), this.pointerDownListener = this.onPointerDown.bind(this), this.pointerUpListener = this.onPointerUp.bind(this), this.physicsLoop = () => {
      if (this.isDragging) return;
      const t = performance.now(), i = t - this.lastTime;
      this.lastTime = t;
      const s = Math.min(i, 64), l = s / 16.66;
      this.velocityX *= Math.pow(this.friction, l), this.velocityY *= Math.pow(this.friction, l);
      const o = this.velocityX * s, r = this.velocityY * s;
      this.dispatch(o, r, !1), Math.abs(this.velocityX) > 0.01 || Math.abs(this.velocityY) > 0.01 ? this.animationId = requestAnimationFrame(this.physicsLoop) : this.stopMovement();
    };
  }
  emitFor(t) {
    this.target = t, this.target.style.touchAction = "none", this.target.style.userSelect = "none", this.target.addEventListener("pointerdown", this.pointerDownListener);
  }
  stopMovement() {
    this.animationId && (cancelAnimationFrame(this.animationId), this.animationId = null), this.velocityX = 0, this.velocityY = 0, this.pendingDeltaX = 0, this.pendingDeltaY = 0;
  }
  dispatch(t, i, s) {
    if (!this.target) return;
    const l = {
      deltaX: Math.round(t * 100) / 100,
      deltaY: Math.round(i * 100) / 100,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      isDragging: s
    };
    this.target.dispatchEvent(
      new CustomEvent("swipe-detected", {
        detail: l,
        bubbles: !0,
        composed: !0
      })
    );
  }
  onPointerDown(t) {
    this.target && t.pointerType !== "mouse" && (this.stopMovement(), this.isDragging = !0, this.startX = t.clientX, this.startY = t.clientY, this.startTime = performance.now(), this.lastX = this.startX, this.lastY = this.startY, this.lastTime = this.startTime, this.target.setPointerCapture(t.pointerId), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.target.addEventListener("pointermove", this.pointerMoveListener), this.target.addEventListener("pointerup", this.pointerUpListener));
  }
  onPointerMove(t) {
    if (!this.isDragging) return;
    const i = t.getCoalescedEvents ? t.getCoalescedEvents() : [t];
    for (const s of i) {
      const l = performance.now(), o = s.clientX - this.lastX, r = s.clientY - this.lastY, a = l - this.lastTime;
      if (a > 0) {
        const c = o / a, h = r / a;
        this.velocityX = this.velocityX * 0.7 + c * 0.3, this.velocityY = this.velocityY * 0.7 + h * 0.3;
      }
      this.pendingDeltaX += o, this.pendingDeltaY += r, this.lastX = s.clientX, this.lastY = s.clientY, this.lastTime = l;
    }
    this.moveRequested || (this.moveRequested = !0, requestAnimationFrame(() => {
      this.isDragging && this.dispatch(this.pendingDeltaX, this.pendingDeltaY, !0), this.pendingDeltaX = 0, this.pendingDeltaY = 0, this.moveRequested = !1;
    }));
  }
  onPointerUp(t) {
    if (!this.isDragging) return;
    this.isDragging = !1, this.target && (this.target.releasePointerCapture(t.pointerId), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener));
    const i = performance.now(), s = i - this.startTime;
    if (i - this.lastTime > 60) {
      this.stopMovement();
      return;
    }
    if (Math.hypot(
      t.clientX - this.startX,
      t.clientY - this.startY
    ) < 10 && s < 200) {
      this.stopMovement();
      return;
    }
    this.lastTime = performance.now(), this.animationId = requestAnimationFrame(this.physicsLoop);
  }
  destroy() {
    this.target && (this.target.removeEventListener("pointerdown", this.pointerDownListener), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.target = null), this.stopMovement();
  }
}
var I = Object.defineProperty, L = Object.getOwnPropertyDescriptor, g = (e, t, i, s) => {
  for (var l = s > 1 ? void 0 : s ? L(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (l = (s ? r(t, i, l) : r(l)) || l);
  return s && l && I(t, i, l), l;
};
let u = class extends f {
  constructor() {
    super(...arguments), this.items = [], this.defaultHeight = 200, this.numOfItems = 2, this.uniqueSelector = "", this.arrowClickScrollTopDelta = 40, this.needsTransition = !1, this.swipeDeltaMultiplier = 1, this.globalScrollY = 0, this.initialized = !1, this.virtualScrollHeight = this.clientHeight, this.containerHeight = 100, this.translateY = "", this.startIndex = 0, this.hostClientHeight = this.clientHeight, this.containerResizeObserver = new ResizeObserver(
      this.containerResize.bind(this)
    ), this.hostResizeObserver = new ResizeObserver(this.hostResize.bind(this)), this.hostSwipeListener = this.onHostSwipe.bind(this), this.fakeScrollbarDraggingListener = this.onFakeScrollbarDragging.bind(this), this.fakeScrollbarDragReleaseListener = this.onFakeScrollbarDragRelease.bind(this), this.fakeScrollbarDragStopListener = this.onFakeScrollbarDragStop.bind(this), this.dimensionChangedListener = this.dimensionChangedCB.bind(this), this.pauseUpdate = !1, this.scrolling = !1, this.localScrollY = 0, this.rawHeightUpdates = {}, this.scrollWaitTime = 250, this.jumpSkipping = !1, this.accumulatedDelta = 0;
  }
  render() {
    return w`
      ${this.initialized ? w`
            <div
              class="container"
              style="--translateY:${this.translateY};"
              tabindex="0"
            >
              <slot
                @slotchange="${async (e) => {
      var t;
      if (this.slotChangedResolve && (this.slotChangedResolve(), this.slotChangedResolve = void 0), this.pauseUpdate) {
        this.classList.add("by-pass");
        const i = this.innerSlot.assignedElements({
          flatten: !0
        });
        await this.tillPainted(), await this.tillStable([this.container, ...i]), this.localScrollY = this.getComputedLocalScrollY(), this.localScrollY += this.accumulatedDelta, this.container.style.transform = `translateY(${-this.localScrollY}px)`, this.translateY = `${-this.localScrollY}px`, this.updateMemoryWithNewHeights(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, this.containerHeight = parseFloat(
          this.containerComputedStyle.height
        ), (t = this.fakeScrollbar) == null || t.setToScrollTop(this.globalScrollY), this.pauseUpdate = !1, this.dispatchEvent(new CustomEvent("scroll-stopped")), this.listItems.forEach(
          (s) => s.style.opacity = "1"
        ), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
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
      const e = this.renderRoot;
      this.container = e.querySelector(".container"), this.innerSlot = e.querySelector("slot"), this.containerComputedStyle = getComputedStyle(this.container), this.containerResizeObserver.observe(this.container), this.hostResizeObserver.observe(this), this.addEventListener("swipe-detected", this.hostSwipeListener), this.dispatchEvent(
        new CustomEvent("load", {
          detail: {
            indices: [this.startIndex, this.startIndex + this.numOfItems - 1]
          }
        })
      ), this.addEventListener("scroll", () => {
        this.scrollTop = 0;
      }), this.addEventListener("wheel", (t) => {
        this.slowScrollBy(t.deltaY, !0);
      }), this.setupKeyboardInteractions();
    });
  }
  updated(e) {
    var t;
    super.updated(e), this.fakeScrollbar && (e.has("hostClientHeight") || e.has("virtualScrollHeight")) && (this.fakeScrollbar.targetClientHeight = this.hostClientHeight, this.fakeScrollbar.targetScrollHeight = this.virtualScrollHeight), e.has("swipeScroll") && (this.swipeScroll ? (this.swipePhysics = new H(), this.swipePhysics.emitFor(this)) : (t = this.swipePhysics) == null || t.destroy());
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
  scrollByAmt(e, t = !1) {
    this.slowScrollBy(e, t);
  }
  onPowerScroll(e) {
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.classList.add("by-pass"), this.jumpToScrollTop(e.computedTargetScrollTop), this.dispatchEvent(new CustomEvent("scrolling")), this.scrollTop = 0;
  }
  setScrollTopAndTransform(e, t = !0) {
    var i;
    if (this.ft) {
      const s = (i = this.ft) == null ? void 0 : i.findIndexOfPixel(e), l = s !== 0 ? this.ft.getCumulativeHeight(s - 1) : 0, o = -(e - l);
      this.translateY = `${o}px`, this.localScrollY = -o, this.startIndex = s, t && this.dispatchEvent(
        new CustomEvent("load", {
          detail: {
            indices: [this.startIndex, this.startIndex + this.numOfItems - 1]
          }
        })
      );
    }
  }
  getTranslateXY(e) {
    let t;
    "element" in e ? t = window.getComputedStyle(e.element) : t = e.styleDeclaration;
    const i = new DOMMatrixReadOnly(t.transform);
    return {
      translateX: i.m41,
      // m41 holds the translateX value
      translateY: i.m42
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
  dimensionChangedCB(e) {
    if (this.scrollTop = 0, !this.ft) return;
    let i = e.detail.target;
    const s = parseInt(i.dataset.pageIndex);
    s > this.items.length - 1 || (i.isPage ? this.onPageResize(s, i) : this.onElementResize(i));
  }
  // TODO: See if this function can be eliminated in future updates
  slowScrollBy(e = 0, t = !1) {
    var i;
    if (this.pauseUpdate) {
      this.accumulatedDelta += e;
      return;
    } else
      this.accumulatedDelta = 0;
    if (this.scrollTimeout && clearTimeout(this.scrollTimeout), this.updateMemoryWithNewHeights(), this.scrolling || (this.updateContainerHeight(), this.localScrollY = this.getComputedLocalScrollY()), this.direction = e > 0 ? "DOWN" : e < 0 ? "UP" : "STABLE", this.dispatchEvent(new CustomEvent("scrolling")), this.scrolling = !0, t ? this.classList.add("by-pass") : this.classList.remove("by-pass"), this.direction === "DOWN" && this.localScrollY + e > this.containerHeight - this.clientHeight && this.startIndex + this.numOfItems <= this.items.length - 1) {
      this.classList.add("by-pass"), this.pauseUpdate = !0;
      const s = this.querySelector(
        this.uniqueSelector
      ).getBoundingClientRect().height, l = this.containerHeight - s, r = this.localScrollY + e - s - l, a = this.startIndex + 1, c = l + r;
      this.noOpacityChange ? this.noOpacityChange = !1 : this.listItems.forEach((h) => h.style.opacity = "0"), this.translateY = `${-c}px`, this.startIndex = a, this.dispatchEvent(
        new CustomEvent("load", {
          detail: {
            indices: [this.startIndex, this.startIndex + this.numOfItems - 1]
          }
        })
      ), this.needsTransition && !t && this.container.animate(
        [
          // Keyframes
          { transform: `translateY(${-c + e}px)` },
          // Start
          { transform: `translateY(${-c}px)` }
          // End
        ],
        {
          // Timing options
          duration: 300,
          easing: "ease"
        }
      ).finished.then(() => {
      });
    } else if (this.direction === "UP" && this.localScrollY + e <= 0 && this.startIndex - 1 >= 0) {
      this.classList.add("by-pass"), this.pauseUpdate = !0;
      const s = this.querySelectorAll(this.uniqueSelector), o = s[s.length - 1].getBoundingClientRect().height, r = this.containerHeight - o, h = this.containerHeight - this.localScrollY + Math.abs(e) - o - r, S = r + h;
      this.noOpacityChange ? this.noOpacityChange = !1 : this.listItems.forEach((v) => v.style.opacity = "0"), this.translateY = `calc(-100% + ${S}px)`;
      const x = this.startIndex - 1;
      this.startIndex = x, this.dispatchEvent(
        new CustomEvent("load", {
          detail: {
            indices: [this.startIndex, this.startIndex + this.numOfItems - 1]
          }
        })
      ), this.needsTransition && !t && this.container.animate(
        [
          // Keyframes
          {
            transform: `translateY(calc(-100% + ${S + e}px))`
          },
          // Start
          {
            transform: `translateY(calc(-100% + ${S}px))`
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
      this.localScrollY += e, this.localScrollY = Math.min(
        Math.max(0, this.localScrollY),
        this.containerHeight - this.clientHeight
      ), this.translateY = `${-this.localScrollY}px`, this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (i = this.fakeScrollbar) == null || i.setToScrollTop(this.globalScrollY), this.allStable().then(() => {
        this.pauseUpdate || (this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
          this.scrolling = !1, this.dispatchEvent(new CustomEvent("scroll-stopped"));
        }, this.scrollWaitTime));
      });
  }
  updateTotalVirtualHeight() {
    if (this.ft && this.fakeScrollbar) {
      const e = this.items.length - 1;
      this.virtualScrollHeight = this.ft.getCumulativeHeight(e), this.fakeScrollbar.targetScrollHeight = this.virtualScrollHeight, this.globalScrollY = Math.min(
        Math.max(0, this.globalScrollY),
        this.virtualScrollHeight - this.clientHeight
      );
    }
  }
  addNewData(e, t) {
    var r;
    if (!this.ft) return;
    this.updateMemoryWithNewHeights();
    const i = t.length, s = this.items.length, l = i - s;
    if (l <= 0) return;
    const o = new Float64Array(i);
    e === "append" ? (o.set(this.rawHeights), o.fill(this.defaultHeight, s)) : (o.fill(this.defaultHeight, 0, l), o.set(this.rawHeights, l)), this.rawHeights = o, this.items = t, this.ft.initAll(this.rawHeights), this.updateTotalVirtualHeight(), this.setScrollStateFromCurrentView(), (r = this.fakeScrollbar) == null || r.setToScrollTop(this.globalScrollY);
  }
  goToPageIndex(e) {
    if (this.ft) {
      const t = Math.min(
        Math.max(0, e),
        this.rawHeights.length - 1
      );
      e < 0 ? console.warn(
        "pageIndex provided is less than min page-index of 0. Therefore showing page of pageIndex=0"
      ) : e > this.rawHeights.length - 1 && console.warn(
        `pageIndex provided is greater than max page-index of ${this.rawHeights.length - 1}. Therefore showing page of pageIndex=${this.rawHeights.length - 1} `
      );
      const i = t === 0 ? 0 : this.ft.getCumulativeHeight(t - 1);
      this.jumpToScrollTop(i);
    }
  }
  jumpToScrollTop(e, t = !0, i = !0) {
    var l;
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.classList.add("by-pass"), this.scrollTop = 0;
    const s = Math.min(
      Math.max(0, e),
      this.virtualScrollHeight - this.clientHeight
    );
    this.classList.add("by-pass"), this.pauseUpdate = !1, this.scrolling = !0, this.globalScrollY = s, this.setScrollTopAndTransform(s, i), t && ((l = this.fakeScrollbar) == null || l.setToScrollTop(s));
  }
  getCurrentScrollTop() {
    return this.globalScrollY;
  }
  tillPainted() {
    return new Promise((e) => {
      requestAnimationFrame(() => requestAnimationFrame(e));
    });
  }
  async tillStable(e) {
    await this.tillPainted();
    const t = e.flatMap(
      (i) => i.getAnimations({ subtree: !0 })
    );
    t.length && await Promise.allSettled(t.map((i) => i.finished));
  }
  async allStable(e = []) {
    await this.tillPainted();
    const t = this.innerSlot.assignedElements({ flatten: !0 });
    await this.tillStable([
      ...e,
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
    var e;
    this.updateMemoryWithNewHeights(), this.setScrollStateFromCurrentView(), (e = this.fakeScrollbar) == null || e.setToScrollTop(this.globalScrollY), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrolling = !1;
    }, this.scrollWaitTime), this.dispatchEvent(new CustomEvent("scroll-stopped"));
  }
  setScrollStateFromCurrentView(e) {
    this.classList.add("by-pass"), this.localScrollY = e || this.getComputedLocalScrollY(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, this.globalScrollY = Math.min(
      Math.max(0, this.globalScrollY),
      this.virtualScrollHeight - this.clientHeight
    ), this.setScrollTopAndTransform(this.globalScrollY);
  }
  updateMemoryWithNewHeights() {
    const e = Object.entries(this.rawHeightUpdates);
    if (e.length !== 0 && this.ft) {
      for (const [t, i] of e) {
        const s = parseInt(t);
        this.rawHeights[s] !== i && (this.ft.update(s, i), this.rawHeights[s] = i);
      }
      this.rawHeightUpdates = {}, this.updateTotalVirtualHeight();
    }
  }
  getCurrentPageIndex() {
    var e;
    return (e = this.ft) == null ? void 0 : e.findIndexOfPixel(this.globalScrollY);
  }
  getPageIndexForScrollTop(e) {
    var t;
    return (t = this.ft) == null ? void 0 : t.findIndexOfPixel(e);
  }
  async onKeyDown(e, t) {
    switch (this.scrollTimeout && clearTimeout(this.scrollTimeout), e) {
      case "arrowup":
      case "arrowdown":
        this.repeatedScrollByPixels(t);
        break;
      case "pagedown":
      case "pageup": {
        if (this.pauseUpdate) return;
        this.updateMemoryWithNewHeights();
        let s = this.getCurrentGlobalScrollYFromView() + t;
        s = Math.min(
          Math.max(0, s),
          this.virtualScrollHeight - this.clientHeight
        ), await this.accurateJumpTo(s);
      }
    }
  }
  onKeyUp(e) {
    this.tickFrame && cancelAnimationFrame(this.tickFrame);
    const t = e.toLowerCase();
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
  stableJumpTo(e) {
    this.tickFrame && cancelAnimationFrame(this.tickFrame), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.classList.add("by-pass"), this.jumpToScrollTop(e);
  }
  onPageResize(e, t) {
    var i, s;
    if (this.ft) {
      const l = t.height;
      this.scrolling ? (this.rawHeightUpdates[e] = l, this.updateTotalVirtualHeight()) : (this.updateMemoryWithNewHeights(), (i = this.ft) == null || i.update(e, l), this.updateTotalVirtualHeight(), this.localScrollY = this.getComputedLocalScrollY(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (s = this.fakeScrollbar) == null || s.setToScrollTop(this.globalScrollY));
    }
  }
  onElementResize(e) {
    var i;
    if (this.scrolling || (i = this.fakeScrollbar) != null && i.dragging) return;
    const t = e.height - e.oldHeight;
    if (!this.pauseUpdate && e.getBoundingClientRect().bottom - t < 0) {
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
  async runAfterAllTransitions(e) {
    for (let t of e)
      t && await this.runAfterTransitions(t);
  }
  jumpRelease() {
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrolling = !1, this.updateMemoryWithNewHeights(), this.setScrollStateFromCurrentView();
    }, this.scrollWaitTime);
  }
  onHostSwipe(e) {
    var s;
    if (this.scrollTop = 0, (s = this.fakeScrollbar) != null && s.dragging) {
      e.preventDefault();
      return;
    }
    const i = -e.detail.deltaY * this.swipeDeltaMultiplier;
    this.slowScrollBy(i, !0), this.dispatchEvent(new CustomEvent("scrolling"));
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
  async accurateJumpTo(e) {
    var l;
    if (!this.ft || this.jumpSkipping) return;
    this.updateMemoryWithNewHeights(), this.scrolling || (this.updateContainerHeight(), this.localScrollY = this.getComputedLocalScrollY()), this.scrolling = !0;
    const t = this.getCurrentGlobalScrollYFromView(), i = e - t, s = this.localScrollY;
    if (this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrolling = !1, this.dispatchEvent(new CustomEvent("scroll-stopped"));
    }, this.scrollWaitTime), this.dispatchEvent(new CustomEvent("scrolling")), this.classList.add("by-pass"), this.localScrollY + i < 0 || this.localScrollY + i > this.containerHeight - this.clientHeight) {
      this.jumpSkipping = !0;
      const o = this.startIndex;
      this.listItems.forEach((h) => h.style.opacity = "0"), this.stableJumpTo(this.globalScrollY + i), await this.updateComplete, await this.waitForSlotChangedEvent(), await this.allStable(), await Promise.all(this.listItems.map((h) => h.isReady)), this.updateMemoryWithNewHeights();
      const a = (o !== 0 ? this.ft.getCumulativeHeight(o - 1) : 0) + s + i, c = this.ft.findIndexOfPixel(
        a
      );
      this.stableJumpTo(a), await this.updateComplete, c !== this.startIndex && await this.waitForSlotChangedEvent(), await this.allStable(), await Promise.all(this.listItems.map((h) => h.isReady)), this.listItems.forEach((h) => h.style.opacity = "1"), this.jumpSkipping = !1;
      return;
    }
    this.localScrollY += i, this.translateY = `${-this.localScrollY}px`, this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (l = this.fakeScrollbar) == null || l.setToScrollTop(this.globalScrollY);
  }
  createSlotChangedPromise() {
    return new Promise((e) => {
      this.slotChangedResolve = e;
    });
  }
  async waitForSlotChangedEvent() {
    await this.createSlotChangedPromise();
  }
  getCurrentGlobalScrollYFromView() {
    const e = this.getComputedLocalScrollY();
    return (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + e;
  }
};
u.styles = y`
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
g([
  n({ type: Array })
], u.prototype, "items", 2);
g([
  n({ type: String, reflect: !0 })
], u.prototype, "defaultHeight", 2);
g([
  n({ type: Number, reflect: !0, attribute: "num-of-items" })
], u.prototype, "numOfItems", 2);
g([
  n({ type: String, reflect: !0, attribute: "unique-selector" })
], u.prototype, "uniqueSelector", 2);
g([
  n({
    type: Number,
    reflect: !0,
    attribute: "arrow-click-scroll-delta"
  })
], u.prototype, "arrowClickScrollTopDelta", 2);
g([
  n({ type: Boolean, reflect: !0, attribute: "needs-transition" })
], u.prototype, "needsTransition", 2);
g([
  n({ type: Object })
], u.prototype, "fakeScrollbar", 2);
g([
  n({ type: Boolean, reflect: !0, attribute: "swipe-scroll" })
], u.prototype, "swipeScroll", 2);
g([
  n({
    type: Number,
    reflect: !0,
    attribute: "swipe-delta-multiplier"
  })
], u.prototype, "swipeDeltaMultiplier", 2);
g([
  m()
], u.prototype, "globalScrollY", 2);
g([
  m()
], u.prototype, "initialized", 2);
g([
  m()
], u.prototype, "virtualScrollHeight", 2);
g([
  m()
], u.prototype, "containerHeight", 2);
g([
  m()
], u.prototype, "translateY", 2);
g([
  n({ type: Number, reflect: !0 })
], u.prototype, "startIndex", 2);
g([
  n({ type: Number, reflect: !0 })
], u.prototype, "hostClientHeight", 2);
g([
  T()
], u.prototype, "listItems", 2);
u = g([
  Y("missing-page-virtualizer")
], u);
var D = Object.defineProperty, P = Object.getOwnPropertyDescriptor, p = (e, t, i, s) => {
  for (var l = s > 1 ? void 0 : s ? P(t, i) : t, o = e.length - 1, r; o >= 0; o--)
    (r = e[o]) && (l = (s ? r(t, i, l) : r(l)) || l);
  return s && l && D(t, i, l), l;
};
let d = class extends f {
  constructor() {
    super(...arguments), this.items = [], this.defaultHeight = 200, this.numOfItems = 2, this.uniqueSelector = "", this.arrowClickScrollTopDelta = 40, this.needsTransition = !1, this.swipeDeltaMultiplier = 1, this.globalScrollY = 0, this.initialized = !1, this.virtualScrollHeight = this.clientHeight, this.containerHeight = 100, this.translateY = "", this.startIndex = 0, this.hostClientHeight = this.clientHeight, this.containerClientWidth = this.clientWidth, this.containerResizeObserver = new ResizeObserver(
      this.containerResize.bind(this)
    ), this.hostResizeObserver = new ResizeObserver(this.hostResize.bind(this)), this.hostSwipeListener = this.onHostSwipe.bind(this), this.fakeScrollbarDraggingListener = this.onFakeScrollbarDragging.bind(this), this.fakeScrollbarDragReleaseListener = this.onFakeScrollbarDragRelease.bind(this), this.fakeScrollbarDragStopListener = this.onFakeScrollbarDragStop.bind(this), this.dimensionChangedListener = this.dimensionChangedCB.bind(this), this.pauseUpdate = !1, this.scrolling = !1, this.localScrollY = 0, this.rawHeightUpdates = {}, this.scrollWaitTime = 250, this.jumpSkipping = !1, this.accumulatedDelta = 0;
  }
  render() {
    return w`
      ${this.initialized ? w`
            <div
              class="container"
              style="--translateY:${this.translateY};"
              tabindex="0"
            >
              <slot
                @slotchange="${async (e) => {
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
      const e = this.renderRoot;
      this.container = e.querySelector(".container"), this.innerSlot = e.querySelector("slot"), this.containerComputedStyle = getComputedStyle(this.container), this.containerResizeObserver.observe(this.container), this.hostResizeObserver.observe(this), this.addEventListener("swipe-detected", this.hostSwipeListener), this.dispatchEvent(
        new CustomEvent("load", {
          detail: {
            indices: [this.startIndex, this.startIndex + this.numOfItems - 1]
          }
        })
      ), this.addEventListener("scroll", () => {
        this.scrollTop = 0;
      }), this.addEventListener("wheel", (t) => {
        this.slowScrollBy(t.deltaY, !0);
      }), this.setupKeyboardInteractions();
    });
  }
  updated(e) {
    var t;
    super.updated(e), this.fakeScrollbar && (e.has("hostClientHeight") || e.has("virtualScrollHeight")) && (this.fakeScrollbar.targetClientHeight = this.hostClientHeight, this.fakeScrollbar.targetScrollHeight = this.virtualScrollHeight), e.has("swipeScroll") && (this.swipeScroll ? (this.swipePhysics = new H(), this.swipePhysics.emitFor(this)) : (t = this.swipePhysics) == null || t.destroy());
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
  scrollByAmt(e, t = !1) {
    this.slowScrollBy(e, t);
  }
  onPowerScroll(e) {
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.classList.add("by-pass"), this.jumpToScrollTop(e.computedTargetScrollTop), this.dispatchEvent(new CustomEvent("scrolling")), this.scrollTop = 0;
  }
  setScrollTopAndTransform(e, t = !0) {
    var i;
    if (this.ft) {
      const s = (i = this.ft) == null ? void 0 : i.findIndexOfPixel(e), l = s !== 0 ? this.ft.getCumulativeHeight(s - 1) : 0, o = -(e - l);
      this.translateY = `${o}px`, this.localScrollY = -o, this.startIndex = s, t && this.dispatchEvent(
        new CustomEvent("load", {
          detail: {
            indices: [this.startIndex, this.startIndex + this.numOfItems - 1]
          }
        })
      );
    }
  }
  getTranslateXY(e) {
    let t;
    "element" in e ? t = window.getComputedStyle(e.element) : t = e.styleDeclaration;
    const i = new DOMMatrixReadOnly(t.transform);
    return {
      translateX: i.m41,
      // m41 holds the translateX value
      translateY: i.m42
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
  dimensionChangedCB(e) {
    if (this.scrollTop = 0, !this.ft) return;
    let i = e.detail.target;
    const s = parseInt(i.dataset.pageIndex);
    s > this.items.length - 1 || (i.isPage ? this.onPageResize(s, i) : this.onElementResize(i));
  }
  slowScrollBy(e = 0, t = !1) {
    var c;
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrolling = !1;
    }, this.scrollWaitTime), this.updateMemoryWithNewHeights(), this.dispatchEvent(new CustomEvent("scrolling")), this.scrolling = !0, t ? this.classList.add("by-pass") : this.classList.remove("by-pass"), this.localScrollY = this.translateY !== "" ? -parseFloat(this.translateY) : 0, this.localScrollY += e;
    const i = this.startIndex === 0 ? 0 : this.ft.getCumulativeHeight(this.startIndex - 1);
    this.globalScrollY = i + this.localScrollY;
    const s = Math.min(
      Math.max(0, this.globalScrollY),
      this.virtualScrollHeight - this.clientHeight
    ), l = s - this.globalScrollY;
    this.localScrollY -= l, this.globalScrollY = s, (c = this.fakeScrollbar) == null || c.setToScrollTop(this.globalScrollY);
    const o = this.ft.findIndexOfPixel(this.globalScrollY), r = o !== 0 ? this.ft.getCumulativeHeight(o - 1) : 0, a = -(this.globalScrollY - r);
    if (this.pauseUpdate) {
      this.accumulatedDelta += e, this.container.style.setProperty(
        "--translateY",
        `${-this.localScrollY}px`
      );
      return;
    }
    o !== this.startIndex ? (this.container.style.setProperty(
      "--translateY",
      `${-this.localScrollY}px`
    ), this.pauseUpdate = !0, this.classList.add("by-pass"), this.startIndex = o, this.pendingViewTranslate = `${a}px`, this.recoveryTimeout && clearTimeout(this.recoveryTimeout), this.recoveryTimeout = setTimeout(() => {
      this.pauseUpdate && (console.warn("Recovery: Angular took > 500ms. Forcing setView."), this.setView());
    }, 500), this.dispatchEvent(
      new CustomEvent("load", {
        detail: {
          indices: [this.startIndex, this.startIndex + this.numOfItems - 1]
        }
      })
    )) : this.translateY = `${a}px`;
  }
  updateTotalVirtualHeight() {
    if (this.ft && this.fakeScrollbar) {
      const e = this.items.length - 1;
      this.virtualScrollHeight = this.ft.getCumulativeHeight(e), this.fakeScrollbar.targetScrollHeight = this.virtualScrollHeight, this.globalScrollY = Math.min(
        Math.max(0, this.globalScrollY),
        this.virtualScrollHeight - this.clientHeight
      );
    }
  }
  addNewData(e, t) {
    var r;
    if (!this.ft) return;
    this.updateMemoryWithNewHeights();
    const i = t.length, s = this.items.length, l = i - s;
    if (l <= 0) return;
    const o = new Float64Array(i);
    e === "append" ? (o.set(this.rawHeights), o.fill(this.defaultHeight, s)) : (o.fill(this.defaultHeight, 0, l), o.set(this.rawHeights, l)), this.rawHeights = o, this.items = t, this.ft.initAll(this.rawHeights), this.updateTotalVirtualHeight(), this.setScrollStateFromCurrentView(), (r = this.fakeScrollbar) == null || r.setToScrollTop(this.globalScrollY);
  }
  goToPageIndex(e) {
    if (this.ft) {
      const t = Math.min(
        Math.max(0, e),
        this.rawHeights.length - 1
      );
      e < 0 ? console.warn(
        "pageIndex provided is less than min page-index of 0. Therefore showing page of pageIndex=0"
      ) : e > this.rawHeights.length - 1 && console.warn(
        `pageIndex provided is greater than max page-index of ${this.rawHeights.length - 1}. Therefore showing page of pageIndex=${this.rawHeights.length - 1} `
      );
      const i = t === 0 ? 0 : this.ft.getCumulativeHeight(t - 1);
      this.jumpToScrollTop(i);
    }
  }
  jumpToScrollTop(e, t = !0, i = !0) {
    var l;
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.classList.add("by-pass"), this.scrollTop = 0;
    const s = Math.min(
      Math.max(0, e),
      this.virtualScrollHeight - this.clientHeight
    );
    this.classList.add("by-pass"), this.pauseUpdate = !1, this.scrolling = !0, this.globalScrollY = s, this.setScrollTopAndTransform(s, i), t && ((l = this.fakeScrollbar) == null || l.setToScrollTop(s));
  }
  getCurrentScrollTop() {
    return this.globalScrollY;
  }
  tillPainted() {
    return new Promise((e) => {
      requestAnimationFrame(() => requestAnimationFrame(e));
    });
  }
  async tillStable(e) {
    await this.tillPainted();
    const t = e.flatMap(
      (i) => i.getAnimations({ subtree: !0 })
    );
    t.length && await Promise.allSettled(t.map((i) => i.finished));
  }
  async allStable(e = []) {
    await this.tillPainted();
    const t = this.innerSlot.assignedElements({ flatten: !0 });
    await this.tillStable([
      ...e,
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
    var e;
    this.updateMemoryWithNewHeights(), this.setScrollStateFromCurrentView(), (e = this.fakeScrollbar) == null || e.setToScrollTop(this.globalScrollY), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrolling = !1;
    }, this.scrollWaitTime), this.dispatchEvent(new CustomEvent("scroll-stopped"));
  }
  setScrollStateFromCurrentView(e) {
    this.classList.add("by-pass"), this.localScrollY = e || this.getComputedLocalScrollY(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, this.globalScrollY = Math.min(
      Math.max(0, this.globalScrollY),
      this.virtualScrollHeight - this.clientHeight
    ), this.setScrollTopAndTransform(this.globalScrollY);
  }
  updateMemoryWithNewHeights() {
    const e = Object.entries(this.rawHeightUpdates);
    if (e.length !== 0 && this.ft) {
      for (const [t, i] of e) {
        const s = parseInt(t);
        this.rawHeights[s] !== i && (this.ft.update(s, i), this.rawHeights[s] = i);
      }
      this.rawHeightUpdates = {}, this.updateTotalVirtualHeight();
    }
  }
  getCurrentPageIndex() {
    var e;
    return (e = this.ft) == null ? void 0 : e.findIndexOfPixel(this.globalScrollY);
  }
  getPageIndexForScrollTop(e) {
    var t;
    return (t = this.ft) == null ? void 0 : t.findIndexOfPixel(e);
  }
  async onKeyDown(e, t) {
    switch (this.scrollTimeout && clearTimeout(this.scrollTimeout), e) {
      case "arrowup":
      case "arrowdown":
        this.repeatedScrollByPixels(t);
        break;
      case "pagedown":
      case "pageup":
        this.slowScrollBy(t, !0);
    }
  }
  onKeyUp(e) {
    this.tickFrame && cancelAnimationFrame(this.tickFrame);
    const t = e.toLowerCase();
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
  stableJumpTo(e) {
    this.tickFrame && cancelAnimationFrame(this.tickFrame), this.scrollTimeout && clearTimeout(this.scrollTimeout), this.classList.add("by-pass"), this.jumpToScrollTop(e);
  }
  onPageResize(e, t) {
    var i, s;
    if (this.ft) {
      const l = t.height;
      this.scrolling ? (this.rawHeightUpdates[e] = l, this.updateTotalVirtualHeight()) : (this.updateMemoryWithNewHeights(), (i = this.ft) == null || i.update(e, l), this.updateTotalVirtualHeight(), this.localScrollY = this.getComputedLocalScrollY(), this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (s = this.fakeScrollbar) == null || s.setToScrollTop(this.globalScrollY));
    }
  }
  onElementResize(e) {
    var i;
    if (this.scrolling || (i = this.fakeScrollbar) != null && i.dragging) return;
    const t = e.height - e.oldHeight;
    if (!this.pauseUpdate && e.getBoundingClientRect().bottom - t < 0) {
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
  async runAfterAllTransitions(e) {
    for (let t of e)
      t && await this.runAfterTransitions(t);
  }
  jumpRelease() {
    this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrolling = !1, this.updateMemoryWithNewHeights(), this.setScrollStateFromCurrentView();
    }, this.scrollWaitTime);
  }
  onHostSwipe(e) {
    var t;
    if (this.scrollTop = 0, (t = this.fakeScrollbar) != null && t.dragging) {
      e.preventDefault();
      return;
    }
    requestAnimationFrame(() => {
      const s = -e.detail.deltaY * this.swipeDeltaMultiplier;
      this.slowScrollBy(s, !0), this.dispatchEvent(new CustomEvent("scrolling"));
    });
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
  async accurateJumpTo(e) {
    var l;
    if (!this.ft || this.jumpSkipping) return;
    this.updateMemoryWithNewHeights(), this.scrolling || (this.updateContainerHeight(), this.localScrollY = this.getComputedLocalScrollY()), this.scrolling = !0;
    const t = this.getCurrentGlobalScrollYFromView(), i = e - t, s = this.localScrollY;
    if (this.scrollTimeout && clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.scrolling = !1, this.dispatchEvent(new CustomEvent("scroll-stopped"));
    }, this.scrollWaitTime), this.dispatchEvent(new CustomEvent("scrolling")), this.classList.add("by-pass"), this.localScrollY + i < 0 || this.localScrollY + i > this.containerHeight - this.clientHeight) {
      this.jumpSkipping = !0;
      const o = this.startIndex;
      this.listItems.forEach((h) => h.style.opacity = "0"), this.stableJumpTo(this.globalScrollY + i), await this.updateComplete, await this.waitForSlotChangedEvent(), await this.allStable(), await Promise.all(this.listItems.map((h) => h.isReady)), this.updateMemoryWithNewHeights();
      const a = (o !== 0 ? this.ft.getCumulativeHeight(o - 1) : 0) + s + i, c = this.ft.findIndexOfPixel(
        a
      );
      this.stableJumpTo(a), await this.updateComplete, c !== this.startIndex && await this.waitForSlotChangedEvent(), await this.allStable(), await Promise.all(this.listItems.map((h) => h.isReady)), this.listItems.forEach((h) => h.style.opacity = "1"), this.jumpSkipping = !1;
      return;
    }
    this.localScrollY += i, this.translateY = `${-this.localScrollY}px`, this.globalScrollY = (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + this.localScrollY, (l = this.fakeScrollbar) == null || l.setToScrollTop(this.globalScrollY);
  }
  createSlotChangedPromise() {
    return new Promise((e) => {
      this.slotChangedResolve = e;
    });
  }
  async waitForSlotChangedEvent() {
    await this.createSlotChangedPromise();
  }
  getCurrentGlobalScrollYFromView() {
    const e = this.getComputedLocalScrollY();
    return (this.startIndex > 0 ? this.ft.getCumulativeHeight(this.startIndex - 1) : 0) + e;
  }
  setView() {
    if (!this.pendingViewTranslate) {
      this.pauseUpdate = !1;
      return;
    }
    this.executeSetView();
  }
  executeSetView() {
    var t;
    this.container.style.opacity = "0", this.localScrollY = -parseFloat(this.pendingViewTranslate), this.accumulatedDelta && (this.localScrollY += this.accumulatedDelta, this.accumulatedDelta = 0), this.container.style.setProperty("--translateY", `${-this.localScrollY}px`), this.translateY = `${-this.localScrollY}px`, this.pendingViewTranslate = void 0;
    const e = this.startIndex === 0 ? 0 : this.ft.getCumulativeHeight(this.startIndex - 1);
    this.globalScrollY = e + this.localScrollY, (t = this.fakeScrollbar) == null || t.setToScrollTop(this.globalScrollY), this.pauseUpdate = !1, setTimeout(() => {
      requestAnimationFrame(() => {
        this.container.style.opacity = "1";
      });
    });
  }
};
d.styles = y`
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
    .ghosts {
      position: fixed;
      top: 99999px;
      visibility: hidden;
      z-index: -1;
      opacity: 0;
    }
  `;
p([
  n({ type: Array })
], d.prototype, "items", 2);
p([
  n({ type: String, reflect: !0 })
], d.prototype, "defaultHeight", 2);
p([
  n({ type: Number, reflect: !0, attribute: "num-of-items" })
], d.prototype, "numOfItems", 2);
p([
  n({ type: String, reflect: !0, attribute: "unique-selector" })
], d.prototype, "uniqueSelector", 2);
p([
  n({
    type: Number,
    reflect: !0,
    attribute: "arrow-click-scroll-delta"
  })
], d.prototype, "arrowClickScrollTopDelta", 2);
p([
  n({ type: Boolean, reflect: !0, attribute: "needs-transition" })
], d.prototype, "needsTransition", 2);
p([
  n({ type: Object })
], d.prototype, "fakeScrollbar", 2);
p([
  n({ type: Boolean, reflect: !0, attribute: "swipe-scroll" })
], d.prototype, "swipeScroll", 2);
p([
  n({
    type: Number,
    reflect: !0,
    attribute: "swipe-delta-multiplier"
  })
], d.prototype, "swipeDeltaMultiplier", 2);
p([
  m()
], d.prototype, "globalScrollY", 2);
p([
  m()
], d.prototype, "initialized", 2);
p([
  m()
], d.prototype, "virtualScrollHeight", 2);
p([
  m()
], d.prototype, "containerHeight", 2);
p([
  m()
], d.prototype, "translateY", 2);
p([
  n({ type: Number, reflect: !0 })
], d.prototype, "startIndex", 2);
p([
  n({ type: Number, reflect: !0 })
], d.prototype, "hostClientHeight", 2);
p([
  n({ type: Number, reflect: !0 })
], d.prototype, "containerClientWidth", 2);
p([
  T()
], d.prototype, "listItems", 2);
d = p([
  Y("missing-page-virtualizer-two")
], d);
export {
  u as MissingPageVirtualizer,
  d as MissingPageVirtualizerTwo
};
//# sourceMappingURL=index.js.map
