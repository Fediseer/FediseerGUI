import {Pipe, PipeTransform} from '@angular/core';
import {Resolvable, toObservable} from "../../types/resolvable";
import {Observable} from "rxjs";

@Pipe({
  name: 'toObservable'
})
export class ToObservablePipe<T> implements PipeTransform {

  transform(value: Resolvable<T>): Observable<T> {
    return toObservable(value);
  }

}
