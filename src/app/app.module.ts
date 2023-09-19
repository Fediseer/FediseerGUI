import { NgModule } from '@angular/core';
import {BrowserModule, provideClientHydration} from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {HttpClient, HttpClientModule} from "@angular/common/http";
import { NotificationComponent } from './components/notification/notification.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import {HttpLoaderFactory, SharedModule} from "./shared/shared.module";
import {ReactiveFormsModule} from "@angular/forms";
import {MissingTranslationHandler, TranslateCompiler, TranslateLoader, TranslateModule} from "@ngx-translate/core";
import {AppMissingTranslationsHandler} from "./shared/helper/app-missing-translation-handler";
import {TranslateMessageFormatCompiler} from "ngx-translate-messageformat-compiler";
import {SUPPORTED_LANGUAGES} from "./shared/injection/injection-tokens";

@NgModule({
  declarations: [
    AppComponent,
    NotificationComponent,
    HomePageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    SharedModule,
    ReactiveFormsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
      defaultLanguage: 'en',
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: AppMissingTranslationsHandler,
      },
      compiler: {
        provide: TranslateCompiler,
        useClass: TranslateMessageFormatCompiler,
      },
    }),
  ],
  providers: [
    provideClientHydration(),
    {
      provide: SUPPORTED_LANGUAGES,
      useValue: ['en', 'cs'],
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
