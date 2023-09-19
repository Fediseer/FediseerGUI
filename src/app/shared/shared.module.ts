import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ToObservablePipe} from "./pipes/to-observable.pipe";
import { LoaderComponent } from './components/loader/loader.component';
import { YesNoComponent } from './components/yes-no/yes-no.component';
import { IterableEnumPipe } from './pipes/iterable-enum.pipe';
import { TomSelectDirective } from './directives/tom-select.directive';
import { TooltipComponent } from './components/tooltip/tooltip.component';
import {NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import { FormatDatetimePipe } from './pipes/format-date.pipe';
import { FormatPercentagePipe } from './pipes/format-percentage.pipe';
import { FormatNumberPipe } from './pipes/format-number.pipe';
import {TranslateHttpLoader} from "@ngx-translate/http-loader";
import {HttpClient} from "@angular/common/http";
import {TranslateModule} from "@ngx-translate/core";
import { TranslateCutPipe } from './pipes/translate-cut.pipe';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, `./assets/translations/`, '.json');
}

@NgModule({
  declarations: [
    ToObservablePipe,
    LoaderComponent,
    YesNoComponent,
    IterableEnumPipe,
    TomSelectDirective,
    TooltipComponent,
    FormatDatetimePipe,
    FormatPercentagePipe,
    FormatNumberPipe,
    TranslateCutPipe,
  ],
  exports: [
    ToObservablePipe,
    LoaderComponent,
    YesNoComponent,
    IterableEnumPipe,
    TomSelectDirective,
    TooltipComponent,
    FormatDatetimePipe,
    FormatPercentagePipe,
    FormatNumberPipe,
    TranslateModule,
    TranslateCutPipe,
  ],
  imports: [
    CommonModule,
    NgbTooltip,
    TranslateModule,
  ]
})
export class SharedModule { }
