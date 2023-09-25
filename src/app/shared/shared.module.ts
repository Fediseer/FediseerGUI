import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ToObservablePipe} from "./pipes/to-observable.pipe";
import {LoaderComponent} from './components/loader/loader.component';
import {YesNoComponent} from './components/yes-no/yes-no.component';
import {IterableEnumPipe} from './pipes/iterable-enum.pipe';
import {TomSelectDirective} from './directives/tom-select.directive';
import {TooltipComponent} from './components/tooltip/tooltip.component';
import {NgbModule, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {FormatDatetimePipe} from './pipes/format-date.pipe';
import {FormatPercentagePipe} from './pipes/format-percentage.pipe';
import {FormatNumberPipe} from './pipes/format-number.pipe';
import {TranslocoModule} from "@ngneat/transloco";
import {TranslocoMarkupComponent} from "ngx-transloco-markup";
import {InstanceStatusComponent} from "./components/instance-status/instance-status.component";


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
    InstanceStatusComponent,
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
    TranslocoModule,
    NgbModule,
    TranslocoMarkupComponent,
    InstanceStatusComponent,
  ],
  imports: [
    CommonModule,
    NgbTooltip,
    TranslocoModule,
    NgbModule,
    TranslocoMarkupComponent,
  ]
})
export class SharedModule { }
