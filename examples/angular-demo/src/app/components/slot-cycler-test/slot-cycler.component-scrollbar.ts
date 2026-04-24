import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  ViewChild,
  NgZone,
  afterEveryRender,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonService } from '../../services/common.service.js';
import { Message } from '../../interfaces/message.interface.js';
import { Card } from '../card/card.component.js';

import './slot-cycler-wc-scrollbar.js';
import '@missing-js/dimension-reporter';
import '@missing-js/fake-scrollbar';
import { LoadEvent, MissingPageVirtualizer } from './slot-cycler-wc-scrollbar.js';
import { MissingFakeScrollbar } from '@missing-js/fake-scrollbar';
import { MissingDimensionReporter } from '@missing-js/dimension-reporter';

@Component({
  selector: 'slot-cycler-demo',
  templateUrl: './slot-cycler.component-scrollbar.html',
  styleUrl: './slot-cycler.component-scrollbar.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlotCycler implements AfterViewInit {
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
  @ViewChild('container') containerRef?: ElementRef<HTMLElement>;
  @ViewChild('nextPrevious') nextPreviousRef?: ElementRef<HTMLElement>;
  scroller?: MissingPageVirtualizer;
  fakeScrollbar?: MissingFakeScrollbar;
  container?: HTMLElement;
  nextPrevious?: HTMLElement;

  currentPage: number = 0;
  startItem = 1;
  endItem = 10;
  bucketSize = 10;

  isLoading = false;
  currentChunk = 1;
  allPosts: Message[] = [];

  isScrolling = false;
  swipeDeltaFromInput = 1;
  translateY = '0px';
  private thisTempTranslateY = this.translateY;
  private ngZone = inject(NgZone);
  private newArrayRendering = false;
  protected pages = new Array(3).fill(0).map((_, index) => index);
  protected domOrder: Array<unknown> = [];
  protected itemsInPages = new Array(10).fill(0).map((_, index) => index);
  private bufferRenderTimeout?: number;
  protected numOfPg = 3;
  // private newPageRenderTime

  constructor(elRef: ElementRef) {
    this.hostElement = elRef.nativeElement;
  }

  ngAfterViewInit(): void {
    this.scroller = this.scrollRef?.nativeElement;
    this.fakeScrollbar = this.fakeScrollbarRef?.nativeElement;
    this.container = this.containerRef?.nativeElement;
    this.nextPrevious = this.nextPreviousRef?.nativeElement;
    this.loadMore().then(() => {
      if (this.scroller && this.fakeScrollbar) {
        this.scroller.items = this.items;
        this.scroller.fakeScrollbar = this.fakeScrollbar;
        this.scroller.initialize();
        this.fakeScrollbar.classList.add('visible');
      }
    });
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
        this.newArrayRendering = true;
        this.renderingArray = tempArray1;
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
      this.fakeScrollbar?.requestUpdate();
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
  focusedIn() {
    console.log('focusin called');
  }
  focused() {
    console.log('focus called');
  }
  hello() {
    console.log('pointer over fired');
  }
}
