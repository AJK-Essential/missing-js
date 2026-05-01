export type MissingSwipePhysicsEvent = CustomEvent<SwipePhysicsDetail>;
export interface SwipePhysicsDetail {
    deltaX: number;
    deltaY: number;
    velocityX: number;
    velocityY: number;
    isDragging: boolean;
}
export declare class MissingSwipePhysicsEmitter {
    private friction;
    private launchMultiplier;
    private snapThreshold;
    private velocityX;
    private velocityY;
    private isDragging;
    private lastX;
    private lastY;
    private lastTime;
    private velocityBuffer;
    private animationId;
    private target?;
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