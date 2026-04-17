import { MissingFakeScrollbar } from "@missing-js/fake-scrollbar";
import { FenwickTree } from "@missing-js/math";
import { MissingDimensionReporter } from "@missing-js/dimension-reporter";
import {
  MissingSwipePhysicsEmitter,
  MissingSwipePhysicsEvent,
} from "@missing-js/swipe-physics-emitter";

export type LoadEventVanilla = CustomEvent<{
  indices: number[];
  translateY: string;
}>;

export class MissingPageVirtualizerVanilla extends HTMLElement {
  constructor() {
    super();
  }
  /**
   * Public properties
   */
  public items: unknown[] = [];
  public defaultHeight = 200;
  public numOfItems = 2;
  public uniqueSelector: string = "";
  public needsTransition = false;
  public fakeScrollbar?: MissingFakeScrollbar;
  public container?: HTMLElement;
  public nextPrevious?: HTMLElement;
  /**
   * Getters & Setters & Observers.
   */
  public get swipeScroll() {
    return this._swipeScroll;
  }
  public set swipeScroll(needsScroll: boolean) {
    if (this._swipeScroll === needsScroll) return;
    this._swipeScroll = needsScroll;
    this.onSwipeScrollChange();
  }
  private onSwipeScrollChange() {
    if (this._swipeScroll) {
      this.swipePhysics = new MissingSwipePhysicsEmitter();
      this.swipePhysics.friction = 0.96;
      this.swipePhysics.emitFor(this);
    } else {
      this.swipePhysics?.destroy();
    }
  }
  /**
   * States
   */
  protected globalScrollY = 0;
  private initialized = false;
  private virtualScrollHeight = this.clientHeight;
  private translateY = "";
  private startIndex = 0;
  private ft?: FenwickTree;
  private rawHeights!: Float64Array;
  private pauseUpdate = false;
  private scrolling = false;
  private localScrollY = 0;
  private rawHeightUpdates: Record<number, (typeof this.rawHeights)[0]> = {};
  private containerComputedStyle!: CSSStyleDeclaration;
  private scrollTimeout?: number;
  private scrollWaitTime = 250;
  private thisTop = 0;
  private containerClientWidth = this.clientWidth;
  private swipePhysics?: MissingSwipePhysicsEmitter;
  private _swipeScroll: boolean = false;
  /**
   * Class Method binders
   */
  private hostSwipeListener = this.onHostSwipe.bind(this);
  private fakeScrollbarDraggingListener =
    this.onFakeScrollbarDragging.bind(this);
  private fakeScrollbarDragReleaseListener =
    this.onFakeScrollbarDragRelease.bind(this);
  private fakeScrollbarDragStopListener =
    this.onFakeScrollbarDragStop.bind(this);
  private dimensionChangedListener = this.dimensionChangedCB.bind(this);
  /**
   * Observers
   */
  private containerResizeObserver = new ResizeObserver(
    this.containerResize.bind(this),
  );
  private hostResizeObserver = new ResizeObserver(this.hostResize.bind(this));
  /**
   * Public methods
   */

  connectedCallback() {
    // this.attachShadow({ mode: 'closed' });
  }
  initialize() {
    this.initialized = true;
    this.addEventListener("dimension-changed", this.dimensionChangedListener);
    if (this.fakeScrollbar) {
      this.fakeScrollbar.addEventListener(
        "dragging",
        this.fakeScrollbarDraggingListener,
      );
      this.fakeScrollbar.addEventListener(
        "dragRelease",
        this.fakeScrollbarDragReleaseListener,
      );
      this.fakeScrollbar.addEventListener(
        "drag-stopped",
        this.fakeScrollbarDragStopListener,
      );
    }
    this.ft = new FenwickTree(this.items.length);
    this.rawHeights = new Float64Array(this.items.length).fill(
      this.defaultHeight,
    );
    this.ft.initAll(this.rawHeights);
    this.updateTotalVirtualHeight();
    this.containerComputedStyle = getComputedStyle(this.container!);
    this.addEventListener("scroll", () => {
      this.scrollTop = 0;
    });
    this.setScrollTopAndTransform(this.globalScrollY);
    this.hostResizeObserver.observe(this);
    this.containerResizeObserver.observe(this.container!);
    this.addEventListener("swipe-detected", this.hostSwipeListener);
  }
  public addNewData(type: "append" | "prepend", newItems: typeof this.items) {
    if (!this.ft) return;
    this.updateMemoryWithNewHeights();
    const newDataTotalLength = newItems.length;
    const oldDataTotalLength = this.items.length;
    const addedCount = newDataTotalLength - oldDataTotalLength;
    if (addedCount <= 0) return;
    // 1. Prepare the new rawHeights array
    const newRawHts = new Float64Array(newDataTotalLength);
    if (type === "append") {
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
    this.updateTotalVirtualHeight();
    this.setScrollStateFromCurrentView();
    this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
  }
  /**
   * Private methods
   */
  private containerResize() {
    this.containerClientWidth = parseFloat(this.containerComputedStyle.width);
    if (this.nextPrevious) {
      this.nextPrevious.style.width = this.containerClientWidth + "px";
    }
  }
  private hostResize() {
    if (this.fakeScrollbar) {
      this.fakeScrollbar.targetClientHeight = this.clientHeight;
    }
    this.thisTop = this.getBoundingClientRect().top;
  }
  private onFakeScrollbarDragging() {}
  private onFakeScrollbarDragRelease() {}
  private onFakeScrollbarDragStop() {}
  private dimensionChangedCB(e: Event) {
    this.scrollTop = 0;
    if (!this.ft) return;
    const evt = e as CustomEvent;
    let element = evt.detail.target as MissingDimensionReporter;
    const index = parseInt(element.dataset["pageIndex"]!);
    if (index > this.items.length - 1) {
      return;
    }

    if (element.isPage) {
      this.onPageResize(index, element);
    } else {
      this.onElementResize(element);
    }
  }
  private onPageResize(index: number, element: MissingDimensionReporter) {
    if (this.ft) {
      const newPageHeight = element.height;
      if (!this.scrolling) {
        this.updateMemoryWithNewHeights();
        this.ft.update(index, newPageHeight);
        this.updateTotalVirtualHeight();
        this.localScrollY = -parseFloat(this.translateY);
        this.globalScrollY =
          (this.startIndex > 0
            ? this.ft!.getCumulativeHeight(this.startIndex - 1)
            : 0) + this.localScrollY;
        this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
      } else {
        this.rawHeightUpdates[index] = newPageHeight;
        this.updateTotalVirtualHeight();
      }
    }
  }
  private onElementResize(element: MissingDimensionReporter) {
    if (this.scrolling || this.fakeScrollbar?.dragging) return;
    const delta = element.height - element.oldHeight;
    // if the bottom of the element before resize was above the
    // fold, then correct global scroll Y by adding the delta
    // Scroll Anchoring to keep view stable
    if (
      !this.pauseUpdate &&
      element.getBoundingClientRect().bottom - delta < this.thisTop
    ) {
      this.classList.add("by-pass");
      this.localScrollY = -parseFloat(this.translateY);
      this.localScrollY += delta;
      this.translateY = `${-this.localScrollY}px`;
      this.updateMemoryWithNewHeights();
      this.globalScrollY =
        (this.startIndex > 0
          ? this.ft!.getCumulativeHeight(this.startIndex - 1)
          : 0) + this.localScrollY;
      this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
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
  private updateTotalVirtualHeight() {
    if (this.ft) {
      const lastItemIndex = this.items.length - 1;
      this.virtualScrollHeight = this.ft.getCumulativeHeight(lastItemIndex);
      if (this.fakeScrollbar) {
        this.fakeScrollbar.targetScrollHeight = this.virtualScrollHeight;
      }
      this.globalScrollY = Math.min(
        Math.max(0, this.globalScrollY),
        this.virtualScrollHeight - this.clientHeight,
      );
    }
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
        this.dispatchEvent(
          new CustomEvent("load", {
            detail: {
              indices: [this.startIndex, this.startIndex + this.numOfItems - 1],
              translateY: this.translateY,
            },
          }),
        );
      }
    }
  }

  private setScrollStateFromCurrentView(localScrollY?: number) {
    this.classList.add("by-pass");
    this.localScrollY = -parseFloat(this.translateY);
    this.globalScrollY =
      (this.startIndex > 0
        ? this.ft!.getCumulativeHeight(this.startIndex - 1)
        : 0) + this.localScrollY;
    this.globalScrollY = Math.min(
      Math.max(0, this.globalScrollY),
      this.virtualScrollHeight - this.clientHeight,
    );
    this.setScrollTopAndTransform(this.globalScrollY);
  }
  slowScrollBy(delta = 0, byPassTransitions = false) {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      this.scrolling = false;
    }, this.scrollWaitTime);
    this.updateMemoryWithNewHeights();

    this.dispatchEvent(new CustomEvent("scrolling"));
    this.scrolling = true;
    if (byPassTransitions) {
      this.classList.add("by-pass");
    } else {
      this.classList.remove("by-pass");
    }
    this.localScrollY =
      this.translateY !== "" ? -parseFloat(this.translateY) : 0;
    this.localScrollY += delta;
    const pageTop =
      this.startIndex === 0
        ? 0
        : this.ft!.getCumulativeHeight(this.startIndex - 1);
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
    const calculatedTranslateY = -(
      this.globalScrollY - cumulativePreviousHeight
    );

    if (firstIndex !== this.startIndex) {
      this.classList.add("by-pass");
      this.startIndex = firstIndex;
      this.translateY = `${calculatedTranslateY}px`;
    } else {
      this.translateY = `${calculatedTranslateY}px`;
    }
    this.setScrollTopAndTransform(this.globalScrollY);
  }
  private onHostSwipe(e: Event) {
    this.scrollTop = 0;
    if (this.fakeScrollbar?.dragging) {
      e.preventDefault();
      return;
    }
    const swipeEvent = e as MissingSwipePhysicsEvent;
    const scrollDelta = -swipeEvent.detail.deltaY;
    this.slowScrollBy(scrollDelta, true);
    this.dispatchEvent(new CustomEvent("scrolling"));
  }
}
customElements.define(
  "missing-page-virtualizer-vanilla",
  MissingPageVirtualizerVanilla,
);
