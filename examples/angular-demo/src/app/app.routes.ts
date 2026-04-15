import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'experimental',
    loadComponent: () =>
      import('./components/missing-page-virtualizer-experimental/missing-page-virtualizer-demo.component').then(
        (c) => c.MissingPageVirtualizerDemo2,
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
