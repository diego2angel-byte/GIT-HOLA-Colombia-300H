import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import Notiflix from 'notiflix';
import { AppModule } from './app/app.module';

// El panel de administracion usa Notiflix como variable global (Notiflix.Notify, .Confirm, .Report).
// Se registra desde el paquete npm, asi no depende de un CDN.
(window as any).Notiflix = Notiflix;

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
