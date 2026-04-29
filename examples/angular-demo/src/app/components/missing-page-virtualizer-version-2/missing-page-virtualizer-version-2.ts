import {
  afterEveryRender,
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  NgZone,
  ViewChild,
} from '@angular/core';
import { CommonService } from '../../services/common.service';
import { Subscription } from 'rxjs';
import { Message } from '../../interfaces/message.interface';
import { PageVirtualizer2, LoadEvent } from './page-virtualizer-2';
import { MissingFakeScrollbar } from '@missing-js/fake-scrollbar';
import { MissingDimensionReporter } from '@missing-js/dimension-reporter';
import { Card } from '../card/card.component';
import './page-virtualizer-2';
import '@missing-js/fake-scrollbar';
import '@missing-js/dimension-reporter';
import { SwipeDeltaProvider } from './swipe-delta-provider';
import './swipe-delta-provider';

@Component({
  selector: 'missing-page-virtualizer-version-2',
  templateUrl: './missing-page-virtualizer-version-2.html',
  styleUrl: './missing-page-virtualizer-version-2.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [Card],
})
export class MissingPageVirtualizerVersion2 implements AfterViewInit {
  hostElement = inject(ElementRef).nativeElement;
  commonService = inject(CommonService);
  subscription?: Subscription;
  items: Message[][] = [];
  renderedArray: Message[][] = [];

  renderingArray?: { pageIndex: number; data: Message[] }[];
  previousNextArray?: typeof this.renderingArray;
  startIndex = 0;
  @ViewChild('scroller') scrollRef?: ElementRef<PageVirtualizer2>;
  @ViewChild('fakeScrollbar') fakeScrollbarRef?: ElementRef<MissingFakeScrollbar>;
  @ViewChild('scrollArea') scrollAreaRef?: ElementRef<HTMLElement>;
  @ViewChild('swipeDeltaProvider') swipeDeltaProviderRef?: ElementRef<SwipeDeltaProvider>;

  scroller?: PageVirtualizer2;
  fakeScrollbar?: MissingFakeScrollbar;
  scrollArea?: HTMLElement;
  swipeDeltaProvider?: SwipeDeltaProvider;

  currentPage: number = 0;
  startItem = 1;
  endItem = 10;
  bucketSize = 10;
  ngZone = inject(NgZone);

  allPosts: Message[] = [];
  isLoading: boolean = true;
  currentChunk = 1;
  isScrolling = false;

  swipeDeltaFromInput = 1;
  scrollReset = true;
  previousScroll?: number;

  ngAfterViewInit(): void {
    this.scroller = this.scrollRef?.nativeElement;
    this.fakeScrollbar = this.fakeScrollbarRef?.nativeElement;
    this.scrollArea = this.scrollAreaRef?.nativeElement;
    this.swipeDeltaProvider = this.swipeDeltaProviderRef?.nativeElement;
    this.loadMore().then(() => {
      this.scroller?.updateComplete.then(() => {
        if (this.scroller && this.fakeScrollbar && this.swipeDeltaProvider) {
          this.scroller.itemLength = this.items.length;
          this.scroller.fakeScrollbar = this.fakeScrollbar;
          this.scroller.initialize();
          setTimeout(() => {
            this.swipeDeltaProvider!.targetElement = this.scroller;
            this.swipeDeltaProvider!.swipeAreaHeight = 10000;
            this.swipeDeltaProvider!.swipeAreaWidth = this.scroller!.clientWidth;
            this.swipeDeltaProvider!.initialize();
          });
          //   this.fakeScrollbar.classList.add('visible');
          // requestAnimationFrame(this.loopCall.bind(this));
        }
      });
    });
  }
  loopCall() {
    // this.scroller!.style.opacity = '1';
    this.swipeDeltaProvider!.scrollTop += 5;
    // this.scroller!.slowScrollBy(5);
    requestAnimationFrame(this.loopCall.bind(this));
  }

  refreshRenderedArrays(e: Event) {
    this.ngZone.runOutsideAngular(() => {
      const scrollerEvent = e as LoadEvent;
      const { indices } = scrollerEvent.detail;
      // console.log(indices);
      const tempArray1: typeof this.renderingArray = [];
      this.startIndex = indices[0];
      for (let i = 0; i < indices.length; ++i) {
        const pageIndex = indices[i];
        tempArray1.push({
          pageIndex: pageIndex,
          data: pageIndex <= this.items.length - 1 ? this.items[pageIndex] : [],
        });
      }
      // this.ngZone.run(() => {
      this.renderingArray = tempArray1;
      // console.log(this.renderingArray);
      requestAnimationFrame(() => {
        this.scroller!.setView();
      });
    });
    // });
  }

  updatePageData(isScrolling: boolean) {
    if (this.scroller) {
      //   const currentScrollTop = this.scroller.getCurrentScrollTop();
      //   const startPageIndex = this.scroller.getPageIndexForScrollTop(currentScrollTop);
      //       const endPageIndex = this.scroller.getPageIndexForScrollTop(
      //         currentScrollTop + this.scroller.clientHeight,
      //       );
      //       if (typeof startPageIndex === 'number' && typeof endPageIndex === 'number') {
      //         this.startItem = startPageIndex * this.bucketSize + 1;
      //         this.endItem = endPageIndex * this.bucketSize + this.bucketSize;
      //       }
    }
    //     this.isScrolling = isScrolling;
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
      //   this.scroller?.addNewData('append', this.items);
      //   this.scroller?.allStable().then(() => {
      //     this.fakeScrollbar?.requestUpdate();
      //   });
    });
  }
  storePanelHeight(e: Event) {
    setTimeout(() => {
      const target = e.target as MissingDimensionReporter;
      this.hostElement.style.setProperty('--panel-height', `${target.height}px`);
    }, 0);
    e.stopPropagation();
  }

  moveTheScroller(e: Event) {
    const customEvent = e as CustomEvent;
    const diffY = customEvent.detail.diffY;
    this.scroller?.slowScrollBy(diffY);
  }
}
