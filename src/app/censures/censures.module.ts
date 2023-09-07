import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import { MyCensuresComponent } from './pages/my-censures/my-censures.component';
import { CensureInstanceComponent } from './pages/censure-instance/censure-instance.component';
import {ReactiveFormsModule} from "@angular/forms";
import {SharedModule} from "../shared/shared.module";

const routes: Routes = [
  {
    path: 'my',
    component: MyCensuresComponent,
  },
  {
    path: 'censurer',
    component: CensureInstanceComponent,
  }
];

@NgModule({
  declarations: [
    MyCensuresComponent,
    CensureInstanceComponent
  ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        ReactiveFormsModule,
        SharedModule,
    ]
})
export class CensuresModule { }
