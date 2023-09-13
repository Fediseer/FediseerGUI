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
    path: 'edit/my',
    component: EditOwnInstanceComponent,
    canActivate: [Guards.isLoggedIn()],
  }
];

@NgModule({
  declarations: [
    WhitelistedInstancesComponent,
    InstanceDetailComponent,
    SuspiciousInstancesComponent,
    CensuredInstancesComponent,
    EditOwnInstanceComponent,
    HesitatedInstancesComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    ReactiveFormsModule,
  ]
})
export class InstancesModule { }
