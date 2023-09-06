import {Instance} from "./instance";

export class AnonymousInstance implements Instance {
  public readonly anonymous: true = true;
  public readonly name: 'anonymous' = 'anonymous';
  public readonly apiKey: null = null;
}
