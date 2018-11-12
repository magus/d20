// @flow
export type DieRoll = { d: number, result: number, mod?: number };
type Roll = DieRoll[];
export type RollEvent = { user: string, roll: Roll };
