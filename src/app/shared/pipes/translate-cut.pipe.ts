import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'translateCut'
})
export class TranslateCutPipe implements PipeTransform {

  public transform(value: string, index: number): string {
    const cutIndex = Number(index);
    const split: string[] | null = value ? value.split('|') : null;
    const phrase: string | null = split ? split[cutIndex] : null;
    return phrase ? phrase.trim() : '';
  }

}
