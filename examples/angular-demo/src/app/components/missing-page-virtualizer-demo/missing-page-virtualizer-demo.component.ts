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

  constructor(elRef: ElementRef) {
    this.hostElement = elRef.nativeElement;
  }

  ngAfterViewInit(): void {
    this.scroller = this.scrollRef?.nativeElement;
    this.fakeScrollbar = this.fakeScrollbarRef?.nativeElement;

    this.subscription = this.commonService.getData().subscribe((data) => {
      this.items = this.commonService.createBucketsOf(this.bucketSize, data as Message[]);

      this.scroller?.updateComplete.then(() => {
        if (this.scroller && this.fakeScrollbar) {
          this.scroller.items = this.items;
          this.scroller.fakeScrollbar = this.fakeScrollbar;
          this.scroller.keyboardIncrements.pagedown = this.scroller.clientHeight * 10000;
          this.scroller.keyboardIncrements.pageup = -this.scroller.clientHeight * 10000;
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
  }
}
