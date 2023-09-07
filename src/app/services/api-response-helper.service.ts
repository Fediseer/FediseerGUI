import {Injectable} from '@angular/core';
import {MessageService} from "./message.service";
import {ApiResponse} from "./fediseer-api.service";

@Injectable({
  providedIn: 'root'
})
export class ApiResponseHelperService {
  constructor(
    private readonly messageService: MessageService,
  ) {
  }

  public handleErrors(responses: ApiResponse<any>[]): boolean {
    let hasErrors = false;
    for (const response of responses) {
      if (!response.success) {
        this.messageService.createError(`There was an api error: ${response.errorResponse!.message}`);
        hasErrors = true;
      }
    }

    return hasErrors;
  }
}
