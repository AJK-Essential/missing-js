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
    this.friction = 0.92, this.launchMultiplier = 1.2, this.snapThreshold = 0.15, this.velocityX = 0, this.velocityY = 0, this.isDragging = !1, this.lastX = 0, this.lastY = 0, this.lastTime = 0, this.velocityBuffer = [], this.animationId = null, this.pointerMoveListener = this.onPointerMove.bind(this), this.pointerDownListener = this.onPointerDown.bind(this), this.pointerUpListener = this.onPointerUp.bind(this), this.physicsLoop = () => {
      if (this.isDragging) return;
      const t = performance.now(), e = Math.min(t - this.lastTime, 20);
      this.lastTime = t;
      const i = Math.pow(this.friction, e / 16.66);
      this.velocityX *= i, this.velocityY *= i;
      const s = this.velocityX * e, n = this.velocityY * e;
      if (Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2) < this.snapThreshold) {
        this.stopMovement(), this.dispatch(0, 0, !1);
        return;
      }
      this.dispatch(s, n, !1), this.animationId = requestAnimationFrame(this.physicsLoop);
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
    const s = t.clientX - this.lastX, n = t.clientY - this.lastY;
    this.velocityBuffer.push({ vx: s / i, vy: n / i, t: e }), this.velocityBuffer.length > 6 && this.velocityBuffer.shift(), this.lastX = t.clientX, this.lastY = t.clientY, this.lastTime = e, this.dispatch(s, n, !0);
  }
  onPointerUp(t) {
    if (!this.isDragging) return;
    if (this.isDragging = !1, this.target && (this.target.releasePointerCapture(t.pointerId), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener)), performance.now() - this.lastTime > 50 || this.velocityBuffer.length === 0) {
      this.stopMovement();
      return;
    }
    let i = 0, s = 0, n = 0;
    this.velocityBuffer.forEach((o, h) => {
      const r = Math.pow(h + 1, 2);
      s += o.vx * r, n += o.vy * r, i += r;
    }), this.velocityX = s / i * this.launchMultiplier, this.velocityY = n / i * this.launchMultiplier, this.lastTime = performance.now(), this.animationId = requestAnimationFrame(this.physicsLoop);
  }
  destroy() {
    this.stopMovement(), this.target && this.target.removeEventListener("pointerdown", this.pointerDownListener);
  }
}
export {
  l as MissingSwipePhysicsEmitter
};
//# sourceMappingURL=index.js.map
