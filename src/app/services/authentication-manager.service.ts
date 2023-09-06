import { Injectable } from '@angular/core';
import {BehaviorSubject, catchError, map, Observable} from "rxjs";
import {Instance} from "../user/instance";
import {AnonymousInstance} from "../user/anonymous-instance";
import {FediseerApiService} from "./fediseer-api.service";
import {AuthenticatedInstance} from "../user/authenticated-instance";

@Injectable({
  providedIn: 'root'
})
export class AuthenticationManagerService {
  private readonly _currentInstance: BehaviorSubject<Instance>;

  constructor() {
    const stored = localStorage.getItem('instance');

    let instance: Instance;
    if (stored !== null) {
      instance = JSON.parse(stored);
    } else {
      instance = new AnonymousInstance();
    }

    this._currentInstance = new BehaviorSubject<Instance>(instance);
  }

  public get currentInstance(): Observable<Instance> {
    return this._currentInstance;
  }

  public get currentInstanceSnapshot(): Instance {
    return this._currentInstance.value;
  }

  public set currentInstance(instance: Instance) {
    if (instance.anonymous) {
      localStorage.removeItem('instance');
    } else {
      localStorage.setItem('instance', JSON.stringify(instance));
    }
    this._currentInstance.next(instance);
  }

  public logout(): void {
    this.currentInstance = new AnonymousInstance();
  }
}
