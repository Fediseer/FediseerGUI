import {Resolvable} from "../types/resolvable";

export interface Instance {
  get anonymous(): boolean;
  get name(): string;
  get apiKey(): string | null;
}
