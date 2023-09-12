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



@NgModule({
  declarations: [
    ToObservablePipe,
    LoaderComponent,
    YesNoComponent,
    IterableEnumPipe,
    TomSelectDirective,
    TooltipComponent,
    FormatDatetimePipe,
  ],
    exports: [
        ToObservablePipe,
        LoaderComponent,
        YesNoComponent,
        IterableEnumPipe,
        TomSelectDirective,
        TooltipComponent,
        FormatDatetimePipe
    ],
  imports: [
    CommonModule,
    NgbTooltip
  ]
})
export class SharedModule { }
