import { html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { MissingFakeScrollbar } from "@missing-js/fake-scrollbar";
import { MissingDimensionReporter } from "@missing-js/dimension-reporter";
import { FenwickTree } from "@missing-js/math";

import { virtualiserKeyboardBase } from "./keyboard-base.js";

export type LoadEvent = CustomEvent<{
  indices: number[];
}>;

@customElement("missing-page-virtualizer")
export class MissingPageVirtualizer extends virtualiserKeyboardBase {
  @property({ type: Array })
  public items: unknown[] = [];

  @property({ type: String, reflect: true })
  public defaultHeight = 200 * 10;

  @property({ type: Number, reflect: true, attribute: "num-of-items" })
  public numOfItems = 2;

  @property({ type: String, reflect: true, attribute: "unique-selector" })
  public uniqueSelector = "";

  @property({
    type: Number,
    reflect: true,
    attribute: "arrow-click-scroll-delta",
  })
  public arrowClickScrollTopDelta = 40;

  @property({ type: Boolean, reflect: true, attribute: "needs-transition" })
  public needsTransition = false;

  @property({ type: Object })
  public fakeScrollbar?: MissingFakeScrollbar;

  @state()
  protected globalScrollY = 0;

  @state()
  private initialized = false;

  @state()
  private virtualScrollHeight = this.clientHeight;

  @state()
  private containerHeight = 100;

  @state()
  private translateY: string = "";

  @property({ type: Number, reflect: true })
  private startIndex = 0;

  @property({ type: Number, reflect: true })
  private hostClientHeight = this.clientHeight;

  private containerResizeObserver = new ResizeObserver(
    this.containerResize.bind(this),
  );
  private hostResizeObserver = new ResizeObserver(this.hostResize.bind(this));
  private fakeScrollbarDraggingListener =
    this.onFakeScrollbarDragging.bind(this);
  private fakeScrollbarDragReleaseListener =
    this.onFakeScrollbarDragRelease.bind(this);
  private fakeScrollbarDragStopListener =
    this.onFakeScrollbarDragStop.bind(this);
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

  static override styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      --transform-transition-time: 0.3s;
    }
    .container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: fit-content;
      transform: translateY(var(--translateY));
      will-change: transform;
      min-height: 150vh;
      /* Add this to force the browser to keep the buffer pages in GPU memory */
      backface-visibility: hidden;
    }
    :host(.smooth:not(.by-pass)) .container {
      transition: transform var(--transform-transition-time) ease;
    }
  `;

  override render() {
    return html`
      ${this.initialized
        ? html`
            <div
              class="container"
              style="--translateY:${this.translateY}"
              tabindex="0"
            >
              <slot
                @slotchange="${async (e: Event) => {
                  // TODO: See if this function can also be removed.
                  if (this.pauseUpdate) {
                    this.classList.add("by-pass");
                    // const slot = e.currentTarget as HTMLSlotElement;
                    const assignedNodes = this.innerSlot.assignedElements({
                      flatten: true,
                    });
                    // 2. Wait for the "Browser Paint" (ensure elements are rendered)
                    await this.tillPainted();

                    // 3. Wait for all active CSS Transitions/Animations to finish
                    await this.tillStable([this.container, ...assignedNodes]);
                    this.localScrollY = this.getComputedLocalScrollY();
                    this.updateMemoryWithNewHeights();
                    this.globalScrollY =
                      (this.startIndex > 0
                        ? this.ft!.getCumulativeHeight(this.startIndex - 1)
                        : 0) + this.localScrollY;
                    this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
                    this.pauseUpdate = false;
                    this.dispatchEvent(new CustomEvent("scroll-stopped"));
                    if (this.scrollTimeout) {
                      clearTimeout(this.scrollTimeout);
                    }
                    this.scrollTimeout = setTimeout(() => {
                      this.scrolling = false;
                    }, this.scrollWaitTime);
                  }
                }}"
              ></slot>
            </div>
          `
        : ""}
    `;
  }

  initialize() {
    this.initialized = true;
    this.addEventListener("dimension-changed", this.dimensionChangedListener);
    if (this.needsTransition) {
      this.classList.add("smooth");
    }
    this.updateComplete.then(() => {
      this.ft = new FenwickTree(this.items.length);
      this.rawHeights = new Float64Array(this.items.length).fill(
        this.defaultHeight,
      );
      this.ft.initAll(this.rawHeights);
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
      this.updateTotalVirtualHeight();
      const renderRoot = this.renderRoot;
      this.container = renderRoot.querySelector(".container") as HTMLElement;
      this.innerSlot = renderRoot.querySelector("slot") as HTMLSlotElement;
      this.containerComputedStyle = getComputedStyle(this.container);
      this.containerResizeObserver.observe(this.container as HTMLElement);
      this.hostResizeObserver.observe(this);
      this.dispatchEvent(
        new CustomEvent("load", {
          detail: {
            indices: [this.startIndex, this.startIndex + this.numOfItems - 1],
          },
        }),
      );
      this.addEventListener("scroll", () => {
        this.scrollTop = 0;
      });
      this.addEventListener("wheel", (e) => {
        this.slowScrollBy(e.deltaY);
      });
      this.setupKeyboardInteractions();
    });
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (
      this.fakeScrollbar &&
      (changedProperties.has("hostClientHeight") ||
        changedProperties.has("virtualScrollHeight"))
    ) {
      this.fakeScrollbar.targetClientHeight = this.hostClientHeight;
      this.fakeScrollbar.targetScrollHeight = this.virtualScrollHeight;
    }
  }

  override disconnectedCallback(): void {
    this.removeEventListener(
      "dimension-changed",
      this.dimensionChangedListener,
    );
    if (this.fakeScrollbar) {
      this.fakeScrollbar.removeEventListener(
        "dragging",
        this.fakeScrollbarDraggingListener,
      );
      this.fakeScrollbar.removeEventListener(
        "dragRelease",
        this.fakeScrollbarDragReleaseListener,
      );
      this.fakeScrollbar.removeEventListener(
        "drag-stopped",
        this.fakeScrollbarDragStopListener,
      );
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
    this.classList.add("by-pass");
    this.jumpToScrollTop(fakeScrollbar.computedTargetScrollTop);
    this.dispatchEvent(new CustomEvent("scrolling"));

    this.scrollTop = 0;
  }

  private setScrollTopAndTransform(scrollTop: number, dispatchEvent = true) {
    if (this.ft) {
      const firstIndex = this.ft?.findIndexOfPixel(scrollTop);
      const cumulativePreviousHeight =
        firstIndex !== 0 ? this.ft.getCumulativeHeight(firstIndex - 1) : 0;
      const calculatedTranslateY = -(scrollTop - cumulativePreviousHeight);

      this.translateY = `${calculatedTranslateY}px`;

      this.startIndex = firstIndex;
      if (dispatchEvent) {
        this.dispatchEvent(
          new CustomEvent("load", {
            detail: {
              indices: [this.startIndex, this.startIndex + this.numOfItems - 1],
            },
          }),
        );
      }
    }
  }
  getTranslateXY(
    data: { element: HTMLElement } | { styleDeclaration: CSSStyleDeclaration },
  ) {
    let style;
    if ("element" in data) {
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
    this.containerHeight = parseFloat(this.containerComputedStyle.height);
  }

  containerResize() {
    this.updateContainerHeight();
  }

  dimensionChangedCB(e: Event) {
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
  // TODO: See if this function can be eliminated in future updates
  slowScrollBy(delta = 0, byPassTransitions = false) {
    if (this.pauseUpdate) return;
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.updateMemoryWithNewHeights();
    this.updateContainerHeight();
    this.localScrollY = this.getComputedLocalScrollY();
    this.direction = delta > 0 ? "DOWN" : delta < 0 ? "UP" : "STABLE";
    this.dispatchEvent(new CustomEvent("scrolling"));
    this.scrolling = true;
    if (byPassTransitions) {
      this.classList.add("by-pass");
    } else {
      this.classList.remove("by-pass");
    }
    if (
      this.direction === "DOWN" &&
      this.localScrollY + delta > this.containerHeight - this.clientHeight &&
      this.startIndex + this.numOfItems <= this.items.length - 1
    ) {
      // new page has to be loaded below
      this.classList.add("by-pass");
      this.pauseUpdate = true;
      const heightOfFirstPage = this.querySelector(
        this.uniqueSelector,
      )!.getBoundingClientRect().height;
      const fixedBlockHeight = this.containerHeight - heightOfFirstPage;
      const offsetFromFixedBlock =
        this.localScrollY + delta - heightOfFirstPage;
      const extraOffset = offsetFromFixedBlock - fixedBlockHeight;
      const newIndex = this.startIndex + 1;
      const newTransformY = fixedBlockHeight + extraOffset;
      this.translateY = `${-newTransformY}px`;
      this.startIndex = newIndex;
      this.dispatchEvent(
        new CustomEvent("load", {
          detail: {
            indices: [this.startIndex, this.startIndex + this.numOfItems - 1],
          },
        }),
      );

      if (this.needsTransition && !byPassTransitions) {
        const container = this.container!;
        const animation = container.animate(
          [
            // Keyframes
            { transform: `translateY(${-newTransformY + delta}px)` }, // Start
            { transform: `translateY(${-newTransformY}px)` }, // End
          ],
          {
            // Timing options
            duration: 300,
            easing: "ease",
          },
        );
        animation.finished.then(() => {});
      }
      // }, 0);
    } else if (
      this.direction === "UP" &&
      this.localScrollY + delta <= 0 &&
      this.startIndex - 1 >= 0
    ) {
      // new page has to be loaded above
      this.classList.add("by-pass");
      this.pauseUpdate = true;
      const allPages = this.querySelectorAll(this.uniqueSelector);
      const lastPage = allPages[allPages.length - 1];
      const heightOfLastPage = lastPage!.getBoundingClientRect().height;
      const fixedBlockHeight = this.containerHeight - heightOfLastPage;
      const reverseScrollY = this.containerHeight - this.localScrollY;
      const offsetFromFixedBlock =
        reverseScrollY + Math.abs(delta) - heightOfLastPage;
      const extraOffset = offsetFromFixedBlock - fixedBlockHeight;
      const transformYFromBottom = fixedBlockHeight + extraOffset;
      this.translateY = `calc(-100% + ${transformYFromBottom}px)`;
      const newIndex = this.startIndex - 1;
      this.startIndex = newIndex;
      this.dispatchEvent(
        new CustomEvent("load", {
          detail: {
            indices: [this.startIndex, this.startIndex + this.numOfItems - 1],
          },
        }),
      );
      if (this.needsTransition && !byPassTransitions) {
        const container = this.container!;
        const animation = container.animate(
          [
            // Keyframes
            {
              transform: `translateY(calc(-100% + ${transformYFromBottom + delta}px))`,
            }, // Start
            {
              transform: `translateY(calc(-100% + ${transformYFromBottom}px))`,
            }, // End
          ],
          {
            // Timing options
            duration: 300,
            easing: "ease",
          },
        );
        animation.finished.then(() => {});
      }
    } else {
      // this is normal scrolling
      this.localScrollY += delta;
      this.localScrollY = Math.min(
        Math.max(0, this.localScrollY),
        this.containerHeight - this.clientHeight,
      );
      this.translateY = `${-this.localScrollY}px`;
      this.globalScrollY =
        (this.startIndex > 0
          ? this.ft!.getCumulativeHeight(this.startIndex - 1)
          : 0) + this.localScrollY;
      this.fakeScrollbar?.setToScrollTop(this.globalScrollY);
      this.allStable().then(() => {
        if (!this.pauseUpdate) {
          if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
          }
          this.scrollTimeout = setTimeout(() => {
            this.scrolling = false;
            this.dispatchEvent(new CustomEvent("scroll-stopped"));
          }, this.scrollWaitTime);
        }
      });
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
  addNewData(type: "append" | "prepend", newItems: typeof this.items) {
    const newLength = newItems.length;
    const currentLength = this.items.length;
    const newRawHts = new Float64Array(newLength).fill(this.defaultHeight);

    switch (type) {
      case "append":
        {
          newRawHts.set(this.rawHeights);
          this.rawHeights = newRawHts;
          this.ft?.initAll(this.rawHeights);
        }
        break;
      case "prepend":
        {
          const offset = newLength - currentLength;
          newRawHts.set(this.rawHeights, offset);
          this.rawHeights = newRawHts;
          this.ft?.initAll(this.rawHeights);
        }
        break;
    }
  }
  goToPageIndex(pageIndex: number) {
    if (this.ft) {
      const requiredPageIndex = Math.min(
        Math.max(0, pageIndex),
        this.rawHeights.length - 1,
      );
      if (pageIndex < 0) {
        console.warn(
          "pageIndex provided is less than min page-index of 0. Therefore showing page of pageIndex=0",
        );
      } else if (pageIndex > this.rawHeights.length - 1) {
        console.warn(
          `pageIndex provided is greater than max page-index of ${this.rawHeights.length - 1}. Therefore showing page of pageIndex=${this.rawHeights.length - 1} `,
        );
      }
      const scrollTop =
        requiredPageIndex === 0
          ? 0
          : this.ft.getCumulativeHeight(requiredPageIndex - 1);
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
    this.classList.add("by-pass");
    this.scrollTop = 0;
    const clampedScrollTop = Math.min(
      Math.max(0, scrollTop),
      this.virtualScrollHeight - this.clientHeight,
    );
    this.classList.add("by-pass");
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
    const allAnimations = elements.flatMap((el) =>
      el.getAnimations({ subtree: true }),
    );
    // Wait for every single animation's "finished" promise to resolve
    if (allAnimations.length) {
      await Promise.allSettled(allAnimations.map((anim) => anim.finished));
    }
  }

  async allStable(elementsToCheckAnimationEnd: Element[] = []) {
    // 2. Wait for the "Browser Paint" (ensure elements are rendered)
    await this.tillPainted();
    // 3. Wait for all active CSS Transitions/Animations to finish

    const assignedNodes = this.innerSlot.assignedElements({ flatten: true });
    await this.tillStable([
      ...elementsToCheckAnimationEnd,
      this.container,
      ...assignedNodes,
    ]);
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
    this.dispatchEvent(new CustomEvent("scroll-stopped"));
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
    this.dispatchEvent(new CustomEvent("scroll-stopped"));
  }
  setScrollStateFromCurrentView(localScrollY?: number) {
    this.classList.add("by-pass");
    this.localScrollY = localScrollY || this.getComputedLocalScrollY();
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

  protected override onKeyDown(
    key: "arrowdown" | "arrowup" | "pageup" | "pagedown",
    increment: number,
  ): void {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    switch (key) {
      case "arrowup":
      case "arrowdown":
        {
          this.scrolling = true;
          this.repeatedScrollByPixels(increment);
        }
        break;
      case "pagedown":
      case "pageup":
        {
          this.scrolling = true;
          requestAnimationFrame(() => {
            this.updateMemoryWithNewHeights();
            this.setScrollStateFromCurrentView();
            // this.runAfterAllSubTransitions().then(() => {
            // this.allStable().then(() => {
            // this.updateMemoryWithNewHeights();
            // this.setScrollStateFromCurrentView();
            this.stableJumpTo(this.globalScrollY + increment);
            // });
            // this.updateMemoryWithNewHeights();
            // this.setScrollStateFromCurrentView();
            // });
          });
        }
        this.dispatchEvent(new CustomEvent("scrolling"));
    }
  }
  protected override onKeyUp(key: typeof KeyboardEvent.prototype.key): void {
    if (this.tickFrame) {
      cancelAnimationFrame(this.tickFrame);
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    const lowerCaseKey = key.toLowerCase();
    if (lowerCaseKey === "pageup" || lowerCaseKey === "pagedown") {
      this.allStable().then(() => {
        if (this.tickFrame) {
          cancelAnimationFrame(this.tickFrame);
        }
        if (this.scrollTimeout) {
          clearTimeout(this.scrollTimeout);
        }
        this.scrollTimeout = setTimeout(() => {
          this.scrolling = false;
          this.updateMemoryWithNewHeights();
          this.setScrollStateFromCurrentView();
        }, this.scrollWaitTime);
      });
    }
    this.dispatchEvent(new CustomEvent("scroll-stopped"));
  }
  protected stableJumpTo(scrollTop: number) {
    if (this.tickFrame) {
      cancelAnimationFrame(this.tickFrame);
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.classList.add("by-pass");
    this.jumpToScrollTop(scrollTop);
  }
  onPageResize(index: number, element: MissingDimensionReporter) {
    if (this.ft) {
      const newPageHeight = element.height;
      if (!this.scrolling) {
        this.updateMemoryWithNewHeights();
        this.ft?.update(index, newPageHeight);
        this.updateTotalVirtualHeight();
        this.localScrollY = this.getComputedLocalScrollY();
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
  onElementResize(element: MissingDimensionReporter) {
    if (this.scrolling || this.fakeScrollbar?.dragging) return;
    const delta = element.height - element.oldHeight;
    // if the bottom of the element before resize was above the
    // fold, then correct global scroll Y by adding the delta
    // Scroll Anchoring to keep view stable
    if (
      !this.pauseUpdate &&
      element.getBoundingClientRect().bottom - delta < 0
    ) {
      this.classList.add("by-pass");
      this.localScrollY = this.getComputedLocalScrollY();
      this.localScrollY += delta;
      this.translateY = `${-this.localScrollY}px`;
      const dimensionDivSlottedElements = this.innerSlot.assignedElements({
        flatten: true,
      });
      this.allStable(dimensionDivSlottedElements).then(() => {
        this.updateMemoryWithNewHeights();
        this.globalScrollY =
          (this.startIndex > 0
            ? this.ft!.getCumulativeHeight(this.startIndex - 1)
            : 0) + this.localScrollY;
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
}
