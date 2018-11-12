// @flow
export type DieRoll = { d: number, result: number, mod?: number };
type Roll = DieRoll[];

// Socket events
export type RollEvent = { user: string, roll: Roll, time: number };
export type User = { id: string, name: string, image: string | null };
export type ActiveUsers = { [userId: string]: User | null };

export const userFromId = (userId: string): User => ({ id: userId, name: userId.slice(0,4), image: null });
