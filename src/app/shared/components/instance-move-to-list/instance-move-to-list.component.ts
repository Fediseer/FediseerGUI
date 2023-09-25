import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CachedFediseerApiService} from "../../../services/cached-fediseer-api.service";
import {ApiResponse, FediseerApiService} from "../../../services/fediseer-api.service";
import {toPromise} from "../../../types/resolvable";
import {AuthenticationManagerService} from "../../../services/authentication-manager.service";
import {ApiResponseHelperService} from "../../../services/api-response-helper.service";
import {LockService} from "../../../services/lock.service";
import {FormControl, FormGroup} from "@angular/forms";
import {Observable} from "rxjs";
import {SuccessResponse} from "../../../response/success.response";
import {Router} from "@angular/router";

export enum InstanceList {
  None= 'none',
  Censures = 'censures',
  Hesitations = 'hesitations',
  Guarantees = 'guarantees',
}

export interface InstanceMoveEvent {
  instance: string;
  from: InstanceList;
  to: InstanceList;
}

@Component({
  selector: 'app-instance-move-to-list',
  templateUrl: './instance-move-to-list.component.html',
  styleUrls: ['./instance-move-to-list.component.scss']
})
export class InstanceMoveToListComponent implements OnInit {
  protected readonly InstanceList = InstanceList;

  private _instanceMoved: EventEmitter<InstanceMoveEvent> = new EventEmitter<InstanceMoveEvent>();
  private _instanceMoveFailed: EventEmitter<InstanceMoveEvent> = new EventEmitter<InstanceMoveEvent>();
  private _started: EventEmitter<void> = new EventEmitter<void>();

  @Input({required: true}) instance: string = '';
  @Input() originalList: InstanceList | null = null;

  @Output() get instanceMoved(): Observable<InstanceMoveEvent> {
    return this._instanceMoved;
  }

  @Output() get movingInstanceFailed(): Observable<InstanceMoveEvent> {
    return this._instanceMoveFailed;
  }

  @Output() get started(): Observable<void> {
    return this._started;
  }

  public loading: boolean = true;
  public form = new FormGroup({
    targetList: new FormControl<InstanceList>(InstanceList.None),
  });

  constructor(
    private readonly cachedApi: CachedFediseerApiService,
    private readonly api: FediseerApiService,
    private readonly authManager: AuthenticationManagerService,
    private readonly apiResponseHelper: ApiResponseHelperService,
    private readonly lockService: LockService,
    private readonly router: Router,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    const myInstance = this.authManager.currentInstanceSnapshot.name;
    if (this.originalList === null) {
      const lock = await this.lockService.acquire(`instance_move_to_list`);
      const responses = await Promise.all([
        toPromise(this.cachedApi.getHesitationsByInstances([myInstance])),
        toPromise(this.cachedApi.getCensuresByInstances([myInstance])),
        toPromise(this.cachedApi.getGuaranteesByInstance(myInstance)),
      ]);

      if (this.apiResponseHelper.handleErrors(responses)) {
        return;
      }
      const instanceResponses = responses.map(
        response => response.successResponse!.instances.map(
          instance => instance.domain,
        ),
      );

      this.originalList = InstanceList.None;
      if (instanceResponses[0].includes(this.instance)) {
        this.originalList = InstanceList.Hesitations;
      }
      if (instanceResponses[1].includes(this.instance)) {
        this.originalList = InstanceList.Censures;
      }
      if (instanceResponses[2].includes(this.instance)) {
        this.originalList = InstanceList.Guarantees;
      }

      await lock.free();
    }

    this.form.patchValue({
      targetList: this.originalList,
    });

    this.form.controls.targetList.valueChanges.subscribe(list => {
      if (list === null) {
        return;
      }

      this.moveInstance(this.originalList!, list);
    });

    this.loading = false;
  }

  private async moveInstance(originalList: InstanceList, targetList: InstanceList): Promise<void> {
    if (originalList === targetList) {
      return;
    }

    this._started.next();
    const removeResult: ApiResponse<SuccessResponse> = await this.removeFrom(originalList);

    if (!removeResult.success) {
      this._instanceMoveFailed.next({
        instance: this.instance,
        from: originalList,
        to: targetList,
      });
      this.form.patchValue({
        targetList: originalList,
      });
      return;
    }

    let moveResult: ApiResponse<SuccessResponse>
    switch (targetList) {
      case InstanceList.Guarantees:
        moveResult = await toPromise(this.api.guaranteeInstance(this.instance));
        this.cachedApi.getGuaranteesByInstance(this.authManager.currentInstanceSnapshot.name, {clear: true}).subscribe();
        break;
      case InstanceList.None:
        moveResult = {success: true, successResponse: {message: 'OK'}};
        break;
      case InstanceList.Hesitations:
        await this.router.navigate(['/hesitations/hesitate'], {queryParams: {instance: this.instance}});
        return;
      case InstanceList.Censures:
        await this.router.navigate(['/censures/censure'], {queryParams: {instance: this.instance}});
        return;
    }

    if (!moveResult.success) {
      this._instanceMoveFailed.next({
        instance: this.instance,
        from: originalList,
        to: targetList,
      });
      this.form.patchValue({
        targetList: originalList,
      });
      return;
    }

    this.originalList = targetList;
    this._instanceMoved.next({
      instance: this.instance,
      from: originalList,
      to: targetList,
    });
  }

  private async removeFrom(list: InstanceList): Promise<ApiResponse<SuccessResponse>> {
    const currentInstance = this.authManager.currentInstanceSnapshot.name;
    let removeResult: ApiResponse<SuccessResponse>;
    switch (list) {
      case InstanceList.Censures:
        removeResult = await toPromise(this.api.cancelCensure(this.instance));
        this.cachedApi.getCensuresByInstances([currentInstance], {clear: true}).subscribe();
        break;
      case InstanceList.Guarantees:
        removeResult = await toPromise(this.api.cancelGuarantee(this.instance));
        this.cachedApi.getGuaranteesByInstance(currentInstance, {clear: true}).subscribe();
        break;
      case InstanceList.Hesitations:
        removeResult = await toPromise(this.api.cancelHesitation(this.instance));
        this.cachedApi.getHesitationsByInstances([currentInstance], {clear: true}).subscribe();
        break;
      case InstanceList.None:
        removeResult = {success: true, successResponse: {message: 'OK'}};
        break;
    }

    return removeResult;
  }
}
