// @flow
import type { DieRollType } from "~/app/types";

export default function rollDie(d: number = 20, mod?: number = 0): DieRollType {
  const dieRoll = Math.floor(Math.random() * d) + 1;
  const result = dieRoll + mod;
  return { d, result, mod };
}
