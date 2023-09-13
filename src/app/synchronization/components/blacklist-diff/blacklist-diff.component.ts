import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {InstanceDetailResponse} from "../../../response/instance-detail.response";

@Component({
  selector: 'app-blacklist-diff',
  templateUrl: './blacklist-diff.component.html',
  styleUrls: ['./blacklist-diff.component.scss']
})
export class BlacklistDiffComponent<TOriginalInstance, TNewInstance> implements OnInit, OnChanges {

  @Input() originalList: TOriginalInstance[] = [];
  @Input() newList: TNewInstance[] = [];

  @Input() purgeMode: boolean = false;

  @Input() originalToStringCallback: ((instance: TOriginalInstance) => string) = instance => <string>instance;
  @Input() newToStringCallback: ((instance: TNewInstance) => string) = (instance) => (<InstanceDetailResponse>instance).domain;

  public added: string[] = [];
  public removed: string[] = [];
  public originalListString: string[] = [];

  public async ngOnInit(): Promise<void> {
    this.ngOnChanges(<any>[]);
  }

  ngOnChanges(changes: SimpleChanges): void {
    const originalInstances = this.originalList.map(item => this.originalToStringCallback(item));
    const newInstances = this.newList.map(item => this.newToStringCallback(item));

    this.originalListString = originalInstances;

    this.added = newInstances.filter(item => !originalInstances.includes(item));
    this.removed = originalInstances.filter(item => !newInstances.includes(item));
  }
}
