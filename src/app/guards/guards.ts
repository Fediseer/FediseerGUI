import {CanActivateFn, Router, UrlSegmentGroup, UrlTree} from "@angular/router";
import {AuthenticationManagerService} from "../services/authentication-manager.service";
import {inject} from "@angular/core";
import {map} from "rxjs";

export class Guards {
  public static isLoggedIn(): CanActivateFn {
    return () => {
      const auth: AuthenticationManagerService = inject(AuthenticationManagerService);
      const router: Router = inject(Router);

      return auth.currentInstance.pipe(
        map (instance => {
          if (!instance.anonymous) {
            return true;
          }

          return router.createUrlTree(['/auth/login']);
        }),
      );
    };
  }

  public static isNotLoggedIn(): CanActivateFn {
    return () => {
      const auth: AuthenticationManagerService = inject(AuthenticationManagerService);
      const router: Router = inject(Router);

      return auth.currentInstance.pipe(
        map (instance => {
          if (instance.anonymous) {
            return true;
          }

          return router.createUrlTree(['/']);
        }),
      );
    };
  }
}
