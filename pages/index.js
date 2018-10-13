import React from 'react';

import SocketContext, { SocketContextProvider } from '~/app/components/SocketContext';
import rolld20 from '~/utils/rolld20';

class Index extends React.Component {
  componentDidMount() {
    console.info('mounted');
  }

  componentDidUpdate() {
    console.info({ ...this.props });
  }

  render() {
    return (
      <p>{rolld20()}</p>
    )
  }
}

export default () => (
  <SocketContextProvider>
    <SocketContext>
      {
        socket => <Index socket={socket} />
      }
    </SocketContext>
  </SocketContextProvider>
);
