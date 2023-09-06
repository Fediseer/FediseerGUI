import {Instance} from "./instance";

export class AuthenticatedInstance implements Instance {
  public readonly anonymous: false = false;
  constructor(
    public readonly name: string,
    public readonly apiKey: string,
  ) {
  }
}
