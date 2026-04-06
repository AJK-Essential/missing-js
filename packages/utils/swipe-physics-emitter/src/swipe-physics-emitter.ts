export type MissingSwipePhysicsEvent = CustomEvent<SwipePhysicsDetail>;

export interface SwipePhysicsDetail {
  deltaX: number;
  deltaY: number;
  velocityX: number;
  velocityY: number;
  isDragging: boolean;
}

export class MissingSwipePhysicsEmitter {
  public friction: number = 0.88;

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

  // Friction: 0.88 is "heavy", 0.95 is "standard"

  private target?: HTMLElement | null;

  private pointerMoveListener = this.onPointerMove.bind(this);
  private pointerDownListener = this.onPointerDown.bind(this);
  private pointerUpListener = this.onPointerUp.bind(this);

  public emitFor(target: HTMLElement): void {
    this.target = target;
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
    const MissingSwipePhysicsEvent: MissingSwipePhysicsEvent = new CustomEvent(
      "swipe-detected",
      {
        detail,
        bubbles: true,
        composed: true,
      },
    );
    this.target.dispatchEvent(MissingSwipePhysicsEvent);
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
      this.velocityX = deltaX / deltaTime;
      this.velocityY = deltaY / deltaTime;
    }

    // Dispatch immediate finger movement
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

    const moveDistX = Math.abs(e.clientX - this.startX);
    const moveDistY = Math.abs(e.clientY - this.startY);
    const elapsed = performance.now() - this.startTime;

    // // If it's a tap (small movement, short time), don't trigger inertia
    // if (moveDistX < 10 && moveDistY < 10 && elapsed < 200) {
    //   this.velocityX = 0;
    //   this.velocityY = 0;
    //   return;
    // }

    this.animationId = requestAnimationFrame(this.physicsLoop);
  }

  private physicsLoop = (): void => {
    if (this.isDragging) return;

    this.velocityX *= this.friction;
    this.velocityY *= this.friction;

    // Calculate deltas based on velocity projected over a 16ms frame
    const deltaX = this.velocityX * 16;
    const deltaY = this.velocityY * 16;

    this.dispatch(deltaX, deltaY, false);

    // Stop when both axes have effectively stopped
    if (Math.abs(this.velocityX) > 0.05 || Math.abs(this.velocityY) > 0.05) {
      this.animationId = requestAnimationFrame(this.physicsLoop);
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
