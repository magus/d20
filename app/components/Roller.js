import React from 'react';
import styled from 'styled-components';

import DiceBox from '~/app/components/DiceBox';
import { $id, $set, $listen } from '~/app/utils/dom';
import { DICE_TYPES } from '~/app/utils/threeDice';

const stringify_notation = function(nn) {
  const dict = {};

  let notation = '';

  for (let i in nn.set)
    if (!dict[nn.set[i]]) dict[nn.set[i]] = 1;
    else ++dict[nn.set[i]];

  for (let i in dict) {
    if (notation.length) notation += ' + ';
    notation += (dict[i] > 1 ? dict[i] : '') + i;
  }

  if (nn.constant) notation += ' + ' + nn.constant;

  return notation;
};

const parse_notation = function(notation) {
  var no = notation.split('@');
  var dr0 = /\s*(\d*)([a-z]+)(\d+)(\s*\+\s*(\d+)){0,1}\s*(\+|$)/gi;
  var dr1 = /(\b)*(\d+)(\b)*/gi;
  var ret = { set: [], constant: 0, result: [], error: false },
    res;
  while ((res = dr0.exec(no[0]))) {
    var command = res[2];
    if (command != 'd') {
      ret.error = true;
      continue;
    }
    var count = parseInt(res[1]);
    if (res[1] == '') count = 1;
    var type = 'd' + res[3];
    if (DICE_TYPES.indexOf(type) == -1) {
      ret.error = true;
      continue;
    }
    while (count--) ret.set.push(type);
    if (res[5]) ret.constant += parseInt(res[5]);
  }
  while ((res = dr1.exec(no[1]))) {
    ret.result.push(parseInt(res[2]));
  }
  return ret;
};

function dice_initialize(container) {
  const canvas = $id('canvas');
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  const label = $id('label');
  const set = $id('set');
  const selector_div = $id('selector_div');

  on_set_change();

  function on_set_change() {
    set.style.width = set.value.length + 3 + 'ex';
  }

  $listen(set, 'keyup', on_set_change);
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
    on_set_change();
  });

  var box = new DiceBox(canvas, { w: 500, h: 300 });
  box.animate_selector = false;

  $listen(window, 'resize', function() {
    canvas.style.width = window.innerWidth - 1 + 'px';
    canvas.style.height = window.innerHeight - 1 + 'px';
    box.reinit(canvas, { w: 500, h: 300 });
  });

  function show_selector() {
    selector_div.style.display = 'inline-block';
    box.draw_selector();
  }

  function before_roll(vectors, notation, callback) {
    selector_div.style.display = 'none';
    // do here rpc call or whatever to get your own result of throw.
    // then callback with array of your result, example:
    // callback([2, 2, 2, 2]); // for 4d6 where all dice values are 2.
    callback();
  }

  function notation_getter() {
    return parse_notation(set.value);
  }

  function after_roll(notation, result) {
    var res = result.join(' ');
    if (notation.constant) res += ' +' + notation.constant;
    if (result.length > 1)
      res +=
        ' = ' +
        (result.reduce(function(s, a) {
          return s + a;
        }) +
          notation.constant);
    label.innerHTML = res;
  }

  box.bind_mouse(container, notation_getter, before_roll, after_roll);
  box.bind_throw($id('throw'), notation_getter, before_roll, after_roll);

  $listen(container, 'mouseup', function(ev) {
    ev.stopPropagation();
    if (selector_div.style.display == 'none') {
      if (!box.rolling) show_selector();
      box.rolling = false;
      return;
    }
    var name = box.search_dice_by_mouse(ev);
    if (name != undefined) {
      var notation = notation_getter();
      notation.set.push(name);
      set.value = stringify_notation(notation);
      on_set_change();
    }
  });

  show_selector();
}

export default class Roller extends React.Component {
  componentDidMount() {
    // Initialize 3d roller
    dice_initialize(document.body);
  }

  render() {
    return (
      <div>
        <CanvasContainer id="canvas" />

        <div className="center_field">
          <span id="label" />
        </div>

        <div id="selector_div" style={{ display: 'none' }}>
          <div className="center_field">
            <div id="sethelp">
              choose your dice set by clicking the dices or by direct input of
              notation,
              <br />
              tap and drag on free space of screen or hit throw button to roll
            </div>
          </div>
          <div className="center_field">
            <input type="text" id="set" value="4d6" />
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
