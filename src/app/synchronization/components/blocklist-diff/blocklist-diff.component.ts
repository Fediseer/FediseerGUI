import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {InstanceDetailResponse} from "../../../response/instance-detail.response";
import {Resolvable} from "../../../types/resolvable";

export type OriginalToStringCallback<T> = ((instance: T) => string);
export type NewToStringCallback<T> = ((instance: T) => string);

@Component({
  selector: 'app-blocklist-diff',
  templateUrl: './blocklist-diff.component.html',
  styleUrls: ['./blocklist-diff.component.scss']
})
export class BlocklistDiffComponent<TOriginalInstance, TNewInstance> implements OnInit, OnChanges {

  @Input() originalList: TOriginalInstance[] = [];
  @Input() newList: TNewInstance[] = [];

  @Input() purgeMode: boolean = false;

  @Input() originalToStringCallback: OriginalToStringCallback<TOriginalInstance> = instance => <string>instance;
  @Input() newToStringCallback: NewToStringCallback<TNewInstance> = (instance) => (<InstanceDetailResponse>instance).domain;

  @Input() addedText: Resolvable<string> = 'This instance is only on Fediseer and not synchronized to your instance.';
  @Input() highlightRemoved: boolean = true;

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
