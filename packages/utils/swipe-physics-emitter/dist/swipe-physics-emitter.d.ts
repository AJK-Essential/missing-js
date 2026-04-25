export type MissingSwipePhysicsEvent = CustomEvent<SwipePhysicsDetail>;
export interface SwipePhysicsDetail {
    deltaX: number;
    deltaY: number;
    velocityX: number;
    velocityY: number;
    isDragging: boolean;
}
export declare class MissingSwipePhysicsEmitter {
    friction: number;
    private stopViscosity;
    private velocityX;
    private velocityY;
    private isDragging;
    private lastX;
    private lastY;
    private lastTime;
    private velocityBuffer;
    private animationId;
    private target?;
    private pendingDeltaX;
    private pendingDeltaY;
    private moveRequested;
    private pointerMoveListener;
    private pointerDownListener;
    private pointerUpListener;
    emitFor(target: HTMLElement): void;
    private stopMovement;
    private dispatch;
    private onPointerDown;
    private onPointerMove;
    private onPointerUp;
    private physicsLoop;
    destroy(): void;
}
//# sourceMappingURL=swipe-physics-emitter.d.ts.map