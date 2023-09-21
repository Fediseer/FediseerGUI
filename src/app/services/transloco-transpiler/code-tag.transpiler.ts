import {BlockTranspiler, TranslationMarkupRenderer, TranslationMarkupRendererFactory} from "ngx-transloco-markup";
import {Injectable} from "@angular/core";

@Injectable({
  providedIn: 'root',
})
export class CodeTagTranspiler extends BlockTranspiler {
  constructor(
    private readonly rendererFactory: TranslationMarkupRendererFactory,
  ) {
    super('[code]', '[/code]');
  }

  protected createRenderer(childRenderers: TranslationMarkupRenderer[]): TranslationMarkupRenderer {
    return this.rendererFactory.createElementRenderer('code', childRenderers);
  }
}
