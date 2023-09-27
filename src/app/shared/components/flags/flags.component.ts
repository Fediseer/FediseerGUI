import {Component, Input} from '@angular/core';
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {InstanceFlag} from "../../../types/instance-flag";

@Component({
  selector: 'app-flags',
  templateUrl: './flags.component.html',
  styleUrls: ['./flags.component.scss']
})
export class FlagsComponent {
  protected readonly InstanceFlag = InstanceFlag;

  @Input({required: true}) instance: InstanceDetailResponse | null = null;
}
