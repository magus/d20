// @flow
import React from 'react';

import SocketContext, { SocketContextProvider } from '~/app/components/SocketContext';
import { ROLL } from '~/server/socket/Events';
import rolld20 from '~/app/utils/rolld20';

type Props = {
  socket: any,
};

class Index extends React.Component<Props> {
  componentDidMount() {
    console.info('mounted', { ...this.props });

    const { socket } = this.props;

    socket.emit(ROLL, rolld20());

    socket.on(ROLL, msg => {
      console.info(ROLL, msg);
    });
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
