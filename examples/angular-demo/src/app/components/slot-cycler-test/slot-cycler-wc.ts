import { html, css } from 'lit';
import { customElement, property, queryAssignedElements, queryAll, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { MissingFakeScrollbar } from '@missing-js/fake-scrollbar';
import { MissingDimensionReporter } from '@missing-js/dimension-reporter';
import '@missing-js/dimension-reporter';
import { FenwickTree } from './simple-fenwick-tree';

import { virtualiserKeyboardBase } from './keyboard-base.js';

import {
  MissingSwipePhysicsEmitter,
  MissingSwipePhysicsEvent,
} from '@missing-js/swipe-physics-emitter';

export type LoadEvent = CustomEvent<{
  domOrderData: number[];
  domOrder: number[];
}>;

@customElement('missing-page-virtualizer-sc')
export class MissingPageVirtualizer extends virtualiserKeyboardBase {
  @property({ type: Array })
  public items: unknown[] = [];

  @property({ type: String, reflect: true })
  public defaultHeight = 200;

  @property({ type: Number, reflect: true, attribute: 'num-of-items' })
  public numOfItems = 2;

  @property({ type: String, reflect: true, attribute: 'unique-selector' })
  public uniqueSelector = '';

  @property({
    type: Number,
    reflect: true,
    attribute: 'arrow-click-scroll-delta',
  })
  public arrowClickScrollTopDelta = 40;

  @property({ type: Boolean, reflect: true, attribute: 'needs-transition' })
  public needsTransition = false;

  @property({ type: Object })
  public fakeScrollbar?: MissingFakeScrollbar;

  @property({ type: Boolean, reflect: true, attribute: 'swipe-scroll' })
  public swipeScroll?: boolean;

  @property({
    type: Number,
    reflect: true,
    attribute: 'swipe-delta-multiplier',
  })
  public swipeDeltaMultiplier = 1;

  @state()
  protected globalScrollY = 0;

  @state()
  private initialized = false;

  @state()
  private virtualScrollHeight = this.clientHeight;

  @state()
  private containerHeight = 100;

  @state()
  private translateY: string = '';

  @property({ type: Number, reflect: true })
  private startIndex = 0;

  @property({ type: Number, reflect: true })
  private hostClientHeight = this.clientHeight;

  @property({ type: Number, reflect: true })
  private containerClientWidth = this.clientWidth;

  @property({ type: Array })
  private slotOrder: Array<number> = [];

  @property({ type: Array })
  private transformData: Array<number> = [];

  @property({ type: Array })
  private tabIndexOrder: Array<number> = [];

  @queryAssignedElements()
  listItems!: Array<MissingDimensionReporter>;

  @queryAll('.container slot')
  slots?: Array<HTMLSlotElement>;

  @queryAll('missing-dimension-reporter')
  missingDimensionReporters?: Array<MissingDimensionReporter>;

  private containerResizeObserver = new ResizeObserver(this.containerResize.bind(this));
  private hostResizeObserver = new ResizeObserver(this.hostResize.bind(this));
  private hostSwipeListener = this.onHostSwipe.bind(this);
  private fakeScrollbarDraggingListener = this.onFakeScrollbarDragging.bind(this);
  private fakeScrollbarDragReleaseListener = this.onFakeScrollbarDragRelease.bind(this);
  private fakeScrollbarDragStopListener = this.onFakeScrollbarDragStop.bind(this);
  private ft?: FenwickTree;
  private dimensionChangedListener = this.dimensionChangedCB.bind(this);
  private rawHeights!: Float64Array;
  private pauseUpdate = false;
  private scrolling = false;
  private localScrollY = 0;
  private rawHeightUpdates: Record<number, (typeof this.rawHeights)[0]> = {};
  private container!: HTMLElement;
  private containerComputedStyle!: CSSStyleDeclaration;
  private innerSlot!: HTMLSlotElement;
  private scrollTimeout?: number;
  private scrollWaitTime = 250;
  private swipePhysics?: MissingSwipePhysicsEmitter;
  private slotChangedResolve?: (value: void) => void;
  private jumpSkipping = false;
  private accumulatedDelta = 0;
  private pendingViewTranslate?: string;
  private recoveryTimeout?: number;
  private dataShift = false;

  static override styles = css`
    * {
      box-sizing: border-box;
      transition: none;
    }
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      --transform-transition-time: 0.3s;
    }
    :host([swipe-scroll]),
    :host([swipe-scroll]) .container,
    :host([swipe-scroll]) ::slotted(*) {
      touch-action: none;
      overscroll-behavior: none;
      -webkit-user-drag: none;
      user-select: none;
    }
    .container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: fit-content;
      transform: translate3D(0, var(--translateY), 0);
      will-change: transform;
      min-height: 150vh;
      /* Add this to force the browser to keep the buffer pages in GPU memory */
      backface-visibility: hidden;
    }
    .ghosts {
      position: fixed;
      top: 99999px;
      visibility: hidden;
      z-index: -1;
      opacity: 0;
      contain: layout paint;
      backface-visibility: hidden;
    }
    .page-holder {
      position: absolute;
      will-change: transform;
      /* Add this to force the browser to keep the buffer pages in GPU memory */
      backface-visibility: hidden;
      contain: layout paint;
      top: 0px;
      transform: translate3D(0, var(--page-holder-translateY), 0);
    }
    .page-holder.hidden {
      opacity: 0;
    }
  `;

  override render() {
    return html`
      ${this.initialized
        ? html`
            <div class="container" style="--translateY:${this.translateY}">
              ${repeat(
                this.slotOrder,
                (slotNum) => slotNum,
                (slotNum, index) =>
                  html`<missing-dimension-reporter
                    data-page-index="${this.startIndex + index}"
                    is-page
                    .pageIndex="${this.startIndex + index}"
                    class="page-holder ${this.startIndex + index > this.items.length - 1
                      ? 'hidden'
                      : ''}"
                    style="--width: 100%;--page-holder-translateY:${this.transformData[index]}px"
                  >
                    <slot name="${slotNum}"></slot>
                  </missing-dimension-reporter>`,
              )}
            </div>
            <div class="ghosts" style="width:${this.containerClientWidth}px">
              <slot name="next-previous"></slot>
            </div>
          `
        : ''}
    `;
  }
  override update(changedProperties: Map<string, unknown>) {
    if (
      this.ft &&
      (changedProperties.has('localScrollY') || changedProperties.has('globalScrollY'))
    ) {
      this.refreshTheView();
    }
    super.update(changedProperties);
  }

  initialize() {
    this.initialized = true;
    this.addEventListener('dimension-changed', this.dimensionChangedListener);
    if (this.needsTransition) {
      this.classList.add('smooth');
    }
    this.updateComplete.then(() => {
      this.ft = new FenwickTree(this.items.length);
      this.rawHeights = new Float64Array(this.items.length).fill(this.defaultHeight);
      this.ft.initAll(this.rawHeights);
      if (this.fakeScrollbar) {
        this.fakeScrollbar.addEventListener('dragging', this.fakeScrollbarDraggingListener);
        this.fakeScrollbar.addEventListener('dragRelease', this.fakeScrollbarDragReleaseListener);
        this.fakeScrollbar.addEventListener('drag-stopped', this.fakeScrollbarDragStopListener);
      }
      this.updateTotalVirtualHeight();
      const renderRoot = this.renderRoot;
      this.container = renderRoot.querySelector('.container') as HTMLElement;
      this.innerSlot = renderRoot.querySelector('slot') as HTMLSlotElement;
      this.containerComputedStyle = getComputedStyle(this.container);
      this.containerResizeObserver.observe(this.container as HTMLElement);
      this.hostResizeObserver.observe(this);
      this.addEventListener('swipe-detected', this.hostSwipeListener);
      // this.dispatchLoadData();
      this.addEventListener('scroll', () => {
        this.scrollTop = 0;
      });
      this.addEventListener('wheel', (e) => {
        this.slowScrollBy(e.deltaY, true);
      });
      this.setupKeyboardInteractions();
      this.slotOrder = new Array(this.numOfItems)
        .fill(0)
        .map((_, index) => index + this.startIndex);
      const scrollTop =
        this.startIndex === 0 ? 0 : this.ft.getCumulativeHeight(this.startIndex - 1);
      this.setScrollTopAndTransform(scrollTop);

      this.refreshTheView();
      if (this.defaultTabbing) {
        this.addEventListener('focusin', async (e) => {
          const thisRect = this.getBoundingClientRect();
          const thisTop = thisRect.top;
          const thisBottom = thisRect.bottom;
          const focusTargetElement = e.composedPath()[0];
          if (this.tabbingElementSelector) {
            let allTabbers: HTMLElement[] = [];
            this.slots!.forEach((slot) => {
              allTabbers.push(
                ...(Array.from(
                  slot
                    .assignedElements({ flatten: true })[0]
                    .querySelectorAll(this.tabbingElementSelector!),
                ) as HTMLElement[]),
              );
            });

            if (allTabbers.includes(focusTargetElement as HTMLElement)) {
              this.scrollTop = 0;
              console.log(focusTargetElement);
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
                    (focusTargetElement as HTMLElement).getBoundingClientRect().top < thisTop;
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
                    'forwards',
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
                    tabbedElementRect.top - this.clientHeight / 2 + tabbedElementRect.height / 2;
                }
                this.tabPressed = false;
                this.shiftPressed = false;
                this.noOpacityChange = true;
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
                    (focusTargetElement as HTMLElement).getBoundingClientRect().bottom >=
                    thisBottom;
                  if (focusTargetElementBottomIsBelowFold) {
                    const newFocusTargetElementThatIsWithinFold = allTabbers.findLast(
                      (tabber: HTMLElement) => tabber.getBoundingClientRect().bottom <= thisBottom,
                    );
                    if (newFocusTargetElementThatIsWithinFold) {
                      newFocusTargetElementThatIsWithinFold.focus();
                    }
                    return;
                  }
                  // else this is a normal case.
                  requiredScrollDelta = this.getNextScrollDelta(
                    focusTargetElement as HTMLElement,
                    'backwards',
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
                    tabbedElementRect.top - this.clientHeight / 2 + tabbedElementRect.height / 2;
                }
                this.tabPressed = false;
                this.shiftPressed = false;
                this.noOpacityChange = true;
                this.scrollByAmt(requiredScrollDelta as number);
                this.scrollCheck();
              }
            }
          }
        });
      }
      document.addEventListener('selectionchange', () => {
        const selectedNode = document.getSelection()?.anchorNode;
        if (selectedNode && this.contains(selectedNode)) {
          const element =
            selectedNode?.nodeType === 1
              ? (selectedNode as HTMLElement)
              : selectedNode?.parentElement;
          if (this.tabbingElementSelector && element) {
            const closestTabber = element.closest(this.tabbingElementSelector);
            if (closestTabber) {
              this.tabPressed = true;
              (closestTabber as HTMLElement).focus();
            }
          }
        }
      });
    });
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (
      this.fakeScrollbar &&
      (changedProperties.has('hostClientHeight') || changedProperties.has('virtualScrollHeight'))
    ) {
      this.fakeScrollbar.targetClientHeight = this.hostClientHeight;
      this.fakeScrollbar.targetScrollHeight = this.virtualScrollHeight;
    }
    if (changedProperties.has('swipeScroll')) {
      if (this.swipeScroll) {
        this.swipePhysics = new MissingSwipePhysicsEmitter();
        this.swipePhysics.friction = 0.96;
        this.swipePhysics.emitFor(this);
      } else {
        this.swipePhysics?.destroy();
      }
    }
  }
  rotateReverse<T>(data: Array<T>) {
    return [data[data.length - 1], ...data.slice(0, data.length - 1)];
  }
  rotateForward<T>(data: Array<T>) {
    return [...data.slice(1), data[0]];
  }

  repeatRotate<T>(direction: 'forwards' | 'backwards', numOfTimes: number, data: Array<T>) {
    let tempData = [...data];
    for (let i = 1; i <= numOfTimes; ++i) {
      tempData = [
        ...(direction === 'backwards'
          ? this.rotateReverse(tempData)
          : this.rotateForward(tempData)),
      ];
    }
    return tempData;
  }

  override disconnectedCallback(): void {
    this.removeEventListener('dimension-changed', this.dimensionChangedListener);
    this.removeEventListener('swipe-detected', this.hostSwipeListener);
    if (this.fakeScrollbar) {
      this.fakeScrollbar.removeEventListener('dragging', this.fakeScrollbarDraggingListener);
      this.fakeScrollbar.removeEventListener('dragRelease', this.fakeScrollbarDragReleaseListener);
      this.fakeScrollbar.removeEventListener('drag-stopped', this.fakeScrollbarDragStopListener);
    }
    this.containerResizeObserver.disconnect();
    this.hostResizeObserver.disconnect();
    super.disconnectedCallback();
  }

  protected override scrollByAmt(amt: number, byPassTransitions = false): void {
    this.slowScrollBy(amt, byPassTransitions);
  }

  private onPowerScroll(fakeScrollbar: MissingFakeScrollbar) {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.classList.add('by-pass');
    this.jumpToScrollTop(fakeScrollbar.computedTargetScrollTop);
    this.dispatchEvent(new CustomEvent('scrolling'));

    this.scrollTop = 0;
  }

  private setScrollTopAndTransform(scrollTop: number, dispatchEvent = true) {
    if (this.ft) {
      const firstIndex = this.ft?.findIndexOfPixel(scrollTop);
      const cumulativePreviousHeight =
        firstIndex !== 0 ? this.ft.getCumulativeHeight(firstIndex - 1) : 0;
      const calculatedTranslateY = -(scrollTop - cumulativePreviousHeight);
      this.translateY = `${calculatedTranslateY}px`;
      this.localScrollY = -calculatedTranslateY;

      this.startIndex = firstIndex;
      if (dispatchEvent) {
        this.dispatchLoadData();
      }
    }
  }
  getTranslateXY(data: { element: HTMLElement } | { styleDeclaration: CSSStyleDeclaration }) {
    let style;
    if ('element' in data) {
      style = window.getComputedStyle(data.element);
    } else {
      style = data.styleDeclaration;
    }
    // Using DOMMatrixReadOnly ensures cross-browser compatibility
    const matrix = new DOMMatrixReadOnly(style.transform);
    return {
      translateX: matrix.m41, // m41 holds the translateX value
      translateY: matrix.m42, // m42 holds the translateY value
    };
  }
  updateContainerHeight() {
    if (this.fakeScrollbar?.dragging) return;
    const assignedElementCount = this.innerSlot.assignedElements({
      flatten: true,
    }).length;
    if (assignedElementCount !== this.numOfItems) return;
    if (this.pauseUpdate) return;
    this.containerHeight = parseFloat(this.containerComputedStyle.height);
  }

  containerResize() {
    this.containerClientWidth = parseFloat(this.containerComputedStyle.width);
    this.updateContainerHeight();
  }

  dimensionChangedCB(e: Event) {
    this.scrollTop = 0;
    if (!this.ft) return;
    const evt = e as CustomEvent;
    let element = evt.detail.target as MissingDimensionReporter;
    const index = parseInt(element.dataset['pageIndex']!);
    if (index > this.items.length - 1) {
      return;
    }

    if (element.isPage) {
      this.onPageResize(index, element);
    } else {
      this.onElementResize(index, element);
    }
  }
  slowScrollBy(delta = 0, byPassTransitions = false) {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      this.dispatchEvent(new CustomEvent('scroll-stopped'));
      this.scrolling = false;
    }, this.scrollWaitTime);
    this.updateMemoryWithNewHeights();

    this.dispatchEvent(new CustomEvent('scrolling'));
    this.scrolling = true;
    if (byPassTransitions) {
      this.classList.add('by-pass');
    } else {
      this.classList.remove('by-pass');
    }
    this.localScrollY = this.translateY !== '' ? -parseFloat(this.translateY) : 0;
    this.localScrollY += delta;
    const pageTop = this.startIndex === 0 ? 0 : this.ft!.getCumulativeHeight(this.startIndex - 1);
    this.globalScrollY = pageTop + this.localScrollY;
    // Correction to not pull up beyond known limits
    const roundedGlobalScrollY = Math.min(
      Math.max(0, this.globalScrollY),
      this.virtualScrollHeight - this.clientHeight,
    );
    const excessGlobalDelta = roundedGlobalScrollY - this.globalScrollY;
    this.localScrollY -= excessGlobalDelta;
    this.globalScrollY = roundedGlobalScrollY;
    this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
    const firstIndex = this.ft!.findIndexOfPixel(this.globalScrollY);
    const cumulativePreviousHeight =
      firstIndex !== 0 ? this.ft!.getCumulativeHeight(firstIndex - 1) : 0;
    const calculatedTranslateY = -(this.globalScrollY - cumulativePreviousHeight);
    if (this.pauseUpdate) {
      this.accumulatedDelta += delta;
      this.container.style.setProperty(`--translateY`, `${-this.localScrollY}px`);
      return;
    }
    if (firstIndex !== this.startIndex) {
      this.container.style.setProperty('--translateY', `${-this.localScrollY}px`);
      this.pauseUpdate = true;
      this.classList.add('by-pass');
      this.startIndex = firstIndex;
      this.pendingViewTranslate = `${calculatedTranslateY}px`;

      if (this.recoveryTimeout) {
        clearTimeout(this.recoveryTimeout);
      }
      this.recoveryTimeout = setTimeout(() => {
        if (this.pauseUpdate) {
          console.warn('Recovery: Angular took > 500ms. Forcing setView.');
          this.setView();
        }
      }, 500); // 500ms is a safe "user frustration" threshold

      this.dispatchLoadData();
      this.updateComplete.then(() => {
        this.setView();
      });
    } else {
      this.translateY = `${calculatedTranslateY}px`;
    }
  }

  updateTotalVirtualHeight() {
    if (this.ft && this.fakeScrollbar) {
      const lastItemIndex = this.items.length - 1;
      this.virtualScrollHeight = this.ft.getCumulativeHeight(lastItemIndex);
      this.fakeScrollbar.targetScrollHeight = this.virtualScrollHeight;
      this.globalScrollY = Math.min(
        Math.max(0, this.globalScrollY),
        this.virtualScrollHeight - this.clientHeight,
      );
    }
  }
  addNewData(type: 'append' | 'prepend', newItems: typeof this.items) {
    if (!this.ft) return;
    this.updateMemoryWithNewHeights();
    const newDataTotalLength = newItems.length;
    const oldDataTotalLength = this.items.length;
    const addedCount = newDataTotalLength - oldDataTotalLength;

    if (addedCount <= 0) return;

    // 1. Prepare the new rawHeights array
    const newRawHts = new Float64Array(newDataTotalLength);

    if (type === 'append') {
      // Copy OLD measured heights (the ones with the extra 68,023px)
      newRawHts.set(this.rawHeights);
      // Fill the NEW empty space at the end
      newRawHts.fill(this.defaultHeight, oldDataTotalLength);
    } else {
      // Fill NEW space at the start
      newRawHts.fill(this.defaultHeight, 0, addedCount);
      // Shift OLD measured heights to the right
      newRawHts.set(this.rawHeights, addedCount);
    }

    // 2. Sync references
    this.rawHeights = newRawHts;
    this.items = newItems;

    // 3. Rebuild the Tree from scratch (O(N))
    this.ft.initAll(this.rawHeights);

    // // 4. Handle WhatsApp Scroll Correction for Prepend
    // if (type === "prepend") {
    //   const addedPixelHeight = addedCount * this.defaultHeight;
    //   this.scroller.scrollTo(this.scroller.scrollTop + addedPixelHeight);
    // }
    // this.dataShift = true;
    // setTimeout(() => {
    this.updateMemoryWithNewHeights();
    this.updateTotalVirtualHeight();
    this.setScrollStateFromCurrentView();
    this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
    // this.slowScrollBy(1);
    // }, 1000);
  }
  goToPageIndex(pageIndex: number) {
    if (this.ft) {
      const requiredPageIndex = Math.min(Math.max(0, pageIndex), this.rawHeights.length - 1);
      if (pageIndex < 0) {
        console.warn(
          'pageIndex provided is less than min page-index of 0. Therefore showing page of pageIndex=0',
        );
      } else if (pageIndex > this.rawHeights.length - 1) {
        console.warn(
          `pageIndex provided is greater than max page-index of ${this.rawHeights.length - 1}. Therefore showing page of pageIndex=${this.rawHeights.length - 1} `,
        );
      }
      const scrollTop =
        requiredPageIndex === 0 ? 0 : this.ft.getCumulativeHeight(requiredPageIndex - 1);
      this.jumpToScrollTop(scrollTop);
    }
  }

  override jumpToScrollTop(
    scrollTop: number,
    setInternalFakeScrollbarPosition = true,
    dispatchEvent = true,
  ) {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.classList.add('by-pass');
    this.scrollTop = 0;
    const clampedScrollTop = Math.min(
      Math.max(0, scrollTop),
      this.virtualScrollHeight - this.clientHeight,
    );
    this.classList.add('by-pass');
    this.pauseUpdate = false;
    this.scrolling = true;
    this.globalScrollY = clampedScrollTop;
    this.setScrollTopAndTransform(clampedScrollTop, dispatchEvent);
    if (setInternalFakeScrollbarPosition) {
      this.fakeScrollbar?.setToScrollTop(clampedScrollTop);
    }
  }
  getCurrentScrollTop() {
    return this.globalScrollY;
  }

  tillPainted() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  async tillStable(elements: Element[]) {
    await this.tillPainted();
    // Get all animations (including CSS transitions) for all nodes in the slot
    const allAnimations = elements.flatMap((el) => el.getAnimations({ subtree: true }));
    // Wait for every single animation's "finished" promise to resolve
    if (allAnimations.length) {
      await Promise.allSettled(allAnimations.map((anim) => anim.finished));
    }
  }

  async allStable(elementsToCheckAnimationEnd: Element[] = []) {
    // 2. Wait for the "Browser Paint" (ensure elements are rendered)
    await this.tillPainted();
    // 3. Wait for all active CSS Transitions/Animations to finish

    const assignedNodes = this.missingDimensionReporters
      ? Array.from(this.missingDimensionReporters)
      : [];
    await this.tillStable([...elementsToCheckAnimationEnd, this.container, ...assignedNodes]);
  }
  private hostResize() {
    this.hostClientHeight = this.clientHeight;
  }
  private onFakeScrollbarDragging() {
    if (this.fakeScrollbar) {
      this.onPowerScroll(this.fakeScrollbar);
    }
  }
  private onFakeScrollbarDragStop() {
    this.updateMemoryWithNewHeights();
    this.setScrollStateFromCurrentView();

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      this.scrolling = false;
    }, this.scrollWaitTime);
    this.dispatchEvent(new CustomEvent('scroll-stopped'));
  }
  private onFakeScrollbarDragRelease() {
    this.updateMemoryWithNewHeights();
    this.setScrollStateFromCurrentView();
    this.fakeScrollbar?.setToScrollTop(this.globalScrollY);

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      this.scrolling = false;
    }, this.scrollWaitTime);
    this.dispatchEvent(new CustomEvent('scroll-stopped'));
  }
  setScrollStateFromCurrentView(localScrollY?: number) {
    this.classList.add('by-pass');
    this.localScrollY = localScrollY || this.getComputedLocalScrollY();
    this.globalScrollY =
      (this.startIndex > 0 ? this.ft!.getCumulativeHeight(this.startIndex - 1) : 0) +
      this.localScrollY;
    this.globalScrollY = Math.min(
      Math.max(0, this.globalScrollY),
      this.virtualScrollHeight - this.clientHeight,
    );
    this.setScrollTopAndTransform(this.globalScrollY);
  }

  public updateMemoryWithNewHeights() {
    const entries = Object.entries(this.rawHeightUpdates);

    if (entries.length === 0) return;
    // 1. Process only the pages that actually changed
    if (!this.ft) return;
    for (const [indexStr, newHeight] of entries) {
      const index = parseInt(indexStr);

      // We only update if the height is actually different to save CPU
      if (this.rawHeights[index] !== newHeight) {
        // 2. The Fenwick Tree 'update' is O(log N) - very fast
        this.ft.update(index, newHeight);

        // 3. Keep your local cache in sync
        this.rawHeights[index] = newHeight;
      }
    }

    // 4. Clear the queue so we don't process the same updates twice
    this.rawHeightUpdates = {};

    // 5. Update the scrollable area height
    this.updateTotalVirtualHeight();
    this.refreshTheView();
  }

  public getCurrentPageIndex() {
    return this.ft?.findIndexOfPixel(this.globalScrollY);
  }
  public getPageIndexForScrollTop(scrollTop: number) {
    return this.ft?.findIndexOfPixel(scrollTop);
  }

  protected override async onKeyDown(
    key: 'arrowdown' | 'arrowup' | 'pageup' | 'pagedown',
    increment: number,
  ) {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    switch (key) {
      case 'arrowup':
      case 'arrowdown':
        {
          this.repeatedScrollByPixels(increment);
        }
        break;
      case 'pagedown':
      case 'pageup': {
        this.slowScrollBy(increment, true);
      }
    }
  }
  protected override onKeyUp(key: typeof KeyboardEvent.prototype.key): void {
    if (this.tickFrame) {
      cancelAnimationFrame(this.tickFrame);
    }
    const lowerCaseKey = key.toLowerCase();
    if (lowerCaseKey === 'escape') {
      this.focus();
      this.blur();
      return;
    }
    if (
      lowerCaseKey !== 'pageup' &&
      lowerCaseKey !== 'pagedown' &&
      lowerCaseKey !== 'arrowup' &&
      lowerCaseKey !== 'arrowdown'
    ) {
      return;
    }
    if (lowerCaseKey === 'pageup' || lowerCaseKey === 'pagedown') {
      this.allStable().then(() => {
        if (this.pauseUpdate) return;
        if (this.tickFrame) {
          cancelAnimationFrame(this.tickFrame);
        }
      });
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      this.scrolling = false;
      this.updateMemoryWithNewHeights();
      // we dont need to update global scroll Y here since
      // its taken care of by the functions in keydown.
      this.dispatchEvent(new CustomEvent('scroll-stopped'));
    }, this.scrollWaitTime);
  }
  protected stableJumpTo(scrollTop: number) {
    if (this.tickFrame) {
      cancelAnimationFrame(this.tickFrame);
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.classList.add('by-pass');
    this.jumpToScrollTop(scrollTop);
  }
  onPageResize(index: number, element: MissingDimensionReporter) {
    if (this.ft) {
      const newPageHeight = element.height;
      if (!this.scrolling) {
        this.updateMemoryWithNewHeights();
        this.ft?.update(index, newPageHeight);
        this.updateTotalVirtualHeight();
        this.localScrollY = -parseFloat(this.translateY);
        this.globalScrollY =
          (this.startIndex > 0 ? this.ft!.getCumulativeHeight(this.startIndex - 1) : 0) +
          this.localScrollY;
        this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
        this.refreshTheView();
      } else {
        this.rawHeightUpdates[index] = newPageHeight;
        this.updateTotalVirtualHeight();
      }
    }
  }
  onElementResize(index: number, element: MissingDimensionReporter) {
    if (this.scrolling || this.fakeScrollbar?.dragging || this.dataShift) return;
    const delta = element.height - element.oldHeight;
    // if the bottom of the element before resize was above the
    // fold, then correct global scroll Y by adding the delta
    // Scroll Anchoring to keep view stable
    if (
      !this.pauseUpdate &&
      element.getBoundingClientRect().bottom - delta < 0 &&
      index <= this.startIndex
    ) {
      this.classList.add('by-pass');
      this.localScrollY = -parseFloat(this.translateY);
      this.localScrollY += delta;
      this.translateY = `${-this.localScrollY}px`;
      const dimensionDivSlottedElements = this.innerSlot.assignedElements({
        flatten: true,
      });
      this.allStable(dimensionDivSlottedElements).then(() => {
        this.updateMemoryWithNewHeights();
        this.globalScrollY =
          (this.startIndex > 0 ? this.ft!.getCumulativeHeight(this.startIndex - 1) : 0) +
          this.localScrollY;
        this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
      });
    }
  }
  getComputedLocalScrollY() {
    return -this.getTranslateXY({
      styleDeclaration: this.containerComputedStyle,
    }).translateY;
  }
  async runAfterAllTransitions(transitioners: HTMLElement[]) {
    for (let transitioner of transitioners) {
      if (transitioner) {
        await this.runAfterTransitions(transitioner);
      }
    }
  }
  jumpRelease() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      this.scrolling = false;
      this.updateMemoryWithNewHeights();
      this.setScrollStateFromCurrentView();
    }, this.scrollWaitTime);
  }
  onHostSwipe(e: Event) {
    this.scrollTop = 0;
    if (this.fakeScrollbar?.dragging) {
      e.preventDefault();
      return;
    }
    const swipeEvent = e as MissingSwipePhysicsEvent;
    const scrollDelta = -swipeEvent.detail.deltaY * this.swipeDeltaMultiplier;
    this.slowScrollBy(scrollDelta, true);
    this.dispatchEvent(new CustomEvent('scrolling'));
  }
  /**
   * This function is for highly accurate jumps to a particular
   * location. Accuracy means, this function will take into account the
   * updated heights after render and then correctly move to the required
   * scrollTop. Little computationally expensive as Lit has to
   * render twice, but if it is needed say to jump across
   * a 1000 pages like a page up or page down, this
   * function will come in handy.
   *
   * Make sure ` this.updateMemoryWithNewHeights();
   * this.setScrollStateFromCurrentView();` are called before
   * calling this function
   * @param scrollTop
   */
  public async accurateJumpTo(scrollTop: number) {
    if (!this.ft) return;
    if (this.jumpSkipping) return;
    this.updateMemoryWithNewHeights();
    if (!this.scrolling) {
      this.updateContainerHeight();
      this.localScrollY = this.getComputedLocalScrollY();
    }
    this.scrolling = true;
    const currentGlobalScrollY = this.getCurrentGlobalScrollYFromView();
    const increment = scrollTop - currentGlobalScrollY;
    const previousLocalScrollY = this.localScrollY;
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      this.scrolling = false;
      this.dispatchEvent(new CustomEvent('scroll-stopped'));
    }, this.scrollWaitTime);
    this.dispatchEvent(new CustomEvent('scrolling'));
    this.classList.add('by-pass');
    if (
      this.localScrollY + increment < 0 ||
      this.localScrollY + increment > this.containerHeight - this.clientHeight
    ) {
      this.jumpSkipping = true;
      const previousStartIndex = this.startIndex;
      this.listItems.forEach((listItem) => (listItem.style.opacity = '0'));
      // the first render
      this.stableJumpTo(this.globalScrollY + increment);
      await this.updateComplete;
      await this.waitForSlotChangedEvent();
      await this.allStable();
      await Promise.all(this.listItems.map((qE) => qE.isReady));
      this.updateMemoryWithNewHeights();
      // this time the updated new heights of where we landed is absorbed
      // into memory. now using that updated memory, jump to our
      // actual view.
      const finalRenderPreviousStartIndexCumulativePreviousIndexHeight =
        previousStartIndex !== 0 ? this.ft!.getCumulativeHeight(previousStartIndex - 1) : 0;
      const finalGlobalScrollYAfterRender =
        finalRenderPreviousStartIndexCumulativePreviousIndexHeight +
        previousLocalScrollY +
        increment;
      const newStartIndex = this.ft.findIndexOfPixel(finalGlobalScrollYAfterRender);
      this.stableJumpTo(finalGlobalScrollYAfterRender);
      await this.updateComplete;
      // on the 2nd render, the new index may or maynot be
      // the same index as the startindex.
      if (newStartIndex !== this.startIndex) {
        await this.waitForSlotChangedEvent();
      }
      await this.allStable();
      await Promise.all(this.listItems.map((qE) => qE.isReady));
      this.listItems.forEach((listItem) => (listItem.style.opacity = '1'));
      this.jumpSkipping = false;
      return;
    }
    this.localScrollY += increment;
    this.translateY = `${-this.localScrollY}px`;
    this.globalScrollY =
      (this.startIndex > 0 ? this.ft!.getCumulativeHeight(this.startIndex - 1) : 0) +
      this.localScrollY;
    this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
  }
  private createSlotChangedPromise() {
    return new Promise((resolve) => {
      this.slotChangedResolve = resolve;
    });
  }
  private async waitForSlotChangedEvent() {
    await this.createSlotChangedPromise();
  }
  private getCurrentGlobalScrollYFromView() {
    const localScrollY = this.getComputedLocalScrollY();
    const globalScrollY =
      (this.startIndex > 0 ? this.ft!.getCumulativeHeight(this.startIndex - 1) : 0) + localScrollY;
    return globalScrollY;
  }
  public setView() {
    if (!this.pendingViewTranslate) {
      this.pauseUpdate = false;
      return;
    }
    this.executeSetView();
  }
  executeSetView() {
    this.scrolling = true;
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      this.dispatchEvent(new CustomEvent('scroll-stopped'));
      this.scrolling = false;
    }, this.scrollWaitTime);
    this.classList.add('by-pass');
    this.localScrollY = -parseFloat(this.pendingViewTranslate!);
    if (this.accumulatedDelta) {
      this.localScrollY += this.accumulatedDelta;
      this.accumulatedDelta = 0;
    }
    let localScrollList = [0];

    for (let i = 1; i < this.numOfItems; ++i) {
      const consideringIndex = i + this.startIndex;
      localScrollList[i] = localScrollList[i - 1] + this.rawHeights[consideringIndex - 1];
    }
    this.container.style.setProperty(`--translateY`, `${-this.localScrollY}px`);
    this.slots?.forEach((slot, index) =>
      slot.style.setProperty(`--page-holder-translateY`, `${localScrollList[index]}px`),
    );
    this.translateY = `${-this.localScrollY}px`;
    this.pendingViewTranslate = undefined;
    const pageTop = this.startIndex === 0 ? 0 : this.ft!.getCumulativeHeight(this.startIndex - 1);
    this.globalScrollY = pageTop + this.localScrollY;
    this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
    this.pauseUpdate = false;
  }
  private dispatchLoadData() {
    const startIndexData = new Array(this.numOfItems)
      .fill(0)
      .map((_, index) => this.startIndex + index);
    const numOfTimesToRotate = this.startIndex % this.numOfItems;
    const reversedIndexData = [
      ...this.repeatRotate('backwards', numOfTimesToRotate, startIndexData),
    ];
    const slotData = new Array(this.numOfItems).fill(0).map((_, index) => index);
    const reversedSlotOrderData = [...this.repeatRotate('backwards', numOfTimesToRotate, slotData)];
    this.slotOrder = [...this.repeatRotate('forwards', numOfTimesToRotate, slotData)];
    this.dispatchEvent(
      new CustomEvent('load', {
        detail: {
          domOrderData: reversedIndexData,
          domOrder: reversedSlotOrderData,
        },
      }),
    );
  }
  public refreshTheView() {
    let localScrollList = [0];
    for (let i = 1; i < this.numOfItems; ++i) {
      const consideringIndex = i + this.startIndex;
      localScrollList[i] = localScrollList[i - 1] + this.rawHeights[consideringIndex - 1];
    }
    this.transformData = localScrollList;
  }
}
