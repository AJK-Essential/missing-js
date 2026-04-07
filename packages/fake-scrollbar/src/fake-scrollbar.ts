import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { debounceTime, fromEvent, Subscription } from "rxjs";

export type DraggingEvent = CustomEvent<{
  scrollTop: number;
}>;

export type ArrowClickedEvent = DraggingEvent;

@customElement("missing-fake-scrollbar")
export class MissingFakeScrollbar extends LitElement {
  @property({ type: Number, reflect: true })
  targetScrollHeight = 0;

  @property({ type: Number, reflect: true })
  targetClientHeight = 0;

  @property({
    type: Number,
    reflect: true,
    attribute: "arrow-click-scroll-delta",
  })
  arrowClickScrollTopDelta = 40;

  @property({ type: Number, reflect: true })
  computedTargetScrollTop = 0;

  @state()
  trackOffset = 0;

  @state()
  trackHeight = 0;

  @state()
  computedThumbSize = 32;

  @state()
  thumbTop = 0;

  public dragging = false;

  private mouseDownOffsetY = 0;
  private thumb?: HTMLElement;
  private track?: HTMLElement;

  private mouseMoveListener = this.mouseMoveCB.bind(this);
  private mouseUpListener = this.mouseUpCB.bind(this);

  private resizeObserverListener = this.resizeObserverCB.bind(this);
  private resizeObserver = new ResizeObserver(this.resizeObserverListener);
  private mouseMoveEventDebounceListener: Subscription | undefined;

  static override styles = css`
    * {
      box-sizing: border-box;
    }
    :host {
      display: block;
      height: 100%;
      width: var(--scrollbar-width, 2rem);
      position: absolute;
      --thumb-height: 2rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .track {
      width: 100%;
      height: 100%;
      background: var(--track-background, gray);
      position: relative;
      justify-content: center;
      display: flex;
    }
    .thumb {
      touch-action: none;
      width: 100%;
      min-height: 2rem;
      height: var(--thumb-height);
      position: absolute;
      top: clamp(
        0px,
        calc(var(--thumb-top) - calc(var(--track-offset))),
        calc(100% - var(--thumb-height))
      );
      background: var(--thumb-background, teal);
      cursor: grab;
      user-select: none;
      will-change: inset;
    }
    .thumb:active {
      cursor: grabbing;
    }
    .up-arrow,
    .down-arrow {
      width: 100%;
      background-color: black;
    }
  `;

  protected override render() {
    return html`
      <div
        class="up-arrow"
        @pointerdown="${() => {
          this.changeScrollTop(-this.arrowClickScrollTopDelta);
        }}"
      >
        <slot name="up-arrow" />
      </div>
      <div
        part="track"
        class="track"
        style="--track-offset:${this.trackOffset}px"
      >
        <div
          part="thumb"
          class="thumb"
          style="display: ${this.targetScrollHeight > this.targetClientHeight
            ? "block"
            : "none"};
          --thumb-height: ${this.computedThumbSize}px;
          --thumb-top: ${this.thumbTop}px
          "
          @pointerdown="${(e: PointerEvent) => {
            if (this.thumb) {
              e.preventDefault();
              this.thumb.setPointerCapture(e.pointerId);
              this.initialiseMouseDown(e);
            }
          }}"
        ></div>
      </div>
      <div
        class="down-arrow"
        @pointerdown="${() => {
          this.changeScrollTop(this.arrowClickScrollTopDelta);
        }}"
      >
        <slot name="down-arrow"></slot>
      </div>
    `;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute("tabindex", "-1");
    this.updateComplete.then(() => {
      this.thumb = this.renderRoot.querySelector(".thumb") as HTMLElement;
      this.track = this.thumb.parentElement as HTMLElement;
      this.resizeObserver.observe(this);
      this.mouseMoveEventDebounceListener = fromEvent(this.thumb, "pointermove")
        .pipe(debounceTime(70))
        .subscribe(() => {
          if (this.dragging) {
            this.dispatchEvent(
              new CustomEvent("drag-stopped", {
                detail: { scrollTop: this.computedTargetScrollTop },
                composed: true,
              }),
            );
          }
        });
    });
  }

  override disconnectedCallback(): void {
    this.resizeObserver.disconnect();
    this.mouseMoveEventDebounceListener?.unsubscribe();
    super.disconnectedCallback();
  }

  protected override updated(changedProperties: Map<string, unknown>) {
    if (
      changedProperties.has("targetClientHeight") ||
      changedProperties.has("targetScrollHeight")
    ) {
      this.reconfigureThumbSize();
    }
  }

  private reconfigureThumbSize() {
    const thumbScale = this.targetClientHeight / this.targetScrollHeight;
    const scaledDownThumbSize = this.trackHeight * thumbScale;
    this.computedThumbSize =
      scaledDownThumbSize >= 32 ? scaledDownThumbSize : 32;
  }

  private initialiseMouseDown(e: PointerEvent) {
    this.thumb = this.renderRoot.querySelector(".thumb") as HTMLElement;
    this.track = this.thumb.parentElement as HTMLElement;
    const trackRect = this.track.getBoundingClientRect();
    this.trackHeight = trackRect.height;
    this.trackOffset = trackRect.top;

    this.dragging = true;
    this.mouseDownOffsetY = e.clientY - this.thumb!.getBoundingClientRect().top;
    if (this.thumb) {
      this.thumb.removeEventListener("pointermove", this.mouseMoveListener);
      this.thumb.removeEventListener("pointerup", this.mouseUpListener);
      this.thumb.addEventListener("pointermove", this.mouseMoveListener);
      this.thumb.addEventListener("pointerup", this.mouseUpListener);
    }
  }

  private mouseMoveCB(e: PointerEvent) {
    e.preventDefault();
    this.thumbTop = e.clientY - this.mouseDownOffsetY;
    this.reconfigureThumbSize();
    const restOfTrack = this.trackHeight - this.computedThumbSize;
    const thumbTopOffset = this.thumbTop - this.trackOffset;
    this.computedTargetScrollTop =
      (thumbTopOffset / restOfTrack) *
      (this.targetScrollHeight - this.targetClientHeight);
    this.computedTargetScrollTop = Math.min(
      Math.max(0, this.computedTargetScrollTop),
      this.targetScrollHeight - this.targetClientHeight,
    );
    this.dispatchEvent(
      new CustomEvent("dragging", {
        detail: { scrollTop: this.computedTargetScrollTop },
        composed: true,
      }),
    );
  }

  private mouseUpCB(e: PointerEvent) {
    this.dragging = false;
    if (this.thumb) {
      this.thumb.releasePointerCapture(e.pointerId);
      this.thumb.removeEventListener("pointermove", this.mouseMoveListener);
      this.thumb.removeEventListener("pointerup", this.mouseUpListener);
    }
    this.dispatchEvent(
      new CustomEvent("dragRelease", {
        detail: { scrollTop: this.computedTargetScrollTop },
        composed: true,
      }),
    );
  }

  setToScrollTop(scrollTop: number) {
    const finalScrollTop = Math.min(
      Math.max(0, scrollTop),
      this.targetScrollHeight - this.targetClientHeight,
    );
    this.computedTargetScrollTop = finalScrollTop;
    const restOfTrack = this.trackHeight - this.computedThumbSize;
    const thumbTopOffset =
      restOfTrack *
      (finalScrollTop / (this.targetScrollHeight - this.targetClientHeight));
    this.thumbTop = thumbTopOffset + this.trackOffset;
  }

  public changeScrollTop(delta: number) {
    this.computedTargetScrollTop += delta;
    this.setToScrollTop(this.computedTargetScrollTop);
    this.dispatchEvent(
      new CustomEvent("dragging", {
        detail: { scrollTop: this.computedTargetScrollTop },
      }),
    );
  }

  private resizeObserverCB(e: ResizeObserverEntry[]) {
    this.thumb = this.renderRoot.querySelector(".thumb") as HTMLElement;
    this.track = this.thumb.parentElement as HTMLElement;
    const trackRect = this.track.getBoundingClientRect();
    this.trackHeight = trackRect.height;
    this.trackOffset = trackRect.top;
    this.reconfigureThumbSize();
    this.setToScrollTop(this.computedTargetScrollTop);
    this.dispatchEvent(new CustomEvent("resized", { composed: true }));
  }
}
