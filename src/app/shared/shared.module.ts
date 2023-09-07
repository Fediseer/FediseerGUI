import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ToObservablePipe} from "./pipes/to-observable.pipe";
import { LoaderComponent } from './components/loader/loader.component';
import { YesNoComponent } from './components/yes-no/yes-no.component';



@NgModule({
  declarations: [
    ToObservablePipe,
    LoaderComponent,
    YesNoComponent,
  ],
  exports: [
    ToObservablePipe,
    LoaderComponent,
    YesNoComponent
  ],
  imports: [
    CommonModule
  ]
})
export class SharedModule { }
