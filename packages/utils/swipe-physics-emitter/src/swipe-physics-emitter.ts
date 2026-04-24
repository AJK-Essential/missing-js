export type MissingSwipePhysicsEvent = CustomEvent<SwipePhysicsDetail>;

export interface SwipePhysicsDetail {
  deltaX: number;
  deltaY: number;
  velocityX: number;
  velocityY: number;
  isDragging: boolean;
}

/**
 * High-Performance Swipe Emitter with Coalesced Event Handling
 * Optimized for 120Hz mobile screens and Lit/Angular integration.
 */
export class MissingSwipePhysicsEmitter {
  public friction: number = 0.95;

  private velocityX: number = 0;
  private velocityY: number = 0;
  private isDragging: boolean = false;

  private lastX: number = 0;
  private lastY: number = 0;
  private lastTime: number = 0;

  private startX: number = 0;
  private startY: number = 0;
  private startTime: number = 0;

  private animationId: number | null = null;
  private target?: HTMLElement | null;

  // Throttling State to prevent "shiver"
  private pendingDeltaX: number = 0;
  private pendingDeltaY: number = 0;
  private moveRequested: boolean = false;

  private pointerMoveListener = this.onPointerMove.bind(this);
  private pointerDownListener = this.onPointerDown.bind(this);
  private pointerUpListener = this.onPointerUp.bind(this);

  public emitFor(target: HTMLElement): void {
    this.target = target;
    // 'pan-y' or 'none' depending on your vertical scroll needs.
    // 'none' is safest for full custom control.
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
  }

  private dispatch(deltaX: number, deltaY: number, isDragging: boolean): void {
    if (!this.target) return;

    // Passing raw floats allows the GPU to render sub-pixels smoothly
    const detail: SwipePhysicsDetail = {
      deltaX,
      deltaY,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      isDragging,
    };

    this.target.dispatchEvent(
      new CustomEvent("swipe-detected", {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private onPointerDown(e: PointerEvent) {
    if (!this.target) return;
    if (e.pointerType === "mouse") return;
    this.stopMovement();
    this.isDragging = true;

    this.startX = e.clientX;
    this.startY = e.clientY;

    // Sync starting time with the hardware event timestamp
    this.startTime = e.timeStamp;

    this.lastX = this.startX;
    this.lastY = this.startY;
    this.lastTime = this.startTime;

    this.target.setPointerCapture(e.pointerId);
    this.target.removeEventListener("pointermove", this.pointerMoveListener);
    this.target.removeEventListener("pointerup", this.pointerUpListener);
    this.target.addEventListener("pointermove", this.pointerMoveListener);
    this.target.addEventListener("pointerup", this.pointerUpListener);
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.isDragging) return;

    // 1. Process all high-res touch points
    const events = (e as any).getCoalescedEvents
      ? (e as any).getCoalescedEvents()
      : [e];

    for (const coalescedEvent of events) {
      // Use the exact time the hardware registered the touch point
      const now = coalescedEvent.timeStamp;

      const deltaX = coalescedEvent.clientX - this.lastX;
      const deltaY = coalescedEvent.clientY - this.lastY;
      const deltaTime = now - this.lastTime;

      // Ensure deltaTime is > 1 to avoid division by zero anomalies
      if (deltaTime > 1) {
        const instantaneousVX = deltaX / deltaTime;
        const instantaneousVY = deltaY / deltaTime;

        // WEIGHTED SMOOTHING: Prevents a single jittery frame at the end
        // from killing the momentum (the 'Android Stickiness' fix).
        this.velocityX = this.velocityX * 0.7 + instantaneousVX * 0.3;
        this.velocityY = this.velocityY * 0.7 + instantaneousVY * 0.3;
      }

      this.pendingDeltaX += deltaX;
      this.pendingDeltaY += deltaY;

      this.lastX = coalescedEvent.clientX;
      this.lastY = coalescedEvent.clientY;
      this.lastTime = now;
    }

    // 2. Schedule the visual update ONLY on the next paint
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
    const elapsedSinceStart = now - this.startTime; // We compare against performance.now() here which is fine for rough ms checks
    const timeSinceLastMove = now - this.lastTime;

    // Stale check: user held finger still for > 60ms before lifting,
    // they didn't want to 'fling', they wanted to 'stop'.
    if (timeSinceLastMove > 60) {
      this.stopMovement();
      return;
    }

    // Tap check
    const moveDist = Math.hypot(
      e.clientX - this.startX,
      e.clientY - this.startY,
    );
    if (moveDist < 10 && elapsedSinceStart < 200) {
      this.stopMovement();
      return;
    }

    // Reset lastTime to current performance.now() to seamlessly hand off
    // to the requestAnimationFrame physics loop timeline
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.physicsLoop);
  }

  private physicsLoop = (): void => {
    if (this.isDragging) return;

    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    // PROTECTION: Avoid large time jumps (e.g., if the tab was backgrounded)
    const cappedDt = Math.min(dt, 64);

    // TIME-NORMALIZED FRICTION: Ensures consistent feel on 60Hz and 120Hz screens.
    // We use power scaling so friction is independent of frame rate.
    const frictionPower = cappedDt / 16.66;
    this.velocityX *= Math.pow(this.friction, frictionPower);
    this.velocityY *= Math.pow(this.friction, frictionPower);

    // Calculate delta based on real time passed
    const deltaX = this.velocityX * cappedDt;
    const deltaY = this.velocityY * cappedDt;

    this.dispatch(deltaX, deltaY, false);

    // Stop threshold: check both axes
    if (Math.abs(this.velocityX) > 0.01 || Math.abs(this.velocityY) > 0.01) {
      this.animationId = requestAnimationFrame(this.physicsLoop);
    } else {
      this.stopMovement();
    }
  };

  public destroy(): void {
    if (this.target) {
      this.target.removeEventListener("pointerdown", this.pointerDownListener);
      this.target.removeEventListener("pointermove", this.pointerMoveListener);
      this.target.removeEventListener("pointerup", this.pointerUpListener);
      this.target = null;
    }
    this.stopMovement();
  }
}
