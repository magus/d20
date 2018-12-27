import React from 'react';
import styled from 'styled-components';

import DiceBox from '~/app/components/DiceBox';
import DICE from '~/app/utils/DICE';
import { $id, $set, $listen } from '~/app/utils/dom';

const stringifyNotation = function(notation) {
  const dict = {};

  let output = '';

  for (let i in notation.dice)
    if (!dict[notation.dice[i]]) dict[notation.dice[i]] = 1;
    else ++dict[notation.dice[i]];

  for (let i in dict) {
    if (output.length) output += ' + ';
    output += (dict[i] > 1 ? dict[i] : '') + i;
  }

  if (notation.constant) output += ' + ' + notation.constant;

  return output;
};

// Parse standard dice notation
// Examples
// d20        [d20]
// d20-2      -2 + [d20]
// 4d6        [d6, d6, d6, d6]
// 2d8+4      +4 + [d8, d8]
// 4d6 @ 6 6  [6, 6, d6, d6]
const parseNotation = function(notation) {
  const no = notation.split('@');
  const dr0 = /\s*(\d*)(d\d+)(\s*[+-]\s*\d+){0,1}\s*(\+|$)/gi;
  const dr1 = /(\b)*(\d+)(\b)*/gi;
  const ret = { dice: [], constant: 0, result: [], error: false };

  let res;
  // Parse each dice notation
  while ((res = dr0.exec(no[0]))) {
    let count = parseInt(res[1]);
    if (res[1] === '') count = 1;

    const type = res[2];
    if (!DICE.Type[type]) {
      ret.error = true;
      continue;
    }

    while (count--) ret.dice.push(type);

    if (res[3]) {
      ret.constant += parseInt(res[3].replace(/s/g, ''));
    }
  }

  // Forced results
  while ((res = dr1.exec(no[1]))) {
    ret.result.push(parseInt(res[2]));
  }

  return ret;
};

function onMount(container) {
  const canvas = $id('canvas');
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  const label = $id('label');
  const set = $id('set');
  const selectorDiv = $id('selectorDiv');

  handleSetChange();

  function handleSetChange() {
    set.style.width = set.value.length + 3 + 'ex';
  }

  $listen(set, 'keyup', handleSetChange);
  $listen(set, 'mousedown', function(ev) {
    ev.stopPropagation();
  });
  $listen(set, 'mouseup', function(ev) {
    ev.stopPropagation();
  });
  $listen(set, 'focus', function() {
    $set(container, { class: '' });
  });
  $listen(set, 'blur', function() {
    $set(container, { class: 'noselect' });
  });

  $listen($id('clear'), 'mouseup touchend', function(ev) {
    ev.stopPropagation();
    set.value = '0';
    handleSetChange();
  });

  const box = new DiceBox(canvas, { w: 500, h: 300 });

  $listen(window, 'resize', function() {
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    box.setupContainer(canvas, { w: 500, h: 300 });
  });

  function showSelector() {
    selectorDiv.style.display = 'inline-block';
    box.showSelector();
  }

  function onBeforeRoll(vectors, notation, callback) {
    selectorDiv.style.display = 'none';

    // Force a roll result
    // i.e. callback = DiceBox.bindMouse:onBeforeRoll -> roll(forcedResult)
    // e.g. callback([1, 1, 1, 1]) forces 4 dice results of value 1
    callback();
  }

  function getNotation() {
    return parseNotation(set.value);
  }

  function onAfterRoll(notation, result) {
    console.debug('onAfterRoll', { notation, result });
  }

  box.bindMouse(container, getNotation, onBeforeRoll, onAfterRoll);
  box.bindThrow($id('throw'), getNotation, onBeforeRoll, onAfterRoll);

  $listen(container, 'mouseup', function(ev) {
    ev.stopPropagation();

    if (selectorDiv.style.display === 'none') {
      if (!box.rolling) showSelector();
      box.rolling = false;
      return;
    }

    const name = box.searchDiceByMouse(ev);
    if (name !== undefined) {
      const notation = getNotation();
      notation.dice.push(name);
      set.value = stringifyNotation(notation);
      handleSetChange();
    }
  });

  showSelector();
}

export default class Roller extends React.Component {
  componentDidMount() {
    // Initialize 3d roller
    onMount(document.body);
  }

  render() {
    return (
      <div>
        <CanvasContainer id="canvas" />

        <div className="center_field">
          <span id="label" />
        </div>

        <div id="selectorDiv" style={{ display: 'none' }}>
          <div className="center_field">
            <input type="text" id="set" value="d20" />
            <br />
            <button id="clear">clear</button>
            <button style={{ marginLeft: '0.6em' }} id="throw">
              throw
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const CanvasContainer = styled.div`
  z-index: -1;
  position: absolute;
  top: 0;
  left: 0;
`;
