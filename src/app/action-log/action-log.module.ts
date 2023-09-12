import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import { ActionLogComponent } from './pages/action-log/action-log.component';
import {SharedModule} from "../shared/shared.module";

const routes: Routes = [
  {
    path: 'log',
    component: ActionLogComponent,
  }
];

@NgModule({
  declarations: [
    ActionLogComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
  ]
})
export class ActionLogModule { }
