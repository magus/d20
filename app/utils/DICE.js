// @flow
import keyMirror from '~/app/utils/keyMirror';

const DICE: { [d: string]: string } = keyMirror({
  d4: true,
  d6: true,
  d8: true,
  d10: true,
  d12: true,
  d20: true,
  d100: true,
});

const DICE_TYPES: string[] = Object.keys(DICE);

const DICE_RANGE = {
  [DICE.d4]: [1, 4],
  [DICE.d6]: [1, 6],
  [DICE.d8]: [1, 8],
  [DICE.d10]: [0, 9],
  [DICE.d12]: [1, 12],
  [DICE.d20]: [1, 20],
  [DICE.d100]: [0, 9],
};

export default {
  Type: DICE,
  AllTypes: DICE_TYPES,
  Range: DICE_RANGE,
};
