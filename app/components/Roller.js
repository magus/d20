// @flow
import type { DieRollType2 } from '~/app/types';

import React from 'react';
import styled from 'styled-components';

import DiceBox from '~/app/components/DiceBox';
import DICE from '~/app/utils/DICE';
import { $id, $set, $listen } from '~/app/utils/dom';

const ROLLS_SPLIT_REGEX = /\s+\+\s+/;
const DICE_NOTATION_REGEX = /(.*?)(\d*)(d\d+)(\s*[+-]\s*\d+){0,1}(@([\d,]+)*){0,1}(.*?)$/i;
const DICE_RESULT_REGEX = /\d+/;

const stringifyNotation = function(notation: DieRollType2[]): string {
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
const parseNotation = function(notation: string): DieRollType2[] {
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

    if (!DICE.Type[type]) {
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
          if (type === DICE.Type.d100) forcedResult /= 10;
          result.push(forcedResult);
        }
      });
    }

    parsedRolls[i] = { original, d, mod, result };
  });

  return parsedRolls;
};

function onMount(container) {
  const canvasContainer = $id('canvasContainer');
  const notationInput = $id('notationInput');

  if (!container) throw new Error('container required');
  if (!canvasContainer) throw new Error('canvas container required');
  if (!notationInput) throw new Error('notation input required');
  if (!(notationInput instanceof HTMLInputElement)) {
    throw new Error('notation input must be input element');
  }

  function handleNotationChange(ev) {
    console.debug('handleNotationChange', { ev });
  }

  $listen(notationInput, 'keyup', handleNotationChange);
  $listen(notationInput, 'mousedown', function(ev) {
    ev.stopPropagation();
  });
  $listen(notationInput, 'mouseup', function(ev) {
    ev.stopPropagation();
  });
  $listen(notationInput, 'focus', function() {
    $set(container, { class: '' });
  });
  $listen(notationInput, 'blur', function() {
    $set(container, { class: 'noselect' });
  });

  const box = new DiceBox(canvasContainer, { w: 500, h: 300 });

  $listen(window, 'resize', function() {
    box.setupContainer(canvasContainer, { w: 500, h: 300 });
  });

  function getNotation() {
    return parseNotation(notationInput.value);
  }

  function onBeforeRoll(vectors, notation, callback) {
    console.debug('onBeforeRoll', { vectors, notation, callback });

    // Force a roll result
    // i.e. callback = DiceBox.bindMouse:onBeforeRoll -> roll(forcedResult)
    // e.g. callback([1, 1, 1, 1]) forces 4 dice results of value 1
    callback();
  }

  function onAfterRoll(notation, result) {
    console.debug('onAfterRoll', { notation, result });
  }

  box.bindMouse(container, getNotation, onBeforeRoll, onAfterRoll);
  box.bindThrow($id('throw'), getNotation, onBeforeRoll, onAfterRoll);

  $listen(container, 'mouseup', function(ev) {
    ev.stopPropagation();

    // $FlowFixMe
    if (!box.isShowingSelector && !box.rolling) {
      box.showSelector();
      return;
    }

    const name = box.searchDiceByMouse(ev);
    if (name) {
      const notation = parseNotation(`${notationInput.value} + ${name}`);
      const stringNotation = stringifyNotation(notation);
      notationInput.value = stringNotation;
      handleNotationChange();
    }
  });

  box.showSelector();
}

// state reducers
const setDiceNotation = (diceNotation: string) => () => ({ diceNotation });

type Props = {};

type State = { diceNotation: string };

export default class Roller extends React.Component<Props, State> {
  containerRef: { current: null | HTMLElement };

  handleDiceNotation: (e: Event) => void;

  constructor(props: Props) {
    super(props);

    this.containerRef = React.createRef();

    this.state = {
      diceNotation: 'd20',
    };

    this.handleDiceNotation = e => {
      const target = e.target;

      if (!(target instanceof HTMLInputElement)) {
        throw new Error('handleDiceNotation expects input element');
      }

      this.setState(setDiceNotation(target.value));
    };
  }

  componentDidMount() {
    // Initialize 3d roller
    onMount(this.containerRef.current);

    // TODO: Handle easy way to clear inputs
  }

  render() {
    const { diceNotation } = this.state;

    return (
      <Container>
        <CanvasContainer id="canvasContainer" ref={this.containerRef} />
        <DiceNotation
          type="text"
          id="notationInput"
          value={diceNotation}
          onChange={this.handleDiceNotation}
        />
        <button id="throw">throw</button>
      </Container>
    );
  }
}

const CanvasHeight = 300;
const DiceNotationPadding = 20;
const DiceNotationBorder = 2;
const DiceNotationLineHeight = 46;

const Container = styled.div``;

const CanvasContainer = styled.div`
  height: ${CanvasHeight}px;
  width: 100%;
`;

const DiceNotation = styled.input`
  width: calc(
    100% - ${2 * DiceNotationPadding}px - ${2 * DiceNotationBorder}px
  );
  padding: 0 ${DiceNotationPadding}px;
  margin: 0;
  border: ${DiceNotationBorder}px solid initial;

  text-align: center;
  font-size: 24px;
  font-weight: 400;
  line-height: ${DiceNotationLineHeight}px;
`;
