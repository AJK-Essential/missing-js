/**
 * Missing JS - @missing-js/swipe-physics-emitter
 * @license MIT
 * Copyright (c) 2026 Missing JS / AJK-Essential.
 * ---------------------------------------------------------
 * Licensed under the MIT License.
 * Free for personal and commercial use.
 */
class l {
  constructor() {
    this.friction = 0.985, this.stopViscosity = 5e-4, this.velocityX = 0, this.velocityY = 0, this.isDragging = !1, this.lastX = 0, this.lastY = 0, this.lastTime = 0, this.velocityBuffer = [], this.animationId = null, this.pendingDeltaX = 0, this.pendingDeltaY = 0, this.moveRequested = !1, this.pointerMoveListener = this.onPointerMove.bind(this), this.pointerDownListener = this.onPointerDown.bind(this), this.pointerUpListener = this.onPointerUp.bind(this), this.physicsLoop = () => {
      if (this.isDragging) return;
      const t = performance.now(), e = Math.min(t - this.lastTime, 32);
      this.lastTime = t;
      const s = Math.abs(this.velocityY) > 1.5 ? this.friction : this.friction - 0.02, o = e / 16.66;
      this.velocityX *= Math.pow(s, o), this.velocityY *= Math.pow(s, o);
      const n = this.stopViscosity * e;
      Math.abs(this.velocityX) > n ? this.velocityX -= Math.sign(this.velocityX) * n : this.velocityX = 0, Math.abs(this.velocityY) > n ? this.velocityY -= Math.sign(this.velocityY) * n : this.velocityY = 0;
      const h = this.velocityX * e, r = this.velocityY * e;
      this.dispatch(h, r, !1), Math.abs(this.velocityX) > 5e-3 || Math.abs(this.velocityY) > 5e-3 ? this.animationId = requestAnimationFrame(this.physicsLoop) : this.stopMovement();
    };
  }
  emitFor(t) {
    this.target = t, this.target.style.touchAction = "none", this.target.style.userSelect = "none", this.target.addEventListener("pointerdown", this.pointerDownListener);
  }
  stopMovement() {
    this.animationId && (cancelAnimationFrame(this.animationId), this.animationId = null), this.velocityX = 0, this.velocityY = 0, this.pendingDeltaX = 0, this.pendingDeltaY = 0, this.velocityBuffer = [];
  }
  dispatch(t, e, i) {
    this.target && (Math.abs(t) < 1e-3 && Math.abs(e) < 1e-3 && !i || this.target.dispatchEvent(
      new CustomEvent("swipe-detected", {
        detail: {
          deltaX: t,
          // No rounding here
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
    !this.target || t.pointerType === "mouse" || (this.stopMovement(), this.isDragging = !0, this.lastX = t.clientX, this.lastY = t.clientY, this.lastTime = t.timeStamp, this.target.setPointerCapture(t.pointerId), this.target.addEventListener("pointermove", this.pointerMoveListener), this.target.addEventListener("pointerup", this.pointerUpListener));
  }
  onPointerMove(t) {
    if (!this.isDragging) return;
    const e = t.getCoalescedEvents ? t.getCoalescedEvents() : [t];
    for (const i of e) {
      const s = i.timeStamp, o = i.clientX - this.lastX, n = i.clientY - this.lastY, h = s - this.lastTime;
      if (h > 0) {
        this.velocityBuffer.push({
          vx: o / h,
          vy: n / h,
          t: s
        });
        const r = s - 40;
        for (; this.velocityBuffer.length > 0 && this.velocityBuffer[0].t < r; )
          this.velocityBuffer.shift();
      }
      this.pendingDeltaX += o, this.pendingDeltaY += n, this.lastX = i.clientX, this.lastY = i.clientY, this.lastTime = s;
    }
    this.moveRequested || (this.moveRequested = !0, requestAnimationFrame(() => {
      this.isDragging && this.dispatch(this.pendingDeltaX, this.pendingDeltaY, !0), this.pendingDeltaX = 0, this.pendingDeltaY = 0, this.moveRequested = !1;
    }));
  }
  onPointerUp(t) {
    if (!this.isDragging) return;
    if (this.isDragging = !1, this.target && (this.target.releasePointerCapture(t.pointerId), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener)), performance.now() - this.lastTime > 80 || this.velocityBuffer.length === 0) {
      this.stopMovement();
      return;
    }
    let i = 0, s = 0, o = 0;
    this.velocityBuffer.forEach((n, h) => {
      const r = Math.pow((h + 1) / this.velocityBuffer.length, 2);
      s += n.vx * r, o += n.vy * r, i += r;
    }), this.velocityX = s / i, this.velocityY = o / i, this.lastTime = performance.now(), this.animationId = requestAnimationFrame(this.physicsLoop);
  }
  destroy() {
    this.stopMovement(), this.target && (this.target.removeEventListener("pointerdown", this.pointerDownListener), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener));
  }
}
export {
  l as MissingSwipePhysicsEmitter
};
//# sourceMappingURL=index.js.map
