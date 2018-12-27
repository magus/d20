// @flow
import * as THREE from 'three';

import CANNON from '~/libs/cannon.min';
import keyMirror from '~/app/utils/keyMirror';

type DiceTypes = $Keys<typeof DICE>;
export type Dice = {
  type: DiceTypes,
  castShadow: boolean,
  body: typeof CANNON.RigidBody,
} & typeof THREE.Mesh;

const DICE = keyMirror({
  d4: true,
  d6: true,
  d8: true,
  d10: true,
  d12: true,
  d20: true,
  d100: true,
});

const DICE_TYPES: DiceTypes[] = Object.keys(DICE);

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
