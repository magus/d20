// @flow
import type { ParsedDieRollType } from '~/app/types';

import { DICE, DICE_TYPES } from '~/app/types';

const DICE_RANGE = {
  [DICE.d4]: [1, 4],
  [DICE.d6]: [1, 6],
  [DICE.d8]: [1, 8],
  [DICE.d10]: [0, 9],
  [DICE.d12]: [1, 12],
  [DICE.d20]: [1, 20],
  [DICE.d100]: [0, 9],
};

const ROLLS_SPLIT_REGEX = /\s+\+\s+/;
const DICE_NOTATION_REGEX = /(.*?)(\d*)(d\d+)(\s*[+-]\s*\d+){0,1}(@([\d,]+)*){0,1}(.*?)$/i;
const DICE_RESULT_REGEX = /\d+/;

const stringifyNotation = function(notation: ParsedDieRollType[]): string {
  const dict = {};
  const incDict = key => {
    if (!dict[key]) dict[key] = 0;
    ++dict[key];
  };

  notation.forEach(roll => {
    if (roll.error) {
      incDict(roll.original);
    } else if (roll.d) {
      roll.d.forEach(d => {
        if (roll.mod) {
          const mod = roll.mod < 0 ? roll.mod : `+${roll.mod}`;
          incDict(`${d}${mod}`);
        } else {
          incDict(d);
        }
      });
    } else {
      throw new Error(`invalid roll: ${JSON.stringify(roll)}`);
    }
  });

  const rolls = Object.keys(dict).map(roll => {
    const count = dict[roll];
    if (count === 1) return roll;
    return `${count}${roll}`;
  });

  return rolls.join(' + ');
};

// Parse standard dice notation
// Examples
// d20                  [d20]
// d20-2                -2 + [d20]
// 4d6                  [d6, d6, d6, d6]
// 2d8+4                +4 + [d8, d8]
// 4d6@6,6              [6, 6, d6, d6]
// d20 + 2d4@1,4 + d10  [d20, 1, 4, d10]
// Errors
// 2e8-3, 1d4+2 - 4r, ad8-3, rd10, d201, d20&7, d20-A
const parseNotation = function(notation: string): ParsedDieRollType[] {
  const parsedRolls = [];

  if (!notation || typeof notation !== 'string') return parsedRolls;

  const splitRolls = notation.trim().split(ROLLS_SPLIT_REGEX);

  // Parse each dice notation
  splitRolls.forEach((roll, i) => {
    const original = roll;
    const parsedDiceNotation = DICE_NOTATION_REGEX.exec(roll);

    if (!parsedDiceNotation) {
      parsedRolls[i] = {
        original,
        error: new Error('unrecognized dice notation'),
      };
      return;
    }

    // Extra garbage catch-all should be empty
    if (parsedDiceNotation[1] || parsedDiceNotation[7]) {
      parsedRolls[i] = {
        original,
        error: new Error('contains superfluous characters'),
      };
      return;
    }

    const type = parsedDiceNotation[3];

    if (!DICE[type]) {
      parsedRolls[i] = { original, error: new Error('invalid dice type') };
      return;
    }

    // No errors, continue parsing roll

    let count = parseInt(parsedDiceNotation[2]);
    if (parsedDiceNotation[2] === '') count = 1;

    const d = [];
    while (count--) d.push(type);

    let mod = 0;
    if (parsedDiceNotation[4]) {
      mod = parseInt(parsedDiceNotation[4].replace(/s/g, ''));
    }

    // Handle forced results
    const result = [];
    const resultNotation = parsedDiceNotation[6];
    if (resultNotation) {
      const results = resultNotation.trim().split(',');

      results.forEach(diceResult => {
        const match = DICE_RESULT_REGEX.exec(diceResult);

        if (!match) return;

        let forcedResult = parseInt(match[0]);
        if (!isNaN(forcedResult)) {
          if (type === DICE.d100) forcedResult /= 10;
          result.push(forcedResult);
        }
      });
    }

    parsedRolls[i] = { original, d, mod, result };
  });

  return parsedRolls;
};

export default {
  Type: DICE,
  AllTypes: DICE_TYPES,
  Range: DICE_RANGE,

  parse: parseNotation,
  stringify: stringifyNotation,
};
