import {provideTransloco, TranslocoModule} from '@ngneat/transloco';
import {NgModule} from '@angular/core';
import {TranslocoHttpLoader} from './shared/helper/transloco-loader';
import {environment} from "../environments/environment";


@NgModule({
  exports: [ TranslocoModule ],
  providers: [
      provideTransloco({
        config: {
          availableLangs: ['cs', 'de', 'en', 'pt'],
          defaultLang: 'en',
          reRenderOnLangChange: true,
          prodMode: environment.production,
          fallbackLang: 'en',
          missingHandler: {
            allowEmpty: true,
            useFallbackTranslation: true,
          }
        },
        loader: TranslocoHttpLoader
      }),
  ],
})
export class TranslocoRootModule {}
