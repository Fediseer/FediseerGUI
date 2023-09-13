import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatPercentage'
})
export class FormatPercentagePipe implements PipeTransform {

  transform(value: string | number, digits: number | null = null): string {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: digits ?? undefined,
      maximumFractionDigits: digits ?? undefined,
      style: 'percent',
    }).format(Number(value));
  }
}
