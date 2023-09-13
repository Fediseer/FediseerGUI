import {Injectable} from '@angular/core';
import {MessageService, MessageType} from "./message.service";
import {ApiResponse} from "./fediseer-api.service";

@Injectable({
  providedIn: 'root'
})
export class ApiResponseHelperService {
  constructor(
    private readonly messageService: MessageService,
  ) {
  }

  public handleErrors(responses: ApiResponse<any>[], mode: MessageType = MessageType.Error): boolean {
    let hasErrors = false;
    for (const response of responses) {
      if (!response.success) {
        this.messageService.create(`There was an api error: ${response.errorResponse!.message}`, mode);
        hasErrors = true;
      }
    }

    return hasErrors;
  }
}
