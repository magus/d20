// @flow
export type DieRoll = { d: number, result: number, mod?: number };
type Roll = DieRoll[];

// Socket events
export type RollEvent = { user: string, roll: Roll, time: number };
export type UserIdentity = { id: string, name: string, image: string | null };
export type ActiveUsers = { [userId: string]: UserIdentity | null };

export const userFromId = (userId: string): UserIdentity => ({
  id: userId,
  name: userId.slice(0, 4),
  image: null,
});
