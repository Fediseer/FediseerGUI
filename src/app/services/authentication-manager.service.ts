import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {Instance} from "../user/instance";
import {AnonymousInstance} from "../user/anonymous-instance";
import {DatabaseService} from "./database.service";

@Injectable({
  providedIn: 'root'
})
export class AuthenticationManagerService {
  private readonly _currentInstance: BehaviorSubject<Instance>;

  constructor(
    private readonly database: DatabaseService,
  ) {
    const stored = database.getStoredInstance() ?? new AnonymousInstance();
    this._currentInstance = new BehaviorSubject<Instance>(stored);
  }

  public get currentInstance(): Observable<Instance> {
    return this._currentInstance;
  }

  public get currentInstanceSnapshot(): Instance {
    return this._currentInstance.value;
  }

  public set currentInstance(instance: Instance) {
    if (instance.anonymous) {
      this.database.removeStoredInstance();
    } else {
      this.database.setStoredInstance(instance);
    }
    this._currentInstance.next(instance);
  }

  public logout(): void {
    this.currentInstance = new AnonymousInstance();
  }
}
