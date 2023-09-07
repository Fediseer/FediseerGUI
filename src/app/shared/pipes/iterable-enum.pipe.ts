import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'iterableEnum'
})
export class IterableEnumPipe implements PipeTransform {

  public transform(value: any): {key: string, value: string | number}[] {
    const allKeys = Object.keys(value);

    return allKeys.map(key => ({
      key: key,
      value: value[key],
    }));
  }

}
