import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Observable} from "rxjs";
import {TranslatorService} from "../../services/translator.service";

export enum NotificationType {
  Error,
  Success,
  Warning,
}

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent {
  protected readonly NotificationType = NotificationType;

  public isDeleted: boolean = false;

  @Input() kind: NotificationType = NotificationType.Success;
  @Input() message: string = '';

  @Output() deleted: Observable<void> = new EventEmitter<void>();

  constructor(
    private readonly translator: TranslatorService,
  ) {
  }


  public async remove(): Promise<void> {
    this.isDeleted = true;
    (this.deleted as EventEmitter<void>).next();
  }

  public get title(): Observable<string> {
    switch (this.kind) {
      case NotificationType.Error:
        return this.translator.get('notification.error');
      case NotificationType.Success:
        return this.translator.get('notification.success');
      case NotificationType.Warning:
        return this.translator.get('notification.warning');
    }
  }
}
