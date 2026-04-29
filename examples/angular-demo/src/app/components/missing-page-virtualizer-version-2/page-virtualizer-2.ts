import { MissingFakeScrollbar } from '@missing-js/fake-scrollbar';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { FenwickTree } from './simple-fenwick-tree';
import { MissingDimensionReporter } from '@missing-js/dimension-reporter';

export type LoadEvent = CustomEvent<{
  indices: number[];
}>;

@customElement('page-virtualizer-2')
export class PageVirtualizer2 extends LitElement {
  @property({ type: Number, reflect: true, attribute: 'item-length' })
  public itemLength?: number;

  @property({ type: Number, reflect: true, attribute: 'start-index' })
  public startIndex = 0;

  @property({ type: Number, reflect: true, attribute: 'num-of-items' })
  public numOfItems = 3;

  @property({ type: Number, reflect: true, attribute: 'default-page-height' })
  public defaultPageHeight = 200 * 10;

  @state()
  private translateY: number = 0;

  @state()
  private virtualScrollHeight?: number;

  @state()
  private hostClientHeight?: number;

  @state()
  private rapidScrolling = false;

  @state()
  private slowScrolling = false;

  static override styles = css`
    :host {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      display: block;
      overflow-anchor: none;
    }
    .container {
      will-change: transform;
      position: absolute;
      top: 0;
      transform: translateY(var(--translateY));
      width: 100%;
    }
  `;

  public fakeScrollbar?: MissingFakeScrollbar;
  public globalPosition = 0;
  public howMuchWeAreFromTheStartPageTop = 0;

  private container!: HTMLElement;

  private previousIndexData: number[] = [];
  /**
   * State Variables
   */
  private initialized = false;
  private ft?: FenwickTree;
  private scrollTimer?: number;
  private scrollWaitTimeout = 2500;
  private rawHeights!: Float64Array;
  private rawHeightUpdates: Record<number, (typeof this.rawHeights)[0]> = {};
  private accumulatedChangeInViewPosition = 0;
  private initializingResize = true;
  private scrollAnchoring = false;
  private pendingTranslate?: number;
  private topBounds = 0;

  /**
   * Event Listeners and Observers
   */
  private dimensionChangedListener = this.onDimensionChanged.bind(this);
  private hostResizeListener = this.onHostResize.bind(this);
  private hostResizeObserver = new ResizeObserver(this.hostResizeListener);
  private fakeScrollbarDraggingListener = this.onFakeScrollbarDragging.bind(this);
  private fakeScrollbarDragReleaseListener = this.onFakeScrollbarDragRelease.bind(this);
  private fakeScrollbarDragStopListener = this.onFakeScrollbarDragRelease.bind(this);

  override render() {
    return html`
      <div class="container" style="--translateY:${this.translateY}px; ${this.pageStyles()}">
        <slot></slot>
      </div>
    `;
  }

  pageStyles() {
    return this.calculateStyles(this.numOfItems, this.startIndex);
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (
      (this.initialized && changedProperties.has('virtualScrollHeight')) ||
      changedProperties.has('hostClientHeight')
    ) {
      if (this.fakeScrollbar) {
        this.fakeScrollbar.targetScrollHeight = this.virtualScrollHeight!;
        this.fakeScrollbar.targetClientHeight = this.hostClientHeight!;
      }
    }
    super.updated(changedProperties);
  }

  public initialize() {
    this.initialized = true;
    this.updateComplete.then(() => {
      this.ft = new FenwickTree(this.itemLength!);
      this.rawHeights = new Float64Array(this.itemLength!).fill(this.defaultPageHeight);
      this.ft.initAll(this.rawHeights);
      this.updateTotalVirtualHeight();
      this.container = this.renderRoot.querySelector('.container')!;
      if (this.fakeScrollbar) {
        this.fakeScrollbar.addEventListener('dragging', this.fakeScrollbarDraggingListener);
        this.fakeScrollbar.addEventListener('dragRelease', this.fakeScrollbarDragReleaseListener);
        this.fakeScrollbar.addEventListener('drag-stopped', this.fakeScrollbarDragStopListener);
      }
      this.hostResizeObserver.observe(this);
      this.setToScrollTopDispatchAndTransform(this.globalPosition);
      this.setHeights();
      this.addEventListener('dimension-changed', this.dimensionChangedListener);
      setTimeout(() => {
        this.initializingResize = false;
      }, 2500);
      this.addEventListener('scroll', (e) => {
        this.scrollTop = 0;
      });
    });
  }
  private onPageDimensionChange(dimensionChangedPage: MissingDimensionReporter) {
    const pageIndex = parseInt(dimensionChangedPage.dataset['pageIndex']!);
    const oldHeight = this.ft!.getSingleHeight(pageIndex);
    const newHeight = dimensionChangedPage.height;
    const delta = newHeight - oldHeight;
    if (this.rawHeights[pageIndex] !== newHeight) {
      this.rawHeightUpdates[pageIndex] = dimensionChangedPage.height;
    }
    if (this.rapidScrolling || this.slowScrolling) {
      return;
    } else {
      this.ft?.update(pageIndex, dimensionChangedPage.height);
      this.updateMemoryWithNewHeights();
      // this.resetGlobalPositionBasedOnLocalOffset();
      // this.updateTotalVirtualHeight();
      // this.setToScrollTopDispatchAndTransform(this.globalPosition);
      // this.fakeScrollbar?.setToScrollTop(this.globalPosition);
    }
    this.setHeights();
  }
  private onHostResize() {
    this.updateComplete.then(() => {
      this.hostClientHeight = this.clientHeight;
    });
    this.topBounds = this.getBoundingClientRect().top;
  }

  private calculateStyles(numOfItems: number, startIndex: number) {
    let styleVariables = '';
    const totalLength = 2 * numOfItems - 1;
    const totalPrependedLength = totalLength - numOfItems;
    const viewStartIndex = Math.max(startIndex - totalPrependedLength, 0);
    const viewEndIndex = startIndex + numOfItems - 1;
    let indexCount = 0;
    for (let i = viewStartIndex; i <= viewEndIndex; ++i) {
      if (i < startIndex) {
        styleVariables += `--position-${indexCount + 1}:fixed; --top-${indexCount + 1}:99999px; --opacity-${indexCount + 1}:0; --z-index-${indexCount + 1}:-9999px;`;
      } else {
        styleVariables += `--position-${indexCount + 1}:absolute; --top-${indexCount + 1}:0px;--opacity-${indexCount + 1}:1;--z-index-${indexCount + 1}:0px;`;
      }
      ++indexCount;
    }
    return styleVariables;
  }
  onFakeScrollbarDragging() {
    requestAnimationFrame(() => {
      this.jumpToScrollTop(this.fakeScrollbar!.computedTargetScrollTop);
    });
  }
  onFakeScrollbarDragRelease() {
    this.updateMemoryWithNewHeights();
    this.resetGlobalPositionBasedOnLocalOffset();
    this.updateTotalVirtualHeight();
    this.fakeScrollbar?.setToScrollTop(this.globalPosition);
    this.setHeights();
    this.setScrollEndTimer();
  }
  jumpToScrollTop(scrollTop: number) {
    if (this.scrollAnchoring) {
      return;
    }
    this.rapidScrolling = true;
    this.setToScrollTopDispatchAndTransform(scrollTop);
    this.setHeights();
    this.setScrollEndTimer();
  }
  slowScrollBy(delta: number) {
    if (this.scrollAnchoring) {
      return;
    }
    this.updateMemoryWithNewHeights();
    this.howMuchWeAreFromTheStartPageTop += delta;
    this.resetGlobalPositionBasedOnLocalOffset();
    const newGlobalPosition = this.globalPosition + delta;
    this.jumpToScrollTop(newGlobalPosition);
    this.fakeScrollbar?.setToScrollTop(newGlobalPosition);
  }
  setToScrollTopDispatchAndTransform(scrollTop: number) {
    const clampedScrollTop = Math.min(
      Math.max(0, scrollTop),
      this.virtualScrollHeight! - this.clientHeight,
    );
    if (this.ft) {
      const firstIndex = this.ft?.findIndexOfPixel(clampedScrollTop);
      const cumulativePreviousHeight =
        firstIndex !== 0 ? this.ft.getCumulativeHeight(firstIndex - 1) : 0;
      const calculatedTranslateY = -(clampedScrollTop - cumulativePreviousHeight);
      this.howMuchWeAreFromTheStartPageTop = -calculatedTranslateY;

      this.startIndex = firstIndex;
      this.globalPosition = cumulativePreviousHeight + this.howMuchWeAreFromTheStartPageTop;
      this.dispatchLoadData();
    }
  }
  private dispatchLoadData() {
    const endIndex = Math.min(this.startIndex + this.numOfItems - 1, this.itemLength! - 1);
    const totalLength = 2 * this.numOfItems - 1;
    const totalPrependedLength = totalLength - this.numOfItems;
    const viewStartIndex = Math.max(this.startIndex - totalPrependedLength, 0);
    const indexData = Array.from(
      { length: endIndex - viewStartIndex + 1 },
      (_, index) => viewStartIndex + index,
    );
    if (indexData.toString().trim() !== this.previousIndexData.toString().trim()) {
      if (this.slowScrolling) {
        this.style.opacity = '0';
      }
      this.previousIndexData = indexData;
      this.pendingTranslate = -this.howMuchWeAreFromTheStartPageTop;
      this.dispatchEvent(
        new CustomEvent('load', {
          detail: {
            indices: this.previousIndexData,
          },
        }),
      );
      // requestAnimationFrame(() => {
      //   this.setView();
      // });
    } else {
      this.translateY = -this.howMuchWeAreFromTheStartPageTop;
    }
  }
  private setScrollEndTimer() {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    this.scrollTimer = setTimeout(() => {
      if (this.accumulatedChangeInViewPosition) {
        this.howMuchWeAreFromTheStartPageTop += this.accumulatedChangeInViewPosition;
        this.accumulatedChangeInViewPosition = 0;
        // this.resetGlobalPositionBasedOnLocalOffset();
        // this.setToScrollTopDispatchAndTransform(this.globalPosition);
      }
      this.updateMemoryWithNewHeights();
      this.updateTotalVirtualHeight();
      this.resetGlobalPositionBasedOnLocalOffset();
      this.fakeScrollbar?.setToScrollTop(this.globalPosition);
      this.rapidScrolling = false;
      this.slowScrolling = false;
      this.scrollAnchoring = false;
      if (this.fakeScrollbar) {
        this.fakeScrollbar.style.removeProperty('pointer-events');
        this.fakeScrollbar.style.removeProperty('cursor');
      }
      this.setHeights();
    }, this.scrollWaitTimeout);
  }
  private updateTotalVirtualHeight() {
    if (this.ft && this.fakeScrollbar) {
      const lastItemIndex = this.itemLength! - 1;
      this.virtualScrollHeight = this.ft.getCumulativeHeight(lastItemIndex);
      this.fakeScrollbar.targetScrollHeight = this.virtualScrollHeight;
      this.globalPosition = Math.min(
        Math.max(0, this.globalPosition),
        this.virtualScrollHeight - this.clientHeight,
      );
    }
  }
  private updateMemoryWithNewHeights() {
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
  private setHeights() {
    if (!this.ft) return;
    let runSum = 0;
    const totalLength = 2 * this.numOfItems - 1;
    const totalPrependedLength = totalLength - this.numOfItems;
    const viewStartIndex = Math.max(this.startIndex - totalPrependedLength, 0);
    const viewEndIndex = this.startIndex + this.numOfItems - 1;
    let indexCount = 0;
    for (let i = viewStartIndex; i <= viewEndIndex; ++i) {
      if (i < this.startIndex) {
        this.style.setProperty(`--translate-${indexCount + 1}`, `0`);
      } else {
        this.style.setProperty(`--translate-${indexCount + 1}`, `${runSum}px`);
        runSum += this.rawHeightUpdates[i] || this.ft.getSingleHeight(i);
      }
      ++indexCount;
    }
  }
  private resetGlobalPositionBasedOnLocalOffset() {
    if (!this.ft) return;
    const startIndex = this.startIndex;
    const pageTop = startIndex === 0 ? 0 : this.ft.getCumulativeHeight(startIndex - 1);
    this.globalPosition = pageTop + this.howMuchWeAreFromTheStartPageTop;
  }
  onDimensionChanged(e: Event) {
    const customEvent = e as CustomEvent<{ target: MissingDimensionReporter }>;
    const mDR = customEvent.detail.target;
    if (!mDR.isPage) {
      this.onElementDimensionChange(mDR);
    } else {
      this.onPageDimensionChange(mDR);
    }
  }
  private onElementDimensionChange(dimensionChangedElement: MissingDimensionReporter) {
    if (this.rapidScrolling || this.slowScrolling || this.initializingResize) {
      return;
    } else {
      const newHeight = dimensionChangedElement.height;
      const oldHeight = dimensionChangedElement.oldHeight;
      const delta = newHeight - oldHeight;
      const pageIndex = parseInt(dimensionChangedElement.dataset['pageIndex']!);
      // const page = dimensionChangedElement.closest('missing-dimension-reporter[is-page]');
      // const pageTop = page!.getBoundingClientRect().top;
      // const elementTop = dimensionChangedElement.getBoundingClientRect().top;
      // const offset= elementTop - pageTop;
      // const newBottom =
      if (
        dimensionChangedElement.getBoundingClientRect().bottom - this.topBounds - delta <
          this.topBounds &&
        pageIndex === this.startIndex
      ) {
        this.accumulatedChangeInViewPosition += delta;
        this.scrollAnchoring = true;
        if (this.fakeScrollbar) {
          this.fakeScrollbar.style.pointerEvents = 'none';
          this.fakeScrollbar.style.cursor = 'wait';
        }
        this.translateY = -(
          this.howMuchWeAreFromTheStartPageTop + this.accumulatedChangeInViewPosition
        );
        this.setScrollEndTimer();
      }
    }
  }
  setView() {
    if (typeof this.pendingTranslate === 'number') {
      // this.container.style.setProperty('--translateY', `${this.pendingTranslate}px`);
      this.translateY = this.pendingTranslate;
      this.style.opacity = '1';
      this.pendingTranslate = undefined;
    }
  }
}
