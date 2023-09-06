import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ToObservablePipe} from "./pipes/to-observable.pipe";



@NgModule({
  declarations: [
    ToObservablePipe,
  ],
  exports: [
    ToObservablePipe
  ],
  imports: [
    CommonModule
  ]
})
export class SharedModule { }
