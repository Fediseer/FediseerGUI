import {Injectable} from '@angular/core';
import {HashMap, TranslocoService} from "@ngneat/transloco";
import {map, Observable, of, switchMap, tap} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class TranslatorService {
  private loadedLanguages: string[] = [];

  constructor(
    private readonly transloco: TranslocoService,
  ) {
  }

  public get(key: string, params?: HashMap): Observable<string> {
    return this.loadCurrentLanguage().pipe(
      map (() => this.transloco.translate(key, params)),
    );
  }

  private loadCurrentLanguage(): Observable<void> {
    return of(void 0).pipe(
      switchMap(() => {
        const language = this.transloco.getActiveLang();
        if (this.loadedLanguages.includes(language)) {
          return of(null);
        }

        return this.transloco.load(language);
      }),
      tap (result => {
        if (result === null) {
          return;
        }
        const language = this.transloco.getActiveLang();
        this.loadedLanguages.push(language);
      }),
      switchMap(() => {
        const language = <string>this.transloco.config.fallbackLang;
        if (this.loadedLanguages.includes(language)) {
          return of(void 0);
        }

        return this.transloco.load(language);
      }),
      tap (result => {
        if (result === null) {
          return;
        }
        const language = <string>this.transloco.config.fallbackLang;
        this.loadedLanguages.push(language);
      }),
      map(() => void 0),
    )
  }
}
