import {Component, Input} from '@angular/core';
import {InstanceStatus} from "../../../types/instance-status";

@Component({
  selector: 'app-instance-status',
  templateUrl: './instance-status.component.html',
  styleUrls: ['./instance-status.component.scss']
})
export class InstanceStatusComponent {
  protected readonly InstanceStatus = InstanceStatus;

  @Input() status: InstanceStatus = InstanceStatus.Decommissioned;
}
