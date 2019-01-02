// @flow
import keyMirror from '~/app/utils/keyMirror';

export const DICE: { [key: string]: string } = keyMirror({
  d4: true,
  d6: true,
  d8: true,
  d10: true,
  d12: true,
  d20: true,
  d100: true,
});

// export type DiceTypes = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';
export type DiceTypes = $Keys<typeof DICE>;

export const DICE_TYPES: DiceTypes[] = Object.keys(DICE);

export type ParsedDieRollType = {
  original: string,
  d: Array<DiceTypes>,
  mod: number,
  result: Array<number>,
  error?: Error,
};

// Socket events
export type RollEvent = {
  id: string,
  userId: string,
  dice: ParsedDieRollType[],
  time: number,
};
export type UserIdentity = {
  id: string,
  name: string,
  image: string | null,
  active: boolean,
};
export type UserLookup = { [userId: string]: UserIdentity | null };
export type RollsByUser = { [userId: string]: RollEvent[] };

export const userFromId = (userId: string): UserIdentity => ({
  id: userId,
  name: userId.slice(0, 4),
  image: null,
  active: false,
});
