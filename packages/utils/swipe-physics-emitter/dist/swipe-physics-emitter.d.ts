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
    private velocityX;
    private velocityY;
    private isDragging;
    private lastX;
    private lastY;
    private lastTime;
    private startX;
    private startY;
    private startTime;
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