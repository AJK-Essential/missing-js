import { Component, Input, numberAttribute } from '@angular/core';

@Component({
  selector: 'feed-card',
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
})
export class Card {
  @Input({ alias: 'card-number', transform: numberAttribute }) cardNumber?: number;
  @Input({ alias: 'text-content' }) textContent?: string;
  @Input({ alias: 'reshares' }) reshares?: string;
  @Input() likes?: string;
  @Input() comments?: string;
  @Input() images?: string[];
}
