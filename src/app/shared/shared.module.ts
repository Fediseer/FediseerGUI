import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ToObservablePipe} from "./pipes/to-observable.pipe";
import { LoaderComponent } from './components/loader/loader.component';
import { YesNoComponent } from './components/yes-no/yes-no.component';
import { IterableEnumPipe } from './pipes/iterable-enum.pipe';



@NgModule({
  declarations: [
    ToObservablePipe,
    LoaderComponent,
    YesNoComponent,
    IterableEnumPipe,
  ],
  exports: [
    ToObservablePipe,
    LoaderComponent,
    YesNoComponent,
    IterableEnumPipe
  ],
  imports: [
    CommonModule
  ]
})
export class SharedModule { }
