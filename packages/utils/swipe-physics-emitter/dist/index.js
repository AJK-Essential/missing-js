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
class o {
  constructor() {
    this.friction = 0.88, this.velocityX = 0, this.velocityY = 0, this.isDragging = !1, this.lastX = 0, this.lastY = 0, this.lastTime = 0, this.startX = 0, this.startY = 0, this.startTime = 0, this.animationId = null, this.pointerMoveListener = this.onPointerMove.bind(this), this.pointerDownListener = this.onPointerDown.bind(this), this.pointerUpListener = this.onPointerUp.bind(this), this.physicsLoop = () => {
      if (this.isDragging) return;
      this.velocityX *= this.friction, this.velocityY *= this.friction;
      const t = this.velocityX * 16, i = this.velocityY * 16;
      this.dispatch(t, i, !1), (Math.abs(this.velocityX) > 0.05 || Math.abs(this.velocityY) > 0.05) && (this.animationId = requestAnimationFrame(this.physicsLoop));
    };
  }
  emitFor(t) {
    this.target = t, this.target.style.touchAction = "none", this.target.addEventListener("pointerdown", this.pointerDownListener);
  }
  stopMovement() {
    this.animationId && (cancelAnimationFrame(this.animationId), this.animationId = null), this.velocityX = 0, this.velocityY = 0;
  }
  dispatch(t, i, s) {
    if (!this.target) return;
    const n = {
      deltaX: t,
      deltaY: i,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      isDragging: s
    }, e = new CustomEvent(
      "swipe-detected",
      {
        detail: n,
        bubbles: !0,
        composed: !0
      }
    );
    this.target.dispatchEvent(e);
  }
  onPointerDown(t) {
    this.target && t.pointerType !== "mouse" && (this.stopMovement(), this.isDragging = !0, this.startX = t.clientX, this.startY = t.clientY, this.startTime = performance.now(), this.lastX = this.startX, this.lastY = this.startY, this.lastTime = this.startTime, this.target.setPointerCapture(t.pointerId), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.target.addEventListener("pointermove", this.pointerMoveListener), this.target.addEventListener("pointerup", this.pointerUpListener));
  }
  onPointerMove(t) {
    if (!this.isDragging) return;
    const i = performance.now(), s = t.clientX - this.lastX, n = t.clientY - this.lastY, e = i - this.lastTime;
    e > 0 && (this.velocityX = s / e, this.velocityY = n / e), this.dispatch(s, n, !0), this.lastX = t.clientX, this.lastY = t.clientY, this.lastTime = i;
  }
  onPointerUp(t) {
    this.isDragging && this.target && (this.target.releasePointerCapture(t.pointerId), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.isDragging = !1, Math.abs(t.clientX - this.startX), Math.abs(t.clientY - this.startY), performance.now() - this.startTime, this.animationId = requestAnimationFrame(this.physicsLoop));
  }
  destroy() {
    this.target && (this.target.removeEventListener("pointerdown", this.pointerDownListener), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.target = null), this.stopMovement();
  }
}
export {
  o as MissingSwipePhysicsEmitter
};
//# sourceMappingURL=index.js.map
