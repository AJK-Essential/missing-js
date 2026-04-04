import { LitElement } from "lit";
import { property } from "lit/decorators.js";

export class virtualiserKeyboardBase extends LitElement {
  @property({
    type: String,
    reflect: true,
    attribute: "tabbing-element-selector",
  })
  public tabbingElementSelector?: string;

  @property({ type: Boolean, reflect: true, attribute: "default-tabbing" })
  public defaultTabbing = false;

  @property({
    type: Boolean,
    reflect: true,
    attribute: "default-arrow-up-navigation",
  })
  public defaultArrowUpNavigation = false;

  @property({
    type: Boolean,
    reflect: true,
    attribute: "default-arrow-down-navigation",
  })
  public defaultArrowDownNavigation = false;

  @property({
    type: Boolean,
    reflect: true,
    attribute: "default-page-up-navigation",
  })
  public defaultPageUpNavigation = false;

  @property({
    type: Boolean,
    reflect: true,
    attribute: "default-page-down-navigation",
  })
  public defaultPageDownNavigation = false;

  @property({ type: Object })
  public keyboardIncrements = {
    arrowdown: 5,
    arrowup: -5,
    pagedown: 2000,
    pageup: -2000,
  };

  @property({
    type: Number,
    reflect: true,
    attribute: "tabbing-item-transition-time",
  })
  public tabbingItemTransitionTime?: number;

  private shiftPressed = false;
  private tabPressed = false;

  private keyboardDownEventListener = this.keyboardDownEventCB.bind(this);
  private keyboardUpEventListener = this.keyboardUpEventCB.bind(this);
  private documentKeyboardDownListener = this.documentKeyboardDownCB.bind(this);

  async wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected setupKeyboardInteractions() {
    this.addEventListener("keydown", this.keyboardDownEventListener);
    window.addEventListener("keyup", this.keyboardUpEventListener);
    document.body.addEventListener(
      "keydown",
      this.documentKeyboardDownListener,
    );
    if (this.defaultTabbing) {
      this.addEventListener("focusin", async (e) => {
        const thisRect = this.getBoundingClientRect();
        const thisTop = thisRect.top;
        const thisBottom = thisRect.bottom;
        const focusTargetElement = e.composedPath()[0];
        if (this.tabbingElementSelector) {
          let allTabbers = Array.from(
            this.querySelectorAll(this.tabbingElementSelector!),
          ) as HTMLElement[];

          if (allTabbers.includes(focusTargetElement as HTMLElement)) {
            this.scrollTop = 0;
            let requiredScrollDelta;
            if (this.tabPressed && !this.shiftPressed) {
              // forward Tab
              e.preventDefault();
              await this.runAfterTransitions(focusTargetElement as HTMLElement);
              // if its not the last element in the list
              if (
                allTabbers.indexOf(focusTargetElement as HTMLElement) !==
                allTabbers.length - 1
              ) {
                // in this case, the element could be some element top that is above the fold.
                // if the element top is the fold, while forward tabbing then we set a new element
                // as the next required focus target
                const focusTargetElementTopIsAboveFold =
                  (focusTargetElement as HTMLElement).getBoundingClientRect()
                    .top < thisTop;
                if (focusTargetElementTopIsAboveFold) {
                  const newFocusTargetElementThatIsWithinFold = allTabbers.find(
                    (tabber) => tabber.getBoundingClientRect().top >= thisTop,
                  );
                  if (newFocusTargetElementThatIsWithinFold) {
                    newFocusTargetElementThatIsWithinFold.focus();
                  }
                  return;
                }
                // else this is a normal case.
                requiredScrollDelta = this.getNextScrollDelta(
                  focusTargetElement as HTMLElement,
                  "forwards",
                  thisTop,
                  thisBottom,
                );
              }
              // else if it is the last element in the series, we simply pull it to the center
              // so as to force a scroll down and thereby load more elements below
              else {
                let tabbedElementRect = (
                  focusTargetElement as HTMLElement
                ).getBoundingClientRect();
                requiredScrollDelta =
                  tabbedElementRect.top -
                  this.clientHeight / 2 +
                  tabbedElementRect.height / 2;
              }
              this.tabPressed = false;
              this.shiftPressed = false;
              this.scrollByAmt(requiredScrollDelta as number);
              this.scrollCheck();
            } else if (this.tabPressed && this.shiftPressed) {
              // backward Tab
              e.preventDefault();
              await this.runAfterTransitions(focusTargetElement as HTMLElement);
              // if it is not the first element in the list
              if (allTabbers.indexOf(focusTargetElement as HTMLElement) !== 0) {
                // in this case, the element could be some element with its bottom that is below the fold.
                // if the element's bottom is below the fold, while backward tabbing, then we set a new element
                // as the next required focus target
                const focusTargetElementBottomIsBelowFold =
                  (focusTargetElement as HTMLElement).getBoundingClientRect()
                    .bottom >= thisBottom;
                if (focusTargetElementBottomIsBelowFold) {
                  const newFocusTargetElementThatIsWithinFold =
                    allTabbers.findLast(
                      (tabber: HTMLElement) =>
                        tabber.getBoundingClientRect().bottom <= thisBottom,
                    );
                  if (newFocusTargetElementThatIsWithinFold) {
                    newFocusTargetElementThatIsWithinFold.focus();
                  }
                  return;
                }
                // else this is a normal case.
                requiredScrollDelta = this.getNextScrollDelta(
                  focusTargetElement as HTMLElement,
                  "backwards",
                  thisTop,
                  thisBottom,
                );
              }
              // else if is the first element in the series, we simply pull it to the center
              // so as to force a scroll up and thereby load more elements above
              else {
                let tabbedElementRect = (
                  focusTargetElement as HTMLElement
                ).getBoundingClientRect();
                requiredScrollDelta =
                  tabbedElementRect.top -
                  this.clientHeight / 2 +
                  tabbedElementRect.height / 2;
              }
              this.tabPressed = false;
              this.shiftPressed = false;
              this.scrollByAmt(requiredScrollDelta as number);
              this.scrollCheck();
            }
          }
        }
      });
    }
  }

  getNextScrollDelta(
    tabbedElement: HTMLElement,
    direction: "forwards" | "backwards",
    thisTop: number,
    thisBottom: number,
  ) {
    let delta = 0;
    let tabbedElementRect = tabbedElement.getBoundingClientRect();
    if (direction === "forwards") {
      const visibility =
        tabbedElementRect.top < thisBottom &&
        tabbedElementRect.bottom <= thisBottom
          ? "completely-within"
          : tabbedElementRect.top <= thisBottom &&
              tabbedElementRect.bottom > thisBottom
            ? "partially-within"
            : "out";
      if (visibility === "completely-within") {
        delta = 0;
      } else if (visibility === "partially-within" || visibility === "out") {
        const heightExceedsView = tabbedElementRect.height >= this.clientHeight;
        if (heightExceedsView) {
          delta = tabbedElementRect.top - thisTop;
        } else {
          delta =
            visibility === "out"
              ? tabbedElementRect.top -
                this.clientHeight / 2 +
                tabbedElementRect.height / 2
              : tabbedElementRect.bottom - thisBottom;
        }
      }
    } else {
      const visibility =
        tabbedElementRect.bottom > thisTop && tabbedElementRect.top >= thisTop
          ? "completely-within"
          : tabbedElementRect.bottom >= thisTop &&
              tabbedElementRect.top < thisTop
            ? "partially-within"
            : "out";
      if (visibility === "completely-within") {
        delta = 0;
      } else if (visibility === "partially-within" || visibility === "out") {
        const heightExceedsView = tabbedElementRect.height >= this.clientHeight;
        if (heightExceedsView) {
          delta = tabbedElementRect.bottom - thisBottom;
        } else {
          delta =
            visibility === "out"
              ? tabbedElementRect.top -
                this.clientHeight / 2 +
                tabbedElementRect.height / 2
              : tabbedElementRect.top - thisTop;
        }
      }
    }
    return delta;
  }

  override disconnectedCallback(): void {
    this.removeEventListener("keydown", this.keyboardDownEventListener);
    window.removeEventListener("keyup", this.keyboardUpEventListener);
    document.body.removeEventListener(
      "keydown",
      this.documentKeyboardDownListener,
    );
    super.disconnectedCallback();
  }

  protected scrollByAmt(amt: number, byPassTransitions = false) {}
  protected scrollCheck() {}

  protected tickFrame?: number;
  protected scrollAmt = 0;
  protected direction: "UP" | "DOWN" | "STABLE" = "STABLE";

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
      case "arrowdown":
        {
          if (this.defaultArrowDownNavigation) {
            this.focus();
            this.onKeyDown(key, this.keyboardIncrements[key]);
          }
        }
        break;
      case "arrowup":
        {
          if (this.defaultArrowUpNavigation) {
            this.focus();
            this.onKeyDown(key, this.keyboardIncrements[key]);
          }
        }
        break;
      case "pagedown":
        {
          if (this.defaultPageDownNavigation) {
            this.focus();
            e.preventDefault();
            this.onKeyDown(key, this.keyboardIncrements[key]);
          }
        }
        break;
      case "pageup":
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
    // this.blur();
  }
  documentKeyboardDownCB(e: KeyboardEvent) {
    this.tabPressed = e.key.toLowerCase() === "tab";
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
  protected onKeyDown(
    key: "arrowdown" | "arrowup" | "pageup" | "pagedown",
    increment: number,
  ) {}
  protected onKeyUp(key: typeof KeyboardEvent.prototype.key) {}
}
