import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SynchronizeLemmyComponent} from "./pages/synchronize-lemmy/synchronize-lemmy.component";
import {RouterModule, Routes} from "@angular/router";
import {Guards} from "../guards/guards";
import {ReactiveFormsModule} from "@angular/forms";
import {SharedModule} from "../shared/shared.module";
import {SynchronizeMastodonComponent} from './pages/synchronize-mastodon/synchronize-mastodon.component';
import {MastodonOauthCallbackComponent} from './pages/mastodon-oauth-callback/mastodon-oauth-callback.component';
import {BlocklistDiffComponent} from './components/blocklist-diff/blocklist-diff.component';
import {FilterFormComponent} from './components/filter-form/filter-form.component';

const routes: Routes = [
  {
    path: 'lemmy',
    component: SynchronizeLemmyComponent,
    canActivate: [Guards.isLoggedIn()],
  },
  {
    path: 'mastodon',
    component: SynchronizeMastodonComponent,
    canActivate: [Guards.isLoggedIn()],
  },
  {
    path: 'mastodon/callback',
    component: MastodonOauthCallbackComponent,
    canActivate: [Guards.isLoggedIn()],
  },
];

@NgModule({
  declarations: [
    SynchronizeLemmyComponent,
    SynchronizeMastodonComponent,
    MastodonOauthCallbackComponent,
    BlocklistDiffComponent,
    FilterFormComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    SharedModule,
  ]
})
export class SynchronizationModule { }
