import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import { MyGuaranteesComponent } from './pages/my-guarantees/my-guarantees.component';
import {Guards} from "../guards/guards";
import { GuaranteeInstanceComponent } from './pages/guarantee-instance/guarantee-instance.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {SharedModule} from "../shared/shared.module";

const routes: Routes = [
  {
    path: 'my',
    component: MyGuaranteesComponent,
    canActivate: [Guards.isLoggedIn()],
  },
  {
    path: 'guarantee',
    component: GuaranteeInstanceComponent,
    canActivate: [Guards.isLoggedIn()],
  },
];

@NgModule({
  declarations: [
    MyGuaranteesComponent,
    GuaranteeInstanceComponent
  ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        FormsModule,
        ReactiveFormsModule,
        SharedModule,
    ]
})
export class GuaranteesModule { }
