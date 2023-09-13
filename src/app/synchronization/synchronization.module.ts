import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SynchronizeLemmyComponent} from "./pages/synchronize-lemmy/synchronize-lemmy.component";
import {RouterModule, Routes} from "@angular/router";
import {Guards} from "../guards/guards";
import {ReactiveFormsModule} from "@angular/forms";
import {SharedModule} from "../shared/shared.module";

const routes: Routes = [
  {
    path: 'lemmy',
    component: SynchronizeLemmyComponent,
    canActivate: [Guards.isLoggedIn()]
  },
];

@NgModule({
  declarations: [
    SynchronizeLemmyComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    SharedModule,
  ]
})
export class SynchronizationModule { }
