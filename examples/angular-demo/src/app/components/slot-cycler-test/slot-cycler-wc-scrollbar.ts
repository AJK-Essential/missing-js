import { html, css } from 'lit';
import { customElement, property, queryAssignedElements, queryAll, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { MissingFakeScrollbar } from '@missing-js/fake-scrollbar';
import { MissingDimensionReporter } from '@missing-js/dimension-reporter';
import '@missing-js/dimension-reporter';
import { FenwickTree } from './simple-fenwick-tree';

import { virtualiserKeyboardBase } from './keyboard-base-scrollbar';

export type LoadEvent = CustomEvent<{
  indices: number[];
}>;

@customElement('missing-page-virtualizer-ntsc')
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

  @property({ type: Boolean })
  public defaultScrollAnchoring = true;

  @state()
  protected globalScrollY = 0;

  @state()
  private initialized = false;

  @state()
  private virtualScrollHeight = this.clientHeight;

  @property({ type: Number, reflect: true })
  private startIndex = 0;

  @property({ type: Number, reflect: true })
  private hostClientHeight = this.clientHeight;

  @queryAssignedElements()
  listItems!: Array<MissingDimensionReporter>;

  @queryAll('.container slot')
  slots?: NodeListOf<HTMLSlotElement>;

  @queryAll('missing-dimension-reporter')
  missingDimensionReporters?: Array<MissingDimensionReporter>;

  private hostResizeObserver = new ResizeObserver(this.hostResize.bind(this));
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
  private innerSlot!: HTMLSlotElement;
  private scrollTimeout?: number;
  private scrollWaitTime = 250;
  private accumulatedDelta = 0;
  private pendingViewTranslate?: string;
  private dataShift = false;
  private softSet = false;
  private previousScrollTop?: number;

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
      overflow: auto;
      --transform-transition-time: 0.3s;
      transition: opacity 0.3s ease;
    }
    :host::-webkit-scrollbar {
      display: none;
    }
    .container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: fit-content;
      /* Add this to force the browser to keep the buffer pages in GPU memory */
      backface-visibility: hidden;
      overflow: visible;
    }
  `;

  override render() {
    return html`
      ${this.initialized
        ? html`
            <div class="container">
              <slot></slot>
            </div>
          `
        : ''}
    `;
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
      this.hostResizeObserver.observe(this);
      this.addEventListener('scroll', (e) => {
        if (this.fakeScrollbar?.dragging) {
          return;
        }
        this.updateMemoryWithNewHeights();
        if (this.softSet) {
          e.preventDefault();
          return;
        }
        this.scrolling = true;
        this.previousScrollTop = this.scrollTop;
        this.dispatchEvent(new CustomEvent('scrolling'));

        if (this.localScrollY < this.scrollTop) {
          this.direction = 'DOWN';
        } else if (this.localScrollY > this.scrollTop) {
          this.direction = 'UP';
        } else {
          this.direction = 'STABLE';
        }
        this.localScrollY = this.scrollTop;
        if (this.ft) {
          const pageTop =
            this.startIndex === 0 ? 0 : this.ft.getCumulativeHeight(this.startIndex - 1);
          this.globalScrollY = pageTop + this.scrollTop;
          this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
          const needsToShift =
            (this.scrollTop < 0.25 * (this.scrollHeight - this.clientHeight) &&
              this.direction === 'UP') ||
            (this.scrollTop > 0.75 * (this.scrollHeight - this.clientHeight) &&
              this.direction === 'DOWN');
          if (needsToShift && this.direction === 'DOWN') {
            this.scrolling = true;
            const firstIndex = this.ft!.findIndexOfPixel(this.globalScrollY);
            const cumulativePreviousHeight =
              firstIndex !== 0 ? this.ft.getCumulativeHeight(firstIndex - 1) : 0;
            const calculatedTranslateY = -(this.globalScrollY - cumulativePreviousHeight);
            this.softSet = true;
            this.startIndex = firstIndex;
            this.pauseUpdate = true;
            this.style.opacity = '0';
            this.dispatchLoadData();
            this.updateComplete.then(() => {
              requestAnimationFrame(() => {
                this.style.opacity = '1';
              });
              const scrollTop = -calculatedTranslateY;
              this.scrollTop = scrollTop;
              this.softSet = false;
              const pageTop =
                this.startIndex === 0 ? 0 : this.ft!.getCumulativeHeight(this.startIndex - 1);
              this.globalScrollY = pageTop + this.scrollTop;
              this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
            });
          } else if (needsToShift && this.direction === 'UP' && this.startIndex !== 0) {
            this.scrolling = true;
            this.softSet = true;
            --this.startIndex;
            this.pauseUpdate = true;
            const calculatedScrolltop = this.scrollTop;
            const ht = this.ft!.getSingleHeight(this.startIndex);
            const transform = calculatedScrolltop + ht;
            this.style.opacity = '0';
            this.dispatchLoadData();
            this.updateComplete.then(() => {
              this.scrollTop = transform;
              this.style.opacity = '1';
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  this.container.style.removeProperty('height');
                  this.softSet = false;
                  const pageTop =
                    this.startIndex === 0 ? 0 : this.ft!.getCumulativeHeight(this.startIndex - 1);
                  this.globalScrollY = pageTop + this.scrollTop;
                  this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
                });
              });
            });
          }
        }
      });
      this.addEventListener('scrollend', (e) => {
        this.updateMemoryWithNewHeights();

        if (this.scrollTimeout) {
          clearTimeout(this.scrollTimeout);
        }
        this.scrollTimeout = setTimeout(() => {
          this.scrolling = false;
          this.softSet = false;
          this.pauseUpdate = false;
          const pageTop =
            this.startIndex === 0 ? 0 : this.ft!.getCumulativeHeight(this.startIndex - 1);
          this.globalScrollY = pageTop + this.scrollTop;
          this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
          this.dispatchEvent(new CustomEvent('scroll-stopped'));
        }, this.scrollWaitTime);
        if (this.softSet) {
          e.preventDefault();
          return;
        }
      });
      const scrollTop =
        this.startIndex === 0 ? 0 : this.ft.getCumulativeHeight(this.startIndex - 1);
      this.setScrollTopAndTransform(scrollTop);
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
  }

  override disconnectedCallback(): void {
    this.removeEventListener('dimension-changed', this.dimensionChangedListener);

    if (this.fakeScrollbar) {
      this.fakeScrollbar.removeEventListener('dragging', this.fakeScrollbarDraggingListener);
      this.fakeScrollbar.removeEventListener('dragRelease', this.fakeScrollbarDragReleaseListener);
      this.fakeScrollbar.removeEventListener('drag-stopped', this.fakeScrollbarDragStopListener);
    }
    this.hostResizeObserver.disconnect();
    super.disconnectedCallback();
  }

  private onPowerScroll(fakeScrollbar: MissingFakeScrollbar) {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.classList.add('by-pass');
    this.jumpToScrollTop(fakeScrollbar.computedTargetScrollTop);
    this.dispatchEvent(new CustomEvent('scrolling'));
  }

  private setScrollTopAndTransform(scrollTop: number, dispatchEvent = true) {
    if (this.ft) {
      const firstIndex = this.ft?.findIndexOfPixel(scrollTop);
      const cumulativePreviousHeight =
        firstIndex !== 0 ? this.ft.getCumulativeHeight(firstIndex - 1) : 0;
      const calculatedTranslateY = -(scrollTop - cumulativePreviousHeight);
      this.softSet = true;
      this.scrollTop = -calculatedTranslateY;
      this.startIndex = firstIndex;
      if (dispatchEvent) {
        this.dispatchLoadData();
      }
    }
  }

  private dimensionChangedCB(e: Event) {
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

  private updateTotalVirtualHeight() {
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

  public addNewData(type: 'append' | 'prepend', newItems: typeof this.items) {
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
  }

  public goToPageIndex(pageIndex: number) {
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

  public override jumpToScrollTop(
    scrollTop: number,
    setInternalFakeScrollbarPosition = true,
    dispatchEvent = true,
  ) {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.classList.add('by-pass');
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

  public getCurrentScrollTop() {
    return this.globalScrollY;
  }

  public tillPainted() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  public async tillStable(elements: Element[]) {
    await this.tillPainted();
    // Get all animations (including CSS transitions) for all nodes in the slot
    const allAnimations = elements.flatMap((el) => el.getAnimations({ subtree: true }));
    // Wait for every single animation's "finished" promise to resolve
    if (allAnimations.length) {
      await Promise.allSettled(allAnimations.map((anim) => anim.finished));
    }
  }

  public async allStable(elementsToCheckAnimationEnd: Element[] = []) {
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
      this.softSet = false;
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
      this.softSet = false;
      this.scrolling = false;
    }, this.scrollWaitTime);
    this.dispatchEvent(new CustomEvent('scroll-stopped'));
  }

  setScrollStateFromCurrentView(localScrollY?: number) {
    this.classList.add('by-pass');
    this.localScrollY = this.scrollTop;
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
  }

  public getCurrentPageIndex() {
    return this.ft?.findIndexOfPixel(this.globalScrollY);
  }
  public getPageIndexForScrollTop(scrollTop: number) {
    return this.ft?.findIndexOfPixel(scrollTop);
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

  public stableJumpTo(scrollTop: number) {
    if (this.tickFrame) {
      cancelAnimationFrame(this.tickFrame);
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.classList.add('by-pass');
    this.jumpToScrollTop(scrollTop);
  }

  private onPageResize(index: number, element: MissingDimensionReporter) {
    if (this.ft) {
      const newPageHeight = element.height;
      if (!this.scrolling) {
        this.updateMemoryWithNewHeights();
        this.ft?.update(index, newPageHeight);
        this.updateTotalVirtualHeight();
        this.globalScrollY =
          (this.startIndex > 0 ? this.ft!.getCumulativeHeight(this.startIndex - 1) : 0) +
          this.scrollTop;
        this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
      } else {
        this.rawHeightUpdates[index] = newPageHeight;
        this.updateTotalVirtualHeight();
      }
    }
  }

  private onElementResize(index: number, element: MissingDimensionReporter) {
    if (!this.defaultScrollAnchoring) return;
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
      this.softSet = true;
      this.scrollTop = this.previousScrollTop! + delta;
      this.previousScrollTop = this.scrollTop;
      const dimensionDivSlottedElements = this.innerSlot.assignedElements({
        flatten: true,
      });
      this.allStable(dimensionDivSlottedElements).then(() => {
        this.updateMemoryWithNewHeights();
        this.globalScrollY =
          (this.startIndex > 0 ? this.ft!.getCumulativeHeight(this.startIndex - 1) : 0) +
          this.scrollTop;
        this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
        this.softSet = true;

        if (this.scrollTimeout) {
          clearTimeout(this.scrollTimeout);
        }
        this.scrollTimeout = setTimeout(() => {
          this.softSet = false;
        }, this.scrollWaitTime);
      });
    }
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
    this.localScrollY = this.scrollTop;
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
    this.pendingViewTranslate = undefined;
    const pageTop = this.startIndex === 0 ? 0 : this.ft!.getCumulativeHeight(this.startIndex - 1);
    this.globalScrollY = pageTop + this.localScrollY;
    this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
    this.pauseUpdate = false;
  }
  private dispatchLoadData() {
    this.pauseUpdate = true;
    this.dispatchEvent(
      new CustomEvent('load', {
        detail: {
          indices: [this.startIndex, this.startIndex + this.numOfItems - 1],
        },
      }),
    );
  }
}
