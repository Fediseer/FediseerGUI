import {
  provideTransloco,
  TranslocoModule
} from '@ngneat/transloco';
import { NgModule } from '@angular/core';
import { TranslocoHttpLoader } from './shared/helper/transloco-loader';
import {environment} from "../environments/environment";

export const AVAILABLE_LANGUAGES = ['cs', 'en'];

@NgModule({
  exports: [ TranslocoModule ],
  providers: [
      provideTransloco({
        config: {
          availableLangs: AVAILABLE_LANGUAGES,
          defaultLang: 'en',
          reRenderOnLangChange: false,
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
