import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import { MyCensuresComponent } from './pages/my-censures/my-censures.component';
import { CensureInstanceComponent } from './pages/censure-instance/censure-instance.component';
import {ReactiveFormsModule} from "@angular/forms";
import {SharedModule} from "../shared/shared.module";
import { SynchronizeLemmyComponent } from './pages/synchronize-lemmy/synchronize-lemmy.component';
import {Guards} from "../guards/guards";

const routes: Routes = [
  {
    path: 'my',
    component: MyCensuresComponent,
    canActivate: [Guards.isLoggedIn()]
  },
  {
    path: 'censure',
    component: CensureInstanceComponent,
    canActivate: [Guards.isLoggedIn()]
  },
  {
    path: 'synchronize/lemmy',
    component: SynchronizeLemmyComponent,
    canActivate: [Guards.isLoggedIn()]
  }
];

@NgModule({
  declarations: [
    MyCensuresComponent,
    CensureInstanceComponent,
    SynchronizeLemmyComponent
  ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        ReactiveFormsModule,
        SharedModule,
    ]
})
export class CensuresModule { }
