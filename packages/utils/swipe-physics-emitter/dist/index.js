/**
 * Missing JS - @missing-js/swipe-physics-emitter
 * @license MIT
 * Copyright (c) 2026 Missing JS / AJK-Essential.
 * ---------------------------------------------------------
 * Licensed under the MIT License.
 * Free for personal and commercial use.
 */
class a {
  constructor() {
    this.friction = 0.95, this.velocityX = 0, this.velocityY = 0, this.isDragging = !1, this.lastX = 0, this.lastY = 0, this.lastTime = 0, this.startX = 0, this.startY = 0, this.startTime = 0, this.animationId = null, this.pointerMoveListener = this.onPointerMove.bind(this), this.pointerDownListener = this.onPointerDown.bind(this), this.pointerUpListener = this.onPointerUp.bind(this), this.physicsLoop = () => {
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
    this.target = t, this.target.style.touchAction = "none", this.target.addEventListener("pointerdown", this.pointerDownListener);
  }
  stopMovement() {
    this.animationId && (cancelAnimationFrame(this.animationId), this.animationId = null), this.velocityX = 0, this.velocityY = 0;
  }
  dispatch(t, e, i) {
    if (!this.target) return;
    const s = {
      deltaX: t,
      deltaY: e,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      isDragging: i
    }, n = new CustomEvent("swipe-detected", {
      detail: s,
      bubbles: !0,
      composed: !0
    });
    this.target.dispatchEvent(n);
  }
  onPointerDown(t) {
    this.target && t.pointerType !== "mouse" && (this.stopMovement(), this.isDragging = !0, this.startX = t.clientX, this.startY = t.clientY, this.startTime = performance.now(), this.lastX = this.startX, this.lastY = this.startY, this.lastTime = this.startTime, this.target.setPointerCapture(t.pointerId), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.target.addEventListener("pointermove", this.pointerMoveListener), this.target.addEventListener("pointerup", this.pointerUpListener));
  }
  onPointerMove(t) {
    if (!this.isDragging) return;
    const e = performance.now(), i = t.clientX - this.lastX, s = t.clientY - this.lastY, n = e - this.lastTime;
    if (n > 0) {
      const o = i / n, r = s / n;
      this.velocityX = this.velocityX * 0.6 + o * 0.4, this.velocityY = this.velocityY * 0.6 + r * 0.4;
    }
    this.dispatch(i, s, !0), this.lastX = t.clientX, this.lastY = t.clientY, this.lastTime = e;
  }
  onPointerUp(t) {
    if (!this.isDragging || !this.target) return;
    this.target.releasePointerCapture(t.pointerId), this.target.removeEventListener("pointermove", this.pointerMoveListener), this.target.removeEventListener("pointerup", this.pointerUpListener), this.isDragging = !1;
    const e = performance.now(), i = Math.abs(t.clientX - this.startX), s = Math.abs(t.clientY - this.startY), n = e - this.startTime;
    if (e - this.lastTime > 50) {
      this.stopMovement();
      return;
    }
    if (i < 10 && s < 10 && n < 200) {
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
  a as MissingSwipePhysicsEmitter
};
//# sourceMappingURL=index.js.map
