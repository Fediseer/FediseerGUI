import {NgModule} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
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
import {InstanceMoveToListComponent} from './components/instance-move-to-list/instance-move-to-list.component';
import {ReactiveFormsModule} from "@angular/forms";
import {FlagsComponent} from './components/flags/flags.component';
import {InstanceLogoComponent} from './components/instance-logo/instance-logo.component';
import {LanguageNamePipe} from './pipes/language-name.pipe';


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
    InstanceMoveToListComponent,
    FlagsComponent,
    InstanceLogoComponent,
    LanguageNamePipe,
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
        InstanceMoveToListComponent,
        FlagsComponent,
        InstanceLogoComponent,
        LanguageNamePipe,
    ],
  imports: [
    CommonModule,
    NgbTooltip,
    TranslocoModule,
    NgbModule,
    TranslocoMarkupComponent,
    ReactiveFormsModule,
    NgOptimizedImage,
  ]
})
export class SharedModule { }
