console.info('d20-server');

module.exports = () => rolld20();

module.exports = async (req, res) => {
  const { path } = req;

  console.log({ path });

  switch(path) {
    case 'party':
      return `100k d20s...\n${JSON.stringify(d20party(), null, 2)}`;
    default:
      return rolld20();
  }
}


function rolld20() {
  return Math.floor(Math.random() * 20) + 1;
}

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
