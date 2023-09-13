import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatNumber'
})
export class FormatNumberPipe implements PipeTransform {

  transform(value: string | number, digits: number | null = null): string {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: digits ?? undefined,
      maximumFractionDigits: digits ?? undefined,
    }).format(Number(value));
  }

}
