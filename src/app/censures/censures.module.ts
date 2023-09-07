import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import { MyCensuresComponent } from './pages/my-censures/my-censures.component';
import { CensorInstanceComponent } from './pages/censor-instance/censor-instance.component';
import {ReactiveFormsModule} from "@angular/forms";
import {SharedModule} from "../shared/shared.module";

const routes: Routes = [
  {
    path: 'my',
    component: MyCensuresComponent,
  },
  {
    path: 'censor',
    component: CensorInstanceComponent,
  }
];

@NgModule({
  declarations: [
    MyCensuresComponent,
    CensorInstanceComponent
  ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        ReactiveFormsModule,
        SharedModule,
    ]
})
export class CensuresModule { }
