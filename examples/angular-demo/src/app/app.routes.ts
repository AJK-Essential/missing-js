import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'new-version',
    loadComponent: () =>
      import(
        `./components/missing-page-virtualizer-version-2/missing-page-virtualizer-version-2`
      ).then((c) => c.MissingPageVirtualizerVersion2),
  },

  {
    path: '',
    loadComponent: () =>
      import('./components/missing-page-virtualizer-demo/missing-page-virtualizer-demo.component').then(
        (c) => c.MissingPageVirtualizerDemo,
      ),
  },
];
