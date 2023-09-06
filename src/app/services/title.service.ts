import {EventEmitter, Injectable} from '@angular/core';
import {Title} from "@angular/platform-browser";
import {Resolvable, toPromise} from "../types/resolvable";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class TitleService {
  public readonly titleChanged: Observable<string> = new EventEmitter<string>();

  constructor(
    private readonly angularTitle: Title,
  ) {
  }

  public get title(): string {
    return this.angularTitle.getTitle();
  }

  public set title(title: Resolvable<string>) {
    toPromise(title).then(title => {
      if (title === this.title) {
        return;
      }
      this.angularTitle.setTitle(title);
      (this.titleChanged as EventEmitter<string>).next(title);
    });
  }
}
