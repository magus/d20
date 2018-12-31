// @flow
import React from 'react';
import styled from 'styled-components';

import DiceBox from '~/app/components/DiceBox';
import DICE from '~/app/utils/DICE';
import { $id, $set, $listen } from '~/app/utils/dom';

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
    return DICE.parse(notationInput.value);
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
      const notation = DICE.parse(`${notationInput.value} + ${name}`);
      const stringNotation = DICE.stringify(notation);
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

          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
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
