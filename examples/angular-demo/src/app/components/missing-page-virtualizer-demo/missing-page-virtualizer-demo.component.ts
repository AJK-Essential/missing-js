import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  ViewChild,
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

  renderingArray?: { pageIndex: number; data: Message[] }[];
  startIndex = 0;
  @ViewChild('scroller') scrollRef?: ElementRef<MissingPageVirtualizer>;
  @ViewChild('fakeScrollbar') fakeScrollbarRef?: ElementRef<MissingFakeScrollbar>;

  scroller?: MissingPageVirtualizer;
  fakeScrollbar?: MissingFakeScrollbar;

  currentPage: number = 0;
  startItem = 1;
  endItem = 10;
  bucketSize = 10;

  isLoading = false;
  currentChunk = 1;
  allPosts: Message[] = [];

  isScrolling = false;

  constructor(elRef: ElementRef) {
    this.hostElement = elRef.nativeElement;
  }

  ngAfterViewInit(): void {
    this.scroller = this.scrollRef?.nativeElement;
    this.fakeScrollbar = this.fakeScrollbarRef?.nativeElement;
    this.loadMore().then(() => {
      this.scroller?.updateComplete.then(() => {
        if (this.scroller && this.fakeScrollbar) {
          this.scroller.items = this.items;
          this.scroller.fakeScrollbar = this.fakeScrollbar;
          this.scroller.initialize();
          this.fakeScrollbar.classList.add('visible');
        }
      });
    });
  }

  refreshRenderedArrays(e: Event) {
    const scrollerEvent = e as LoadEvent;
    const { indices } = scrollerEvent.detail;
    const tempArray = [];
    for (let i = indices[0]; i <= indices[1]; ++i) {
      tempArray.push({ pageIndex: i, data: i <= this.items.length - 1 ? this.items[i] : [] });
    }
    this.renderingArray = tempArray;
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
    });
  }
}
