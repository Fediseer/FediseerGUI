import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomePageComponent} from "./pages/home-page/home-page.component";

const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'instances',
    loadChildren: () => import('./instances/instances.module').then(m => m.InstancesModule),
  },
  {
    path: 'endorsements',
    loadChildren: () => import('./endorsements/endorsements.module').then(m => m.EndorsementsModule),
  },
  {
    path: 'guarantees',
    loadChildren: () => import('./guarantees/guarantees.module').then(m => m.GuaranteesModule),
  },
  {
    path: 'censures',
    loadChildren: () => import('./censures/censures.module').then(m => m.CensuresModule),
  },
  {
    path: 'hesitations',
    loadChildren: () => import('./hesitations/hesitations.module').then(m => m.HesitationsModule),
  },
  {
    path: 'synchronize',
    loadChildren: () => import('./synchronization/synchronization.module').then(m => m.SynchronizationModule),
  },
  {
    path: 'glossary',
    loadChildren: () => import('./glossary/glossary.module').then(m => m.GlossaryModule),
  },
  {
    path: 'action-log',
    loadChildren: () => import('./action-log/action-log.module').then(m => m.ActionLogModule),
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabledBlocking'
})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
