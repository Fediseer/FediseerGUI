import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ToObservablePipe} from "./pipes/to-observable.pipe";
import { LoaderComponent } from './components/loader/loader.component';



@NgModule({
  declarations: [
    ToObservablePipe,
    LoaderComponent,
  ],
    exports: [
        ToObservablePipe,
        LoaderComponent
    ],
  imports: [
    CommonModule
  ]
})
export class SharedModule { }
