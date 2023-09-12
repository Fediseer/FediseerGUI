import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'formatDatetime'
})
export class FormatDatetimePipe implements PipeTransform {

  transform(value: string | Date): string {
    if (typeof value !== 'string') {
      value = value.toISOString();
    }
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

}
