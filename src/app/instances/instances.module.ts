import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import { WhitelistedInstancesComponent } from './pages/whitelisted-instances/whitelisted-instances.component';
import { InstanceDetailComponent } from './pages/instance-detail/instance-detail.component';
import { SuspiciousInstancesComponent } from './pages/suspicious-instances/suspicious-instances.component';
import {SharedModule} from "../shared/shared.module";
import { BlacklistedInstancesComponent } from './pages/blacklisted-instances/blacklisted-instances.component';

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
    path: 'blacklisted',
    component: BlacklistedInstancesComponent,
  },
  {
    path: 'detail/:instance',
    component: InstanceDetailComponent,
  }
];

@NgModule({
  declarations: [
    WhitelistedInstancesComponent,
    InstanceDetailComponent,
    SuspiciousInstancesComponent,
    BlacklistedInstancesComponent
  ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        SharedModule,
    ]
})
export class InstancesModule { }
