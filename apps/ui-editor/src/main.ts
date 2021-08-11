// TODO: This is for JIT compilation. The whole approach to dynamic components
// in this project is based on JIT, and not AOT. Reconsider this.
import '@angular/compiler';
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { environment } from './environments/environment';
import { AppModule } from './app/app.module';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule);
