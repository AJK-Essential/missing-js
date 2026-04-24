import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'vanilla',
    loadComponent: () =>
      import('./components/missing-page-virtualizer-experimental-headless/missing-page-virtualizer-demo.component').then(
        (c) => c.MissingPageVirtualizerVanillaDemo,
      ),
  },
  {
    path: 'slot-cycler',
    loadComponent: () =>
      import('./components/slot-cycler-test/slot-cycler.component').then((c) => c.SlotCycler),
  },
  {
    path: 'slot-cycler-scrollbar',
    loadComponent: () =>
      import('./components/slot-cycler-test/slot-cycler.component-scrollbar').then(
        (c) => c.SlotCycler,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./components/missing-page-virtualizer-demo/missing-page-virtualizer-demo.component').then(
        (c) => c.MissingPageVirtualizerDemo,
      ),
  },
];
