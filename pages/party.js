// @flow
import React from 'react';

import roll from '~/app/utils/roll';

function d20party() {
  const results = {};

  for (let i = 0; i < 100000; i++) {
    const result = roll().result;

    // ensure result is initialized
    if (typeof results[result] === 'undefined') results[result] = 0;

    // increment this result
    results[result]++;
  }

  return results;
}

export default () => (
  <div>
    <span>100k d20s...</span>
    <br />
    <pre>{JSON.stringify(d20party(), null, 2)}</pre>
  </div>
);

