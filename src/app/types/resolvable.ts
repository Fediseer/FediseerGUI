import {from, lastValueFrom, Observable, of} from "rxjs";

export type Resolvable<T> = Observable<T> | Promise<T> | T;

export function toPromise<T>(value: Resolvable<T>): Promise<T> {
  if (value instanceof Promise) {
    return value;
  }

  if (value instanceof Observable) {
    return lastValueFrom(value);
  }

  return Promise.resolve(value);
}

export function toObservable<T>(value: Resolvable<T>): Observable<T> {
  if (value instanceof Observable) {
    return value;
  }

  if (value instanceof Promise) {
    return from(value);
  }

  return of(value);
}
