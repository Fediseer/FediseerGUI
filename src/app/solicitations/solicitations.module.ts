import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import { ListSolicitationsComponent } from './pages/list-solicitations/list-solicitations.component';
import {Guards} from "../guards/guards";
import {SharedModule} from "../shared/shared.module";
import { CreateSolicitationComponent } from './pages/create-solicitation/create-solicitation.component';
import {ReactiveFormsModule} from "@angular/forms";

const routes: Routes = [
  {
    path: '',
    component: ListSolicitationsComponent,
  },
  {
    path: 'create',
    component: CreateSolicitationComponent,
    canActivate: [Guards.isLoggedIn()],
  }
];

@NgModule({
  declarations: [
    ListSolicitationsComponent,
    CreateSolicitationComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    ReactiveFormsModule,
  ]
})
export class SolicitationsModule { }
