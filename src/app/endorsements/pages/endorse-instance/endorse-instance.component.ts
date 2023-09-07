import {Component, OnInit} from '@angular/core';
import {TitleService} from "../../../services/title.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MessageService} from "../../../services/message.service";
import {FediseerApiService} from "../../../services/fediseer-api.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-endorse-instance',
  templateUrl: './endorse-instance.component.html',
  styleUrls: ['./endorse-instance.component.scss']
})
export class EndorseInstanceComponent implements OnInit {
  public form = new FormGroup({
    instance: new FormControl<string>('', [Validators.required]),
  });
  public loading: boolean = false;

  constructor(
    private readonly titleService: TitleService,
    private readonly messageService: MessageService,
    private readonly api: FediseerApiService,
    private readonly router: Router,
  ) {
  }
  public async ngOnInit(): Promise<void> {
    this.titleService.title = 'Endorse an instance';
  }

  public async doEndorse(): Promise<void> {
    if (!this.form.valid) {
      this.messageService.createError("The form is not valid, please make sure all fields are filled correctly.");
      return;
    }

    this.loading = true;
    this.api.endorseInstance(this.form.controls.instance.value!).subscribe(response => {
      if (!response.success) {
        this.messageService.createError(`There was an api error: ${response.errorResponse!.message}`);
        this.loading = false;
        return;
      }

      this.loading = false;
      this.router.navigateByUrl('/endorsements/my').then(() => {
        this.messageService.createSuccess(`${this.form.controls.instance.value} was successfully endorsed!`);
      });
    });
  }
}
