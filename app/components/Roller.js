// @flow
import type { DiceTypes, RollType, UserRollEvent } from '~/app/types';
import type { DOMListener } from '~/app/utils/dom';

import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import DiceBox from '~/app/components/DiceBox';
import DICE from '~/app/utils/DICE';
import { $listen } from '~/app/utils/dom';

const messages = defineMessages({
  throw: {
    id: 'throw',
    defaultMessage: 'Throw',
  },
  create: {
    id: 'create',
    defaultMessage: 'Create',
  },
});

const DEFAULT_ROLL = 'd20';

// state reducers
const setDiceNotation = (diceNotation: string) => () => ({ diceNotation });

type Props = {
  myUserId: string,
  playbackRoll: UserRollEvent,
  onRoll: (dice: RollType[]) => void,
};

type State = { diceNotation: string };

export default class Roller extends React.Component<Props, State> {
  containerRef: { current: null | HTMLElement };
  notationInputRef: { current: null | HTMLInputElement };
  listeners: DOMListener[];
  diceBox: any;

  // state
  handleDiceNotation: (e: Event) => void;

  // handlers
  getNotation: () => RollType[];
  handleCreateNewRoll: () => void;
  handleThrow: () => void;
  handleDiceClick: (dice: DiceTypes) => void;
  handleBeforeRoll: (
    vectors: any,
    notation: RollType[],
    callback: (results?: number[]) => void
  ) => void;
  handleAfterRoll: (notation: RollType[], result: number[]) => void;

  constructor(props: Props) {
    super(props);

    this.containerRef = React.createRef();
    this.notationInputRef = React.createRef();
    this.listeners = [];
    this.diceBox = null;

    this.state = {
      diceNotation: DEFAULT_ROLL,
    };

    this.handleCreateNewRoll = () => {
      if (this.diceBox.rolling) return;

      this.setState(setDiceNotation(DEFAULT_ROLL));
      this.diceBox.showSelector();
    };

    this.handleThrow = () => {
      if (this.diceBox.rolling) return;

      this.diceBox.startThrow(
        this.getNotation,
        this.handleBeforeRoll,
        this.handleAfterRoll
      );
    };

    this.getNotation = () => {
      const notationInput = this.notationInputRef.current;
      const notationString = (notationInput && notationInput.value) || '';
      return DICE.parse(notationString);
    };

    this.handleDiceClick = dice => {
      const notationInput = this.notationInputRef.current;
      if (!notationInput) return;

      const notation = DICE.parse(`${notationInput.value} + ${dice}`);
      const stringNotation = DICE.stringify(notation);
      notationInput.value = stringNotation;
    };

    this.handleAfterRoll = (notation, result) => {
      console.debug('onAfterRoll', { notation, result });

      let resultIndex = 0;

      notation.forEach(roll => {
        if (!Array.isArray(roll.d)) return;
        if (!Array.isArray(roll.result)) roll.result = [];

        roll.d.forEach((_, i) => {
          roll.result[i] = result[resultIndex++];
        });
      });

      this.props.onRoll(notation);
    };

    this.handleBeforeRoll = (vectors, notation, callback) => {
      console.debug('onBeforeRoll', { vectors, notation, callback });

      // Force a roll result
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

    const options = {
      dimensions: { w: 500, h: 300 },
      getNotation: this.getNotation,
      onDiceClick: this.handleDiceClick,
      onBeforeRoll: this.handleBeforeRoll,
      onAfterRoll: this.handleAfterRoll,
    };

    this.diceBox = new DiceBox(container, options);

    this.listeners.push(
      $listen(window, 'resize', () => {
        this.diceBox.setupContainer();
      })
    );

    // throw on mount
    this.handleThrow();
  }

  componentWillUnmount() {
    this.listeners.forEach(listener => listener.remove());
  }

  componentDidUpdate(prevProps: Props) {
    const { playbackRoll } = this.props;
    if (!playbackRoll) return;
    if (!prevProps.playbackRoll) {
      // first playbackRoll, just play it
      console.debug({ playbackRoll });
    } else {
      const newPlayback = prevProps.playbackRoll.id !== playbackRoll.id;
      if (newPlayback) {
        console.debug({ playbackRoll });
      }
    }
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
        <button id="throw" onClick={this.handleThrow}>
          <FormattedMessage {...messages.throw} />
        </button>
        <button id="create" onClick={this.handleCreateNewRoll}>
          <FormattedMessage {...messages.create} />
        </button>
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
