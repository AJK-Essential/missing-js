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
    path: '',
    loadComponent: () =>
      import('./components/missing-page-virtualizer-demo/missing-page-virtualizer-demo.component').then(
        (c) => c.MissingPageVirtualizerDemo,
      ),
  },
];
