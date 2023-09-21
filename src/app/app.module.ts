import {NgModule} from '@angular/core';
import {BrowserModule, provideClientHydration} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HttpClientModule} from "@angular/common/http";
import {NotificationComponent} from './components/notification/notification.component';
import {HomePageComponent} from './pages/home-page/home-page.component';
import {SharedModule} from "./shared/shared.module";
import {ReactiveFormsModule} from "@angular/forms";
import {TranslocoRootModule} from './transloco-root.module';
import {defaultTranslocoMarkupTranspilers, provideTranslationMarkupTranspiler} from "ngx-transloco-markup";
import {translocoMarkupRouterLinkRenderer} from "ngx-transloco-markup-router-link";
import {CodeTagTranspiler} from "./services/transloco-transpiler/code-tag.transpiler";
import {NgOptimizedImage} from "@angular/common";

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
        TranslocoRootModule,
        NgOptimizedImage,
    ],
  providers: [
    provideClientHydration(),
    defaultTranslocoMarkupTranspilers(),
    translocoMarkupRouterLinkRenderer(),
    provideTranslationMarkupTranspiler(CodeTagTranspiler),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
