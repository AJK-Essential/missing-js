/**
 * Missing JS - @missing-js/swipe-physics-emitter
 * @license MIT
 * Copyright (c) 2026 Missing JS / AJK-Essential.
 * ---------------------------------------------------------
 * Licensed under the MIT License.
 * Free for personal and commercial use.
 */
class p {
  constructor() {
    this.friction = 0.95, this.velocityX = 0, this.velocityY = 0, this.isDragging = !1, this.lastX = 0, this.lastY = 0, this.lastTime = 0, this.startX = 0, this.startY = 0, this.startTime = 0, this.animationId = null, this.pendingDeltaX = 0, this.pendingDeltaY = 0, this.moveRequested = !1, this.pointerMoveListener = this.onPointerMove.bind(this), this.pointerDownListener = this.onPointerDown.bind(this), this.pointerUpListener = this.onPointerUp.bind(this), this.physicsLoop = () => {
      if (this.isDragging) return;
      const t = performance.now(), e = t - this.lastTime;
      this.lastTime = t;
      const i = Math.min(e, 64), s = i / 16.66;
      this.velocityX *= Math.pow(this.friction, s), this.velocityY *= Math.pow(this.friction, s);
      const n = this.velocityX * i, o = this.velocityY * i;
      this.dispatch(n, o, !1), Math.abs(this.velocityX) > 0.01 || Math.abs(this.velocityY) > 0.01 ? this.animationId = requestAnimationFrame(this.physicsLoop) : this.stopMovement();
    };
  }
  emitFor(t) {
    this.target = t, this.target.style.touchAction = "none", this.target.style.userSelect = "none", this.target.addEventListener("pointerdown", this.pointerDownListener);
  }
  stopMovement() {
    this.animationId && (cancelAnimationFrame(this.animationId), this.animationId = null), this.velocityX = 0, this.velocityY = 0, this.pendingDeltaX = 0, this.pendingDeltaY = 0;
  }
  dispatch(t, e, i) {
    if (!this.target) return;
    const s = {
      deltaX: t,
      deltaY: e,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      isDragging: i
    };
    this.target.dispatchEvent(
      new CustomEvent("swipe-detected", {
        detail: s,
        bubbles: !0,
        composed: !0
      })
    );
  }
  onPointerDown(t) {
    this.target && t.pointerType !== "mouse" && (this.stopMovement(), this.isDragging = !0, this.startX = t.clientX, this.startY = t.clientY, this.startTime = t.timeStamp, this.lastX = this.startX, this.lastY = this.startY, this.lastTime = this.startTime, this.target.setPointerCapture(t.pointerId), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.target.addEventListener("pointermove", this.pointerMoveListener), this.target.addEventListener("pointerup", this.pointerUpListener));
  }
  onPointerMove(t) {
    if (!this.isDragging) return;
    const e = t.getCoalescedEvents ? t.getCoalescedEvents() : [t];
    for (const i of e) {
      const s = i.timeStamp, n = i.clientX - this.lastX, o = i.clientY - this.lastY, r = s - this.lastTime;
      if (r > 1) {
        const h = n / r, a = o / r;
        this.velocityX = this.velocityX * 0.7 + h * 0.3, this.velocityY = this.velocityY * 0.7 + a * 0.3;
      }
      this.pendingDeltaX += n, this.pendingDeltaY += o, this.lastX = i.clientX, this.lastY = i.clientY, this.lastTime = s;
    }
    this.moveRequested || (this.moveRequested = !0, requestAnimationFrame(() => {
      this.isDragging && this.dispatch(this.pendingDeltaX, this.pendingDeltaY, !0), this.pendingDeltaX = 0, this.pendingDeltaY = 0, this.moveRequested = !1;
    }));
  }
  onPointerUp(t) {
    if (!this.isDragging) return;
    this.isDragging = !1, this.target && (this.target.releasePointerCapture(t.pointerId), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener));
    const e = performance.now(), i = e - this.startTime;
    if (e - this.lastTime > 60) {
      this.stopMovement();
      return;
    }
    if (Math.hypot(
      t.clientX - this.startX,
      t.clientY - this.startY
    ) < 10 && i < 200) {
      this.stopMovement();
      return;
    }
    this.lastTime = performance.now(), this.animationId = requestAnimationFrame(this.physicsLoop);
  }
  destroy() {
    this.target && (this.target.removeEventListener("pointerdown", this.pointerDownListener), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.target = null), this.stopMovement();
  }
}
export {
  p as MissingSwipePhysicsEmitter
};
//# sourceMappingURL=index.js.map
