import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-redirect-whitelist',
  templateUrl: './redirect-whitelist.component.html',
  styleUrls: ['./redirect-whitelist.component.scss']
})
export class RedirectWhitelistComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
  ) {
  }

  public ngOnInit(): void {
    this.router.navigate(['/instances/safelisted'], {
      queryParams: this.activatedRoute.snapshot.queryParams,
    });
  }
}
