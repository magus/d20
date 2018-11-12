// @flow
export type DieRoll = { d: number, result: number, mod?: number };
type Roll = DieRoll[];

// Socket events
export type RollEvent = { user: string, roll: Roll, time: number };
export type Users = { [userId: string]: any };
