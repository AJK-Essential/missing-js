export type MissingSwipePhysicsEvent = CustomEvent<SwipePhysicsDetail>;

export interface SwipePhysicsDetail {
  deltaX: number;
  deltaY: number;
  velocityX: number;
  velocityY: number;
  isDragging: boolean;
}

export class MissingSwipePhysicsEmitter {
  // --- TUNING PARAMETERS ---
  private friction: number = 0.92; // The base glide feel
  private launchMultiplier: number = 1.2; // Extra kick on release
  private snapThreshold: number = 0.15; // Velocity below this = immediate stop

  private velocityX: number = 0;
  private velocityY: number = 0;
  private isDragging: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;
  private lastTime: number = 0;

  private velocityBuffer: { vx: number; vy: number; t: number }[] = [];
  private animationId: number | null = null;
  private target?: HTMLElement | null;

  private pointerMoveListener = this.onPointerMove.bind(this);
  private pointerDownListener = this.onPointerDown.bind(this);
  private pointerUpListener = this.onPointerUp.bind(this);

  public emitFor(target: HTMLElement): void {
    this.target = target;
    this.target.style.touchAction = "none";
    this.target.style.userSelect = "none";
    this.target.addEventListener("pointerdown", this.pointerDownListener);
  }

  private stopMovement(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.velocityX = 0;
    this.velocityY = 0;
    this.velocityBuffer = [];
  }

  private dispatch(deltaX: number, deltaY: number, isDragging: boolean): void {
    if (!this.target) return;

    // Kill microscopic deltas that cause the "shiver"
    if (!isDragging && Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) return;

    this.target.dispatchEvent(
      new CustomEvent("swipe-detected", {
        detail: {
          deltaX,
          deltaY,
          velocityX: this.velocityX,
          velocityY: this.velocityY,
          isDragging,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private onPointerDown(e: PointerEvent) {
    if (!this.target || e.pointerType === "mouse") return;
    this.stopMovement();
    this.isDragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.lastTime = performance.now();
    this.target.setPointerCapture(e.pointerId);
    this.target.addEventListener("pointermove", this.pointerMoveListener);
    this.target.addEventListener("pointerup", this.pointerUpListener);
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.isDragging) return;

    const now = performance.now();
    const dt = now - this.lastTime;

    // Ignore events that fire too fast (less than 4ms) to avoid noise
    if (dt < 4) return;

    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;

    this.velocityBuffer.push({ vx: dx / dt, vy: dy / dt, t: now });

    // Maintain a small, clean window of recent velocity
    if (this.velocityBuffer.length > 6) this.velocityBuffer.shift();

    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.lastTime = now;

    this.dispatch(dx, dy, true);
  }

  private onPointerUp(e: PointerEvent) {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (this.target) {
      this.target.releasePointerCapture(e.pointerId);
      this.target.removeEventListener("pointermove", this.pointerMoveListener);
      this.target.removeEventListener("pointerup", this.pointerUpListener);
    }

    const now = performance.now();
    // If the user "held" at the end of the swipe for > 50ms, don't glide
    if (now - this.lastTime > 50 || this.velocityBuffer.length === 0) {
      this.stopMovement();
      return;
    }

    // Weighted average: Giving significantly more weight to the final 2 frames
    let totalWeight = 0;
    let vX = 0,
      vY = 0;

    this.velocityBuffer.forEach((p, i) => {
      const weight = Math.pow(i + 1, 2);
      vX += p.vx * weight;
      vY += p.vy * weight;
      totalWeight += weight;
    });

    // Apply the "kick" on release and normalize
    this.velocityX = (vX / totalWeight) * this.launchMultiplier;
    this.velocityY = (vY / totalWeight) * this.launchMultiplier;

    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.physicsLoop);
  }

  private physicsLoop = (): void => {
    if (this.isDragging) return;

    const now = performance.now();
    const dt = Math.min(now - this.lastTime, 20); // Cap dt to prevent huge jumps on frame drops
    this.lastTime = now;

    const frictionCoeff = Math.pow(this.friction, dt / 16.66);
    this.velocityX *= frictionCoeff;
    this.velocityY *= frictionCoeff;

    // The Delta
    const dx = this.velocityX * dt;
    const dy = this.velocityY * dt;

    // Jitter Prevention: If speed is below snapThreshold, force 0.
    // This stops the list from "crawling" and shivering at sub-pixel levels.
    const speed = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);

    if (speed < this.snapThreshold) {
      this.stopMovement();
      // One final dispatch to settle at the clean position
      this.dispatch(0, 0, false);
      return;
    }

    this.dispatch(dx, dy, false);
    this.animationId = requestAnimationFrame(this.physicsLoop);
  };

  public destroy(): void {
    this.stopMovement();
    if (this.target) {
      this.target.removeEventListener("pointerdown", this.pointerDownListener);
    }
  }
}
