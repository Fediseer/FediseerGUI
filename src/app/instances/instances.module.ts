import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import { WhitelistedInstancesComponent } from './pages/whitelisted-instances/whitelisted-instances.component';
import { InstanceDetailComponent } from './pages/instance-detail/instance-detail.component';
import { SuspiciousInstancesComponent } from './pages/suspicious-instances/suspicious-instances.component';
import {SharedModule} from "../shared/shared.module";
import { CensuredInstancesComponent } from './pages/censured-instances/censured-instances.component';
import {ReactiveFormsModule} from "@angular/forms";
import { EditOwnInstanceComponent } from './pages/edit-own-instance/edit-own-instance.component';
import {Guards} from "../guards/guards";
import { HesitatedInstancesComponent } from './pages/hesitated-instances/hesitated-instances.component';
import { SuspiciousInstanceDetailComponent } from './pages/suspicious-instance-detail/suspicious-instance-detail.component';
import { ResetInstanceTokenComponent } from './pages/reset-instance-token/reset-instance-token.component';

const routes: Routes = [
  {
    path: 'whitelisted',
    component: WhitelistedInstancesComponent,
  },
  {
    path: 'suspicious',
    component: SuspiciousInstancesComponent,
  },
  {
    path: 'censured',
    component: CensuredInstancesComponent,
  },
  {
    path: 'hesitated',
    component: HesitatedInstancesComponent,
  },
  {
    path: 'detail/:instance',
    component: InstanceDetailComponent,
  },
  {
    path: 'suspicious/detail/:instance',
    component: SuspiciousInstanceDetailComponent,
  },
  {
    path: 'edit/my',
    component: EditOwnInstanceComponent,
    canActivate: [Guards.isLoggedIn()],
  },
  {
    path: 'edit/reset-token',
    component: ResetInstanceTokenComponent,
    canActivate: [Guards.isLoggedIn()],
  },
];

@NgModule({
  declarations: [
    WhitelistedInstancesComponent,
    InstanceDetailComponent,
    SuspiciousInstancesComponent,
    CensuredInstancesComponent,
    EditOwnInstanceComponent,
    HesitatedInstancesComponent,
    SuspiciousInstanceDetailComponent,
    ResetInstanceTokenComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    ReactiveFormsModule,
  ]
})
export class InstancesModule { }
