import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyHesitationsComponent } from './pages/my-hesitations/my-hesitations.component';
import {RouterModule, Routes} from "@angular/router";
import {SharedModule} from "../shared/shared.module";
import { HesitateOnInstanceComponent } from './pages/hesitate-on-instance/hesitate-on-instance.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { EditHesitationReasonsComponent } from './pages/edit-hesitation-reasons/edit-hesitation-reasons.component';
import {Guards} from "../guards/guards";

const routes: Routes = [
  {
    path: 'my',
    component: MyHesitationsComponent,
    canActivate: [Guards.isLoggedIn()],
  },
  {
    path: 'hesitate',
    component: HesitateOnInstanceComponent,
    canActivate: [Guards.isLoggedIn()],
  },
  {
    path: 'my/edit/:instance',
    component: EditHesitationReasonsComponent,
    canActivate: [Guards.isLoggedIn()],
  }
];

@NgModule({
  declarations: [
    MyHesitationsComponent,
    HesitateOnInstanceComponent,
    EditHesitationReasonsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class HesitationsModule { }
