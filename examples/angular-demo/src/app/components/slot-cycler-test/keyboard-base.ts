import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

export class virtualiserKeyboardBase extends LitElement {
  @property({
    type: String,
    reflect: true,
    attribute: 'tabbing-element-selector',
  })
  public tabbingElementSelector?: string;

  @property({ type: Boolean, reflect: true, attribute: 'default-tabbing' })
  public defaultTabbing = false;

  @property({
    type: Boolean,
    reflect: true,
    attribute: 'default-arrow-up-navigation',
  })
  public defaultArrowUpNavigation = false;

  @property({
    type: Boolean,
    reflect: true,
    attribute: 'default-arrow-down-navigation',
  })
  public defaultArrowDownNavigation = false;

  @property({
    type: Boolean,
    reflect: true,
    attribute: 'default-page-up-navigation',
  })
  public defaultPageUpNavigation = false;

  @property({
    type: Boolean,
    reflect: true,
    attribute: 'default-page-down-navigation',
  })
  public defaultPageDownNavigation = false;
  /**
   * Make sure these jumps are less than the default height of each
   * pages. Otherwise it will jump more and on later
   * scrolling back or forward, it will correct itself
   */
  @property({ type: Object })
  public keyboardIncrements = {
    arrowdown: 5,
    arrowup: -5,
    pagedown: 100,
    pageup: -100,
  };

  @property({
    type: Number,
    reflect: true,
    attribute: 'tabbing-item-transition-time',
  })
  public tabbingItemTransitionTime?: number;

  public shiftPressed = false;
  public tabPressed = false;

  private keyboardDownEventListener = this.keyboardDownEventCB.bind(this);
  private keyboardUpEventListener = this.keyboardUpEventCB.bind(this);
  private documentKeyboardDownListener = this.documentKeyboardDownCB.bind(this);
  // inorder to prevent opacity change of container (that was there to prevent FOUC)
  // for the tab scenario which does not need the visual hiding.
  protected noOpacityChange = false;

  async wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected setupKeyboardInteractions() {
    this.addEventListener('keydown', this.keyboardDownEventListener);
    window.addEventListener('keyup', this.keyboardUpEventListener);
    document.body.addEventListener('keydown', this.documentKeyboardDownListener);
  }

  getNextScrollDelta(
    tabbedElement: HTMLElement,
    direction: 'forwards' | 'backwards',
    thisTop: number,
    thisBottom: number,
  ) {
    let delta = 0;
    let tabbedElementRect = tabbedElement.getBoundingClientRect();
    if (direction === 'forwards') {
      const visibility =
        tabbedElementRect.top < thisBottom && tabbedElementRect.bottom <= thisBottom
          ? 'completely-within'
          : tabbedElementRect.top <= thisBottom && tabbedElementRect.bottom > thisBottom
            ? 'partially-within'
            : 'out';
      if (visibility === 'completely-within') {
        delta = 0;
      } else if (visibility === 'partially-within' || visibility === 'out') {
        const heightExceedsView = tabbedElementRect.height >= this.clientHeight;
        if (heightExceedsView) {
          delta = tabbedElementRect.top - thisTop;
        } else {
          delta =
            visibility === 'out'
              ? tabbedElementRect.top - this.clientHeight / 2 + tabbedElementRect.height / 2
              : tabbedElementRect.bottom - thisBottom;
        }
      }
    } else {
      const visibility =
        tabbedElementRect.bottom > thisTop && tabbedElementRect.top >= thisTop
          ? 'completely-within'
          : tabbedElementRect.bottom >= thisTop && tabbedElementRect.top < thisTop
            ? 'partially-within'
            : 'out';
      if (visibility === 'completely-within') {
        delta = 0;
      } else if (visibility === 'partially-within' || visibility === 'out') {
        const heightExceedsView = tabbedElementRect.height >= this.clientHeight;
        if (heightExceedsView) {
          delta = tabbedElementRect.bottom - thisBottom;
        } else {
          delta =
            visibility === 'out'
              ? tabbedElementRect.top - this.clientHeight / 2 + tabbedElementRect.height / 2
              : tabbedElementRect.top - thisTop;
        }
      }
    }
    return delta;
  }

  override disconnectedCallback(): void {
    this.removeEventListener('keydown', this.keyboardDownEventListener);
    window.removeEventListener('keyup', this.keyboardUpEventListener);
    document.body.removeEventListener('keydown', this.documentKeyboardDownListener);
    super.disconnectedCallback();
  }

  protected scrollByAmt(amt: number, byPassTransitions = false) {}
  protected scrollCheck() {}

  protected tickFrame?: number;
  protected scrollAmt = 0;
  protected direction: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';

  private tick = () => {
    if (this.tickFrame) {
      cancelAnimationFrame(this.tickFrame);
    }

    if (this.scrollAmt) {
      this.scrollByAmt(this.scrollAmt, true);
      this.tickFrame = requestAnimationFrame(this.tick.bind(this));
    }
  };

  protected repeatedScrollByPixels = (amt: number) => {
    if (this.tickFrame) {
      cancelAnimationFrame(this.tickFrame);
    }

    this.scrollAmt = amt;
    this.scrollByAmt(amt, true);
    this.tickFrame = requestAnimationFrame(this.tick.bind(this));
  };

  keyboardDownEventCB(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    switch (key) {
      case 'arrowdown':
        {
          if (this.defaultArrowDownNavigation) {
            this.focus();
            this.onKeyDown(key, this.keyboardIncrements[key]);
          }
        }
        break;
      case 'arrowup':
        {
          if (this.defaultArrowUpNavigation) {
            this.focus();
            this.onKeyDown(key, this.keyboardIncrements[key]);
          }
        }
        break;
      case 'pagedown':
        {
          if (this.defaultPageDownNavigation) {
            this.focus();
            e.preventDefault();
            this.onKeyDown(key, this.keyboardIncrements[key]);
          }
        }
        break;
      case 'pageup':
        {
          if (this.defaultPageUpNavigation) {
            this.focus();
            e.preventDefault();
            this.onKeyDown(key, this.keyboardIncrements[key]);
          }
        }
        break;
    }
  }
  keyboardUpEventCB(e: KeyboardEvent) {
    if (this.tickFrame) {
      cancelAnimationFrame(this.tickFrame);
    }
    this.scrollAmt = 0;
    this.tabPressed = false;
    this.shiftPressed = false;
    this.onKeyUp(e.key.toLowerCase());
  }
  documentKeyboardDownCB(e: KeyboardEvent) {
    this.tabPressed = e.key.toLowerCase() === 'tab';
    this.shiftPressed = e.shiftKey;
  }

  async runAfterTransitions(tabbedElement: HTMLElement) {
    // 1. Wait for user provided time
    if (this.tabbingItemTransitionTime !== undefined) {
      await this.wait(this.tabbingItemTransitionTime);
      return;
    }
    // 2. Otherwise, peek at the CSS
    const style = window.getComputedStyle(tabbedElement);
    const duration = parseFloat(style.transitionDuration) * 1000;
    const delay = parseFloat(style.transitionDelay) * 1000;
    const totalTime = duration + delay;

    // 3. If no transition is defined (0ms), run immediately.
    // If it exists, wait for the duration + a tiny safety buffer (20ms).
    if (totalTime > 0) {
      await this.wait(totalTime + 20);
    }
  }
  protected jumpToScrollTop(scrollTop: number) {}
  protected onKeyDown(key: 'arrowdown' | 'arrowup' | 'pageup' | 'pagedown', increment: number) {}
  protected onKeyUp(key: typeof KeyboardEvent.prototype.key) {}
}
