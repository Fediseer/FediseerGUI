import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'languageName'
})
export class LanguageNamePipe implements PipeTransform {

  transform(language: string, locale: string | null = null): string {
    locale ??= language;

    const intl = new Intl.DisplayNames(locale, {type: 'language'});
    return intl.of(language) ?? language;
  }

}
