import {MissingTranslationHandler, MissingTranslationHandlerParams} from "@ngx-translate/core";

export class AppMissingTranslationsHandler extends MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams): any {
    const interpolation = params.interpolateParams;
    if (!interpolation) {
      return params.key;
    }

    const service = params.translateService;
    return service.parser.interpolate(params.key, interpolation);
  }
}
