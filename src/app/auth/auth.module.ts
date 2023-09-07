import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './pages/login/login.component';
import {RouterModule, Routes} from "@angular/router";
import {Guards} from "../guards/guards";
import { ClaimInstanceComponent } from './pages/claim-instance/claim-instance.component';
import {ReactiveFormsModule} from "@angular/forms";
import {SharedModule} from "../shared/shared.module";

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [Guards.isNotLoggedIn()],
  },
  {
    path: 'claim-instance',
    component: ClaimInstanceComponent,
    canActivate: [Guards.isNotLoggedIn()],
  },
];

@NgModule({
  declarations: [
    LoginComponent,
    ClaimInstanceComponent
  ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        ReactiveFormsModule,
        SharedModule,
    ]
})
export class AuthModule { }
