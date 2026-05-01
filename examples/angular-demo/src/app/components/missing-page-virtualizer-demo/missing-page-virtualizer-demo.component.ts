import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  ViewChild,
  NgZone,
  afterEveryRender,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonService } from '../../services/common.service.js';
import { Message } from '../../interfaces/message.interface.js';
import { Card } from '../card/card.component.js';

import '@missing-js/page-virtualizer';
import '@missing-js/dimension-reporter';
import '@missing-js/fake-scrollbar';
import { LoadEvent, MissingPageVirtualizer } from '@missing-js/page-virtualizer';
import { MissingFakeScrollbar } from '@missing-js/fake-scrollbar';
import { MissingDimensionReporter } from '@missing-js/dimension-reporter';

@Component({
  selector: 'missing-page-virtualizer-demo',
  templateUrl: './missing-page-virtualizer-demo.component.html',
  styleUrl: './missing-page-virtualizer-demo.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [Card],
})
export class MissingPageVirtualizerDemo implements AfterViewInit {
  hostElement;
  commonService = inject(CommonService);
  subscription?: Subscription;
  items: Message[][] = [];
  renderedArray: Message[][] = [];

  renderingArray?: { pageIndex: number; data: Message[]; outOfView: boolean }[];
  previousNextArray?: typeof this.renderingArray;
  startIndex = 0;
  @ViewChild('scroller') scrollRef?: ElementRef<MissingPageVirtualizer>;
  @ViewChild('fakeScrollbar') fakeScrollbarRef?: ElementRef<MissingFakeScrollbar>;
  @ViewChild('scrollArea') scrollAreaRef?: ElementRef<HTMLElement>;

  scroller?: MissingPageVirtualizer;
  fakeScrollbar?: MissingFakeScrollbar;
  scrollArea?: HTMLElement;

  currentPage: number = 0;
  startItem = 1;
  endItem = 10;
  bucketSize = 10;

  isLoading = false;
  currentChunk = 1;
  allPosts: Message[] = [];

  isScrolling = false;
  swipeDeltaFromInput = 1;
  private ngZone = inject(NgZone);
  protected numOfPg = 3;

  private scrollReset = false;
  private globalScrollY = 0;
  private previousScroll?: number;

  constructor(elRef: ElementRef) {
    this.hostElement = elRef.nativeElement;
  }

  ngAfterViewInit(): void {
    this.scroller = this.scrollRef?.nativeElement;
    this.fakeScrollbar = this.fakeScrollbarRef?.nativeElement;
    this.scrollArea = this.scrollAreaRef?.nativeElement;
    this.loadMore().then(() => {
      this.scroller?.updateComplete.then(() => {
        if (this.scroller && this.fakeScrollbar) {
          this.scroller.items = this.items;
          this.scroller.fakeScrollbar = this.fakeScrollbar;
          this.scroller.initialize();
          this.fakeScrollbar.classList.add('visible');
          requestAnimationFrame(this.loopCall.bind(this));
        }
      });
    });
  }
  loopCall() {
    // this.scroller!.slowScrollBy(1, true);
    // requestAnimationFrame(this.loopCall.bind);
  }

  refreshRenderedArrays(e: Event) {
    this.ngZone.runOutsideAngular(() => {
      const scrollerEvent = e as LoadEvent;
      const { indices } = scrollerEvent.detail;
      const tempArray1: typeof this.renderingArray = [];
      this.startIndex = indices[0];
      for (let i = indices[0]; i <= indices[1]; ++i) {
        tempArray1.push({
          pageIndex: i,
          data: i <= this.items.length - 1 ? this.items[i] : [],
          outOfView: false,
        });
      }
      if (this.startIndex === 0 && this.startIndex + this.numOfPg <= this.items.length - 1) {
        tempArray1.push({
          pageIndex: this.startIndex + this.numOfPg,
          data: this.items[this.startIndex + this.numOfPg],
          outOfView: true,
        });
      } else if (this.startIndex >= 1) {
        tempArray1.unshift({
          pageIndex: this.startIndex - 1,
          data: this.items[this.startIndex - 1],
          outOfView: true,
        });
        tempArray1.push({
          pageIndex: this.startIndex + this.numOfPg,
          data: this.items[this.startIndex + this.numOfPg],
          outOfView: true,
        });
      }
      this.ngZone.run(() => {
        this.renderingArray = tempArray1;
        requestAnimationFrame(() => {
          this.scroller!.setView();
        });
      });
    });
  }

  updatePageData(isScrolling: boolean) {
    if (this.scroller) {
      const currentScrollTop = this.scroller.getCurrentScrollTop();
      const startPageIndex = this.scroller.getPageIndexForScrollTop(currentScrollTop);
      const endPageIndex = this.scroller.getPageIndexForScrollTop(
        currentScrollTop + this.scroller.clientHeight,
      );
      if (typeof startPageIndex === 'number' && typeof endPageIndex === 'number') {
        this.startItem = startPageIndex * this.bucketSize + 1;
        this.endItem = endPageIndex * this.bucketSize + this.bucketSize;
      }
    }
    this.isScrolling = isScrolling;
  }

  loadMore() {
    // Capture the "Snapshot" before the new data arrives
    const previousLength = this.allPosts.length;
    this.isLoading = true;
    const url = `./posts_chunk_${this.currentChunk}.txt`;
    const loadMorePromise: Promise<void> = new Promise((resolve, reject) => {
      this.commonService.streamPosts(url).subscribe({
        next: (batch) => {
          // Direct push is the fastest way to populate the 'database'
          this.allPosts.push(...batch);
        },

        error: (err) => {
          this.isLoading = false;
          reject(err);
        },
        complete: () => {
          this.isLoading = true; // Still "working" while we bucket

          // 1. Get ONLY the newly arrived items
          const newData = this.allPosts.slice(previousLength);

          // 2. Turn only the new items into buckets
          const newBuckets = this.commonService.createBucketsOf(this.bucketSize, newData);

          // 3. Append new buckets to existing items
          // This preserves your previous 10,000 pages and adds the new ones
          this.items = [...this.items, ...newBuckets];

          this.isLoading = false;
          this.currentChunk++;

          console.log(`Success! Total items now: ${this.allPosts.length}`);
          console.log(`Total pages (buckets) now: ${this.items.length}`);
          console.log(this.allPosts);
          resolve();
        },
      });
    });
    return loadMorePromise;
  }
  loadMoreItems() {
    this.loadMore().then(() => {
      this.scroller?.addNewData('append', this.items);
      this.scroller?.allStable().then(() => {
        this.fakeScrollbar?.requestUpdate();
      });
    });
  }
  storePanelHeight(e: Event) {
    setTimeout(() => {
      const target = e.target as MissingDimensionReporter;
      this.hostElement.style.setProperty('--panel-height', `${target.height}px`);
    }, 0);
    e.stopPropagation();
  }
  adjustScrollerSwipeDelta(e: Event) {
    this.swipeDeltaFromInput = parseFloat((e.target as HTMLInputElement).value);
  }
  onAreaScroll(e: Event) {
    if (this.scrollReset) {
      this.scrollReset = false;
      return;
    }
    const el = e.target as HTMLElement;
    let direction: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    let diff = 0;
    if (this.previousScroll) {
      if (el.scrollTop > this.previousScroll) {
        direction = 'DOWN';
      } else if (el.scrollTop < this.previousScroll) {
        direction = 'UP';
      }
      diff = el.scrollTop - this.previousScroll;
    }
    this.previousScroll = el.scrollTop;
    this.scroller!.slowScrollBy(diff, true);

    if (el.scrollTop > 0.75 * (el.scrollHeight - el.clientHeight) && direction === 'DOWN') {
      this.scrollReset = true;
      el.scrollTop = 0.5 * el.scrollHeight - el.clientHeight;
      this.previousScroll = 0.5 * el.scrollHeight - el.clientHeight;
    }
    if (el.scrollTop < 0.25 * (el.scrollHeight - el.clientHeight) && direction === 'UP') {
      this.scrollReset = true;
      el.scrollTop = 0.5 * el.scrollHeight - el.clientHeight;
      this.previousScroll = 0.5 * el.scrollHeight - el.clientHeight;
    }
  }
  onScrollAreaPointerMove(e: PointerEvent) {
    if (!this.scrollArea) return;
    if (e.pointerType === 'mouse') {
      this.scrollArea.style.pointerEvents = 'none';
    } else {
      this.scrollArea.style.pointerEvents = 'all';
    }
  }
  disableScrollArea(e: Event) {
    if (!this.scrollArea) return;
    this.scrollArea.style.pointerEvents = 'none';
  }
  enableScrollArea(e: Event) {
    if (!this.scrollArea) return;
    this.scrollArea.style.pointerEvents = 'all';
  }
  clickElementBelow(e: MouseEvent) {
    if (!this.scrollArea) return;
    const elementsBelow = document.elementsFromPoint(e.clientX, e.clientY);
    const elementBelow = elementsBelow[2].closest('feed-card');
    if (elementBelow instanceof HTMLElement) {
      elementBelow.click();
      elementBelow.focus();
    }
    this.scrollArea.style.pointerEvents = 'none';
  }
  scrollTheScrollArea(e: WheelEvent) {
    if (!this.scrollArea) return;
    this.scrollArea.scrollTop += e.deltaY;
  }
}
