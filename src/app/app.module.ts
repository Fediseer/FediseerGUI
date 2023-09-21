import { NgModule } from '@angular/core';
import {BrowserModule, provideClientHydration} from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {HttpClientModule} from "@angular/common/http";
import { NotificationComponent } from './components/notification/notification.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import {SharedModule} from "./shared/shared.module";
import {ReactiveFormsModule} from "@angular/forms";
import { TranslocoRootModule } from './transloco-root.module';
import {defaultTranslocoMarkupTranspilers, TranslocoMarkupComponent} from "ngx-transloco-markup";
import {translocoMarkupRouterLinkRenderer} from "ngx-transloco-markup-router-link";

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
    TranslocoMarkupComponent,
  ],
  providers: [
    provideClientHydration(),
    defaultTranslocoMarkupTranspilers(),
    translocoMarkupRouterLinkRenderer(),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
