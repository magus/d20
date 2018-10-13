import rolld20 from '~/app/utils/rolld20';

function d20party() {
  const results = {};

  for (let i = 0; i < 100000; i++) {
    const result = rolld20();

    // ensure result is initialized
    if (typeof results[result] === 'undefined') results[result] = 0;

    // increment this result
    results[result]++;
  }

  return results;
}

export default () => (
  <p>
    <span>100k d20s...</span>
    <br />
    <pre>{JSON.stringify(d20party(), null, 2)}</pre>
  </p>
);

