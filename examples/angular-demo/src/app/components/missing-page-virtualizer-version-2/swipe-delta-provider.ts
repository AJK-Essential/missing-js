import { css, html, LitElement } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

@customElement('swipe-delta-provider')
export class SwipeDeltaProvider extends LitElement {
  @property({ type: Number, reflect: true, attribute: 'swipe-area-height' })
  swipeAreaHeight = 0;

  @property({ type: Number, reflect: true, attribute: 'swipe-area-width' })
  swipeAreaWidth = 0;

  @property({ type: Number, reflect: true, attribute: 'initial-x' })
  initialX = 0;

  @property({ type: Number, reflect: true, attribute: 'initial-y' })
  initialY = 0;

  @property({ type: String, reflect: true, attribute: 'first-element-to-capture-clicks-selector' })
  firstElementToCaptureClicksSelector = '';

  static override styles = css`
    :root {
      --clientWidth: 100%;
      --clientHeight: 100%;
      --scrollWidth: 100%;
      --scrollHeight: 100%;
    }
    :host {
      width: var(--clientWidth);
      height: var(--clientHeight);
      position: fixed;
      top: 0;
      left: 0;
      overflow: auto;
    }
    :host::-webkit-scrollbar {
      display: none;
    }
    .large-area {
      height: var(--scrollHeight);
      width: var(--scrollWidth);
    }
  `;

  public targetElement?: HTMLElement;

  private hostResizeListener = this.onHostResize.bind(this);
  private hostResizeObserver = new ResizeObserver(this.hostResizeListener);
  private targetWheelListener = this.onTargetWheel.bind(this);
  private targetPointerDownListener = this.onTargetPointerDown.bind(this);
  private targetPointerMoveListener = this.onTargetPointerMove.bind(this);
  private hostScrollListener = this.onHostScroll.bind(this);
  private hostPointerMoveListener = this.onHostPointerMove.bind(this);
  private hostClickListener = this.onHostClick.bind(this);

  private scrollReset = false;
  private previousScrollY?: number;
  private previousScrollX?: number;
  private currentY!: number;
  private currentX!: number;

  override render() {
    return html` <div class="large-area"></div> `;
  }
  initialize() {
    if (this.targetElement) {
      this.style.setProperty(`--scrollWidth`, this.swipeAreaWidth + 'px');
      this.style.setProperty(`--scrollHeight`, this.swipeAreaHeight + 'px');
      this.scrollTop = 0.5 * (this.scrollHeight - this.clientHeight);
      this.scrollLeft = 0.5 * (this.scrollWidth - this.clientWidth);
      this.hostResizeObserver.observe(this.targetElement);
      this.targetElement.addEventListener('wheel', this.targetWheelListener);
      this.targetElement.addEventListener('pointermove', this.targetPointerMoveListener);
      this.targetElement.addEventListener('pointerdown', this.targetPointerDownListener);
      this.currentX = this.initialX;
      this.currentY = this.initialY;
      this.addEventListener('scroll', this.hostScrollListener);
      this.addEventListener('pointermove', this.hostPointerMoveListener);
      this.addEventListener('click', this.hostClickListener.bind(this));
    }
  }
  onHostResize() {
    this.style.setProperty(`--clientWidth`, this.targetElement!.clientWidth + 'px');
    this.style.setProperty(`--clientHeight`, this.targetElement!.clientHeight + 'px');
    this.style.left = this.targetElement!.getBoundingClientRect().left + 'px';
    this.style.top = this.targetElement!.getBoundingClientRect().top + 'px';
  }
  onTargetWheel(e: WheelEvent) {
    this.scrollTheScrollArea(e);
  }
  onTargetPointerDown(e: PointerEvent) {
    this.onScrollAreaPointerDown(e);
  }
  onTargetPointerMove(e: PointerEvent) {
    this.onScrollAreaPointerMove(e);
  }
  scrollTheScrollArea(e: WheelEvent) {
    this.scrollReset = false;
    this.previousScrollY = this.scrollTop;
    this.scrollTop += e.deltaY;
  }
  onScrollAreaPointerDown(e: PointerEvent) {
    if (e.pointerType === 'mouse') {
      this.style.pointerEvents = 'none';
    } else {
      this.style.pointerEvents = 'all';
    }
  }
  onScrollAreaPointerMove(e: PointerEvent) {
    if (e.pointerType === 'mouse') {
      this.style.pointerEvents = 'none';
    } else {
      this.style.pointerEvents = 'all';
    }
  }
  onHostScroll(e: Event) {
    this.onAreaScroll(e);
  }

  override disconnectedCallback(): void {
    this.hostResizeObserver.disconnect();
    this.targetElement?.removeEventListener('wheel', this.targetWheelListener);
    this.targetElement?.removeEventListener('pointermove', this.targetPointerMoveListener);
    this.targetElement?.removeEventListener('pointerdown', this.targetPointerDownListener);
    this.removeEventListener('scroll', this.hostScrollListener);
    this.removeEventListener('pointermove', this.hostPointerMoveListener);
    this.removeEventListener('click', this.hostClickListener.bind(this));
    super.disconnectedCallback();
  }
  onAreaScroll(e: Event) {
    if (this.scrollReset) {
      this.scrollReset = false;
      return;
    }
    const el = e.target as HTMLElement;
    let directionY: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    let directionX: 'LEFT' | 'RIGHT' | 'STABLE' = 'STABLE';
    let diffY = 0;
    let diffX = 0;
    if (typeof this.previousScrollY === 'number') {
      if (el.scrollTop > this.previousScrollY) {
        directionY = 'DOWN';
      } else if (el.scrollTop < this.previousScrollY) {
        directionY = 'UP';
      }
      diffY = el.scrollTop - this.previousScrollY;
    }
    if (typeof this.previousScrollX === 'number') {
      if (el.scrollLeft > this.previousScrollX) {
        directionX = 'RIGHT';
      } else if (el.scrollLeft < this.previousScrollX) {
        directionX = 'LEFT';
      }
      diffX = el.scrollLeft - this.previousScrollX;
    }
    this.previousScrollY = el.scrollTop;
    this.previousScrollX = el.scrollLeft;
    this.currentX += diffX;
    this.currentY += diffY;

    this.dispatchEvent(
      new CustomEvent('scrolling', {
        detail: {
          diffY: diffY,
          diffX: diffX,
          currentX: this.currentX,
          currentY: this.currentY,
        },
      }),
    );

    if (el.scrollTop > 0.9 * (el.scrollHeight - el.clientHeight) && directionY === 'DOWN') {
      this.scrollReset = true;
      el.scrollTop = 0.5 * el.scrollHeight - el.clientHeight;
      this.previousScrollY = 0.5 * el.scrollHeight - el.clientHeight;
    }
    if (el.scrollTop < 0.1 * (el.scrollHeight - el.clientHeight) && directionY === 'UP') {
      this.scrollReset = true;
      el.scrollTop = 0.5 * el.scrollHeight - el.clientHeight;
      this.previousScrollY = 0.5 * el.scrollHeight - el.clientHeight;
    }

    if (el.scrollLeft > 0.9 * (el.scrollWidth - el.clientWidth) && directionX === 'RIGHT') {
      this.scrollReset = true;
      el.scrollLeft = 0.5 * el.scrollWidth - el.clientWidth;
      this.previousScrollX = 0.5 * el.scrollWidth - el.clientWidth;
    }
    if (el.scrollLeft < 0.1 * (el.scrollWidth - el.clientWidth) && directionX === 'LEFT') {
      this.scrollReset = true;
      el.scrollLeft = 0.5 * el.scrollWidth - el.clientWidth;
      this.previousScrollX = 0.5 * el.scrollWidth - el.clientWidth;
    }
  }
  onHostPointerMove(e: PointerEvent) {
    this.onScrollAreaPointerMove(e);
  }
  onHostClick(e: MouseEvent) {
    if (!this.targetElement) {
      return;
    }
    const elementsBelow = document.elementsFromPoint(e.clientX, e.clientY);
    const requiredElement = elementsBelow.filter(
      (el) => el instanceof HTMLElement && el.matches(this.firstElementToCaptureClicksSelector),
    )[0];

    (requiredElement as HTMLElement).click();
    (requiredElement as HTMLElement).focus();

    this.style.pointerEvents = 'none';
  }
}
