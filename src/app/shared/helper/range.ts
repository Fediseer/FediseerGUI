import {int} from "../../types/number";

export function range(end: int): int[] {
  return [...Array(end - 1).keys()].map(index => index + 1);
}
