export type MissingSwipePhysicsEvent = CustomEvent<SwipePhysicsDetail>;

export interface SwipePhysicsDetail {
  deltaX: number;
  deltaY: number;
  velocityX: number;
  velocityY: number;
  isDragging: boolean;
}

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

  private pointerMoveListener = this.onPointerMove.bind(this);
  private pointerDownListener = this.onPointerDown.bind(this);
  private pointerUpListener = this.onPointerUp.bind(this);

  public emitFor(target: HTMLElement): void {
    this.target = target;
    // 'pan-y' or 'none' depending on your vertical scroll needs.
    // 'none' is safest for full custom control.
    this.target.style.touchAction = "none";
    this.target.addEventListener("pointerdown", this.pointerDownListener);
  }

  private stopMovement(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.velocityX = 0;
    this.velocityY = 0;
  }

  private dispatch(deltaX: number, deltaY: number, isDragging: boolean): void {
    if (!this.target) return;
    const detail: SwipePhysicsDetail = {
      deltaX,
      deltaY,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      isDragging,
    };
    const event: MissingSwipePhysicsEvent = new CustomEvent("swipe-detected", {
      detail,
      bubbles: true,
      composed: true,
    });
    this.target.dispatchEvent(event);
  }

  private onPointerDown(e: PointerEvent) {
    if (!this.target) return;
    if (e.pointerType === "mouse") return;
    this.stopMovement();
    this.isDragging = true;

    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startTime = performance.now();

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

    const now = performance.now();
    const deltaX = e.clientX - this.lastX;
    const deltaY = e.clientY - this.lastY;
    const deltaTime = now - this.lastTime;

    if (deltaTime > 0) {
      const instantaneousVX = deltaX / deltaTime;
      const instantaneousVY = deltaY / deltaTime;

      // WEIGHTED SMOOTHING: Prevents a single jittery frame at the end
      // from killing the momentum (the 'Android Stickiness' fix).
      this.velocityX = this.velocityX * 0.6 + instantaneousVX * 0.4;
      this.velocityY = this.velocityY * 0.6 + instantaneousVY * 0.4;
    }

    this.dispatch(deltaX, deltaY, true);

    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.lastTime = now;
  }

  private onPointerUp(e: PointerEvent) {
    if (!this.isDragging) return;
    if (!this.target) return;

    this.target.releasePointerCapture(e.pointerId);
    this.target.removeEventListener("pointermove", this.pointerMoveListener);
    this.target.removeEventListener("pointerup", this.pointerUpListener);

    this.isDragging = false;

    const now = performance.now();
    const moveDistX = Math.abs(e.clientX - this.startX);
    const moveDistY = Math.abs(e.clientY - this.startY);
    const elapsedSinceStart = now - this.startTime;
    const timeSinceLastMove = now - this.lastTime;

    // STALE CHECK: If the user held their finger still for > 50ms before lifting,
    // they didn't want to 'fling', they wanted to 'stop'.
    if (timeSinceLastMove > 50) {
      this.stopMovement();
      return;
    }

    // TAP CHECK: Small movement, short time.
    if (moveDistX < 10 && moveDistY < 10 && elapsedSinceStart < 200) {
      this.stopMovement();
      return;
    }

    // Reset lastTime to current for the physicsLoop delta calculation
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
