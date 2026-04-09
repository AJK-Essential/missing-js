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
    this.friction = 0.95, this.velocityX = 0, this.velocityY = 0, this.isDragging = !1, this.lastX = 0, this.lastY = 0, this.lastTime = 0, this.startX = 0, this.startY = 0, this.startTime = 0, this.animationId = null, this.pointerMoveListener = this.onPointerMove.bind(this), this.pointerDownListener = this.onPointerDown.bind(this), this.pointerUpListener = this.onPointerUp.bind(this), this.physicsLoop = () => {
      if (this.isDragging) return;
      this.velocityX *= this.friction, this.velocityY *= this.friction;
      const t = this.velocityX * 16, i = this.velocityY * 16;
      if (this.dispatch(t, i, !1), Math.abs(this.velocityX) > 0.05 || Math.abs(this.velocityY) > 0.05)
        this.animationId = requestAnimationFrame(this.physicsLoop);
      else {
        if (this.stopMovement(), !this.target) return;
        this.target.dispatchEvent(
          new CustomEvent("swipe-stopped", { bubbles: !0, composed: !0 })
        );
      }
    };
  }
  emitFor(t) {
    this.target = t, this.target.style.touchAction = "none", this.target.addEventListener("pointerdown", this.pointerDownListener);
  }
  stopMovement() {
    this.animationId && (cancelAnimationFrame(this.animationId), this.animationId = null), this.velocityX = 0, this.velocityY = 0;
  }
  dispatch(t, i, e) {
    if (!this.target) return;
    const s = {
      deltaX: t,
      deltaY: i,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      isDragging: e
    }, n = new CustomEvent(
      "swipe-detected",
      {
        detail: s,
        bubbles: !0,
        composed: !0
      }
    );
    this.target.dispatchEvent(n);
  }
  onPointerDown(t) {
    this.target && t.pointerType !== "mouse" && (this.stopMovement(), this.isDragging = !0, this.startX = t.clientX, this.startY = t.clientY, this.startTime = performance.now(), this.lastX = this.startX, this.lastY = this.startY, this.lastTime = this.startTime, this.target.setPointerCapture(t.pointerId), this.target.dispatchEvent(
      new CustomEvent("swipe-started", { bubbles: !0, composed: !0 })
    ), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.target.addEventListener("pointermove", this.pointerMoveListener), this.target.addEventListener("pointerup", this.pointerUpListener));
  }
  onPointerMove(t) {
    if (!this.isDragging) return;
    const i = performance.now(), e = t.clientX - this.lastX, s = t.clientY - this.lastY, n = i - this.lastTime;
    n > 0 && (this.velocityX = e / n, this.velocityY = s / n), this.dispatch(e, s, !0), this.lastX = t.clientX, this.lastY = t.clientY, this.lastTime = i;
  }
  onPointerUp(t) {
    if (!this.isDragging || !this.target) return;
    this.target.releasePointerCapture(t.pointerId), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.isDragging = !1;
    const i = Math.abs(t.clientX - this.startX), e = Math.abs(t.clientY - this.startY), s = performance.now() - this.startTime;
    if (i < 10 && e < 10 && s < 200) {
      this.stopMovement(), this.target.dispatchEvent(
        new CustomEvent("swipe-stopped", { bubbles: !0, composed: !0 })
      );
      return;
    }
    this.animationId = requestAnimationFrame(this.physicsLoop);
  }
  destroy() {
    this.target && (this.target.removeEventListener("pointerdown", this.pointerDownListener), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.target = null), this.stopMovement();
  }
}
export {
  o as MissingSwipePhysicsEmitter
};
//# sourceMappingURL=index.js.map
