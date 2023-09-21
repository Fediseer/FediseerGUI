import {EventEmitter, Injectable} from '@angular/core';
import {Resolvable} from "../types/resolvable";
import {Observable} from "rxjs";

export enum MessageType {
  Success,
  Error,
  Warning,
}

export interface Message {
  type: MessageType;
  message: Resolvable<string>;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private emitter: EventEmitter<Message> = new EventEmitter<Message>();

  public create(message: Resolvable<string>, type: MessageType): void {
    this.emitter.next({
      message: message,
      type: type,
    });
  }

  public createError(message: Resolvable<string>): void {
    this.create(message, MessageType.Error);
  }

  public createSuccess(message: Resolvable<string>): void {
    this.create(message, MessageType.Success);
  }

  public createWarning(message: Resolvable<string>): void {
    this.create(message, MessageType.Warning);
  }

  public get messageReceived(): Observable<Message> {
    return this.emitter;
  }
}
