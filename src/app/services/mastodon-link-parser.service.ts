import {Injectable} from '@angular/core';

interface Links {
  next?: string;
  prev?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MastodonLinkParserService {
  public getLinks(rawHeader: string): Links {
    const result: Links = {};

    const links = rawHeader.split(", ");
    for (const link of links) {
      const parts = link.split("; ");
      const url = parts[0].substring(1, parts[0].length - 1);
      const relation: 'next' | 'prev' = <'next' | 'prev'>parts[1].substring('rel="'.length, parts[1].length - 1);

      result[relation] = url;
    }

    return result;
  }
}
