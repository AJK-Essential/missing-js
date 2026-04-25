export type MissingSwipePhysicsEvent = CustomEvent<SwipePhysicsDetail>;

export interface SwipePhysicsDetail {
  deltaX: number;
  deltaY: number;
  velocityX: number;
  velocityY: number;
  isDragging: boolean;
}

export class MissingSwipePhysicsEmitter {
  public friction: number = 0.985; // Slightly less friction for "premium" feel
  private stopViscosity: number = 0.0005;

  private velocityX: number = 0;
  private velocityY: number = 0;
  private isDragging: boolean = false;

  private lastX: number = 0;
  private lastY: number = 0;
  private lastTime: number = 0;

  private velocityBuffer: { vx: number; vy: number; t: number }[] = [];

  private animationId: number | null = null;
  private target?: HTMLElement | null;

  private pendingDeltaX: number = 0;
  private pendingDeltaY: number = 0;
  private moveRequested: boolean = false;

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
    this.pendingDeltaX = 0;
    this.pendingDeltaY = 0;
    this.velocityBuffer = [];
  }

  private dispatch(deltaX: number, deltaY: number, isDragging: boolean): void {
    if (!this.target) return;

    if (Math.abs(deltaX) < 0.001 && Math.abs(deltaY) < 0.001 && !isDragging)
      return;

    this.target.dispatchEvent(
      new CustomEvent("swipe-detected", {
        detail: {
          deltaX, // No rounding here
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
    this.lastTime = e.timeStamp;
    this.target.setPointerCapture(e.pointerId);
    this.target.addEventListener("pointermove", this.pointerMoveListener);
    this.target.addEventListener("pointerup", this.pointerUpListener);
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.isDragging) return;

    const events = (e as any).getCoalescedEvents
      ? (e as any).getCoalescedEvents()
      : [e];

    for (const coalescedEvent of events) {
      const now = coalescedEvent.timeStamp;
      const deltaX = coalescedEvent.clientX - this.lastX;
      const deltaY = coalescedEvent.clientY - this.lastY;
      const deltaTime = now - this.lastTime;

      if (deltaTime > 0) {
        this.velocityBuffer.push({
          vx: deltaX / deltaTime,
          vy: deltaY / deltaTime,
          t: now,
        });
        // Tight window for high-speed responsiveness
        const cutoff = now - 40;
        while (
          this.velocityBuffer.length > 0 &&
          this.velocityBuffer[0].t < cutoff
        ) {
          this.velocityBuffer.shift();
        }
      }

      this.pendingDeltaX += deltaX;
      this.pendingDeltaY += deltaY;
      this.lastX = coalescedEvent.clientX;
      this.lastY = coalescedEvent.clientY;
      this.lastTime = now;
    }

    if (!this.moveRequested) {
      this.moveRequested = true;
      requestAnimationFrame(() => {
        if (this.isDragging) {
          this.dispatch(this.pendingDeltaX, this.pendingDeltaY, true);
        }
        this.pendingDeltaX = 0;
        this.pendingDeltaY = 0;
        this.moveRequested = false;
      });
    }
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
    if (now - this.lastTime > 80 || this.velocityBuffer.length === 0) {
      this.stopMovement();
      return;
    }

    // Weighted average favoring the very end
    let weightSum = 0;
    let vX = 0,
      vY = 0;
    this.velocityBuffer.forEach((p, i) => {
      const w = Math.pow((i + 1) / this.velocityBuffer.length, 2);
      vX += p.vx * w;
      vY += p.vy * w;
      weightSum += w;
    });

    this.velocityX = vX / weightSum;
    this.velocityY = vY / weightSum;
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.physicsLoop);
  }

  private physicsLoop = (): void => {
    if (this.isDragging) return;

    const now = performance.now();
    const dt = Math.min(now - this.lastTime, 32);
    this.lastTime = now;

    const speed = Math.abs(this.velocityY);

    // Dynamic friction: Less friction at high speeds, more at low speeds
    const currentFriction = speed > 1.5 ? this.friction : this.friction - 0.02;
    const frictionPower = dt / 16.66;

    this.velocityX *= Math.pow(currentFriction, frictionPower);
    this.velocityY *= Math.pow(currentFriction, frictionPower);

    // Constant drag (viscosity)
    const drag = this.stopViscosity * dt;
    if (Math.abs(this.velocityX) > drag) {
      this.velocityX -= Math.sign(this.velocityX) * drag;
    } else {
      this.velocityX = 0;
    }

    if (Math.abs(this.velocityY) > drag) {
      this.velocityY -= Math.sign(this.velocityY) * drag;
    } else {
      this.velocityY = 0;
    }

    const dx = this.velocityX * dt;
    const dy = this.velocityY * dt;

    this.dispatch(dx, dy, false);

    // Stop if speed is negligible
    if (Math.abs(this.velocityX) > 0.005 || Math.abs(this.velocityY) > 0.005) {
      this.animationId = requestAnimationFrame(this.physicsLoop);
    } else {
      this.stopMovement();
    }
  };

  public destroy(): void {
    this.stopMovement();
    if (this.target) {
      this.target.removeEventListener("pointerdown", this.pointerDownListener);
      this.target.removeEventListener("pointermove", this.pointerMoveListener);
      this.target.removeEventListener("pointerup", this.pointerUpListener);
    }
  }
}
