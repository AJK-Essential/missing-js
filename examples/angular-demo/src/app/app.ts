import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MissingPageVirtualizerDemo } from './components/missing-page-virtualizer-demo/missing-page-virtualizer-demo.component';

@Component({
  selector: 'app-root',
  imports: [MissingPageVirtualizerDemo],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('');
}
