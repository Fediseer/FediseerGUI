import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {SharedModule} from "../shared/shared.module";
import {ReactiveFormsModule} from "@angular/forms";
import {CreateEditRebuttalComponent} from './pages/create-edit-rebuttal/create-edit-rebuttal.component';
import {Guards} from "../guards/guards";

const routes: Routes = [
  {
    path: 'create/:sourceInstance',
    component: CreateEditRebuttalComponent,
    canActivate: [Guards.isLoggedIn()],
  },
  {
    path: 'edit/:sourceInstance',
    component: CreateEditRebuttalComponent,
    canActivate: [Guards.isLoggedIn()],
  }
];

@NgModule({
  declarations: [
    CreateEditRebuttalComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    ReactiveFormsModule,
  ]
})
export class RebuttalsModule { }
