import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import { MyEndorsementsComponent } from './pages/my-endorsements/my-endorsements.component';
import { EndorseInstanceComponent } from './pages/endorse-instance/endorse-instance.component';
import {ReactiveFormsModule} from "@angular/forms";
import {Guards} from "../guards/guards";
import {SharedModule} from "../shared/shared.module";

const routes: Routes = [
  {
    path: 'my',
    component: MyEndorsementsComponent,
    canActivate: [Guards.isLoggedIn()],
  },
  {
    path: 'endorse',
    component: EndorseInstanceComponent,
    canActivate: [Guards.isLoggedIn()],
  }
];

@NgModule({
  declarations: [
    MyEndorsementsComponent,
    EndorseInstanceComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    SharedModule,
  ]
})
export class EndorsementsModule { }
