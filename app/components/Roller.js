// @flow
import type { ParsedDieRollType } from '~/app/types';
import type { DOMListener } from '~/app/utils/dom';

import React from 'react';
import styled from 'styled-components';

import DiceBox from '~/app/components/DiceBox';
import DICE from '~/app/utils/DICE';
import { $id, $listen } from '~/app/utils/dom';

// state reducers
const setDiceNotation = (diceNotation: string) => () => ({ diceNotation });

type Props = {};

type State = { diceNotation: string };

export default class Roller extends React.Component<Props, State> {
  containerRef: { current: null | HTMLElement };
  notationInputRef: { current: null | HTMLInputElement };
  listeners: DOMListener[];
  diceBox: any;

  getNotation: () => ParsedDieRollType[];
  onAfterRoll: (notation: ParsedDieRollType[], result: number[]) => void;
  onBeforeRoll: (
    vectors: any,
    notation: ParsedDieRollType[],
    callback: (results?: number[]) => void
  ) => void;
  handleDiceNotation: (e: Event) => void;

  constructor(props: Props) {
    super(props);

    this.containerRef = React.createRef();
    this.notationInputRef = React.createRef();
    this.listeners = [];
    this.diceBox = null;

    this.state = {
      diceNotation: 'd20',
    };

    this.getNotation = () => {
      const notationInput = this.notationInputRef.current;
      const notationString = (notationInput && notationInput.value) || '';
      return DICE.parse(notationString);
    };

    this.onAfterRoll = (notation, result) => {
      console.debug('onAfterRoll', { notation, result });
    };

    this.onBeforeRoll = (vectors, notation, callback) => {
      console.debug('onBeforeRoll', { vectors, notation, callback });

      // Force a roll result
      // i.e. callback = DiceBox.bindMouse:onBeforeRoll -> roll(forcedResult)
      // e.g. callback([1, 1, 1, 1]) forces 4 dice results of value 1
      callback();
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
    const container = this.containerRef.current;
    const notationInput = this.notationInputRef.current;

    if (!container) throw new Error('container required');
    if (!notationInput) throw new Error('notation input required');
    if (!(notationInput instanceof HTMLInputElement)) {
      throw new Error('notation input must be input element');
    }

    this.diceBox = new DiceBox(container, { w: 500, h: 300 });

    this.listeners.push(
      $listen(window, 'resize', () => {
        this.diceBox.setupContainer(container, { w: 500, h: 300 });
      })
    );

    // TODO move to Roller
    this.diceBox.bindMouse(
      container,
      this.getNotation,
      this.onBeforeRoll,
      this.onAfterRoll
    );
    this.diceBox.bindThrow(
      $id('throw'),
      this.getNotation,
      this.onBeforeRoll,
      this.onAfterRoll
    );

    this.listeners.push(
      $listen(container, 'mouseup', ev => {
        ev.stopPropagation();

        if (!this.diceBox.isShowingSelector && !this.diceBox.rolling) {
          this.diceBox.showSelector();
          return;
        }

        const name = this.diceBox.searchDiceByMouse(ev);
        if (name) {
          const notation = DICE.parse(`${notationInput.value} + ${name}`);
          const stringNotation = DICE.stringify(notation);
          notationInput.value = stringNotation;
        }
      })
    );

    // Show selector
    this.diceBox.showSelector();

    // TODO: Handle easy way to clear inputs
  }

  componentWillUnmount() {
    this.listeners.forEach(listener => listener.remove());
  }

  render() {
    const { diceNotation } = this.state;

    return (
      <Container>
        <CanvasContainer id="canvasContainer" ref={this.containerRef} />
        <DiceNotation
          ref={this.notationInputRef}
          id="notationInput"
          value={diceNotation}
          onChange={this.handleDiceNotation}
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
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
