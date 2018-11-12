// @flow
import React from 'react';
import styled from 'styled-components';

import SocketContext, { SocketContextProvider } from '~/app/components/context/SocketContext';
import Page from '~/app/components/Page';
import { ROLL } from '~/server/socket/Events';
import roll from '~/app/utils/roll';

type Props = {
  socket: any,
};

class Index extends React.Component<Props> {
  componentDidMount() {
    console.info('mounted', { ...this.props });

    const { socket } = this.props;

    socket.emit(ROLL, roll());

    socket.on(ROLL, msg => {
      console.info(ROLL, msg);
    });
  }

  render() {
    return (
      <p>{roll()}</p>
    );
  }
}

export default () => (
  <Page>
    <Header>d20</Header>

    <SocketContextProvider>
      <SocketContext>
        {
          socket => <Index socket={socket} />
        }
      </SocketContext>
    </SocketContextProvider>
  </Page>
);

const Header = styled.h1``;
