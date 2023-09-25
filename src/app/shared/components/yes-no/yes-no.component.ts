import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-yes-no',
  templateUrl: './yes-no.component.html',
  styleUrls: ['./yes-no.component.scss']
})
export class YesNoComponent {
  @Input() yes: boolean | null = false;
  @Input() swapColors: boolean = false;
}
