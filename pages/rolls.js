// @flow
import type { RollEvent, UserLookup, RollsByUser } from '~/app/types';

import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import SocketContext, {
  SocketContextProvider,
} from '~/app/components/context/SocketContext';
import pageWithIntl from '~/app/components/context/PageWithIntl';

import ConnectedUser from '~/app/components/ConnectedUser';
import Page from '~/app/components/Page';
import Rolls from '~/app/components/Rolls';
import Users from '~/app/components/Users';

import { USERS, ROLL } from '~/server/socket/Events';

import rollDie from '~/app/utils/rollDie';
import { userFromId } from '~/app/types';

type Props = {
  socket: any,
};

type State = {
  rolls: RollsByUser,
  users: UserLookup,
};

const handleRoll = (roll: RollEvent) => (state: State) => {
  const rolls = { ...state.rolls };
  const { userId } = roll;

  if (!rolls[userId]) rolls[userId] = [];

  rolls[userId] = [roll, ...rolls[userId]];

  return {
    rolls,
  };
};

const updateUsers = (activeUsers: UserLookup) => (state: State) => {
  const users = { ...state.users, ...activeUsers };

  // Set active status
  Object.keys(users).forEach(userId => {
    if (!users[userId]) {
      users[userId] = userFromId(userId);
    }

    users[userId].active = userId in activeUsers;
  });

  // Set lastActive on users
  Object.keys(activeUsers).forEach(activeUserId => {
    users[activeUserId].lastActive = Date.now();
  });

  return { users };
};

const createGUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const messages = defineMessages({
  roll: {
    id: 'roll',
    defaultMessage: 'Roll',
  },
});

class WithSocketInfo extends React.Component<Props, State> {
  _emitRoll: () => void;

  constructor(props: Props) {
    super(props);

    this.state = {
      users: {},
      rolls: {},
    };

    this._emitRoll = () => {
      const roll: RollEvent = {
        userId: this.props.socket.id,
        dieRolls: [rollDie()],
        time: Date.now(),
        id: createGUID(),
      };
      this.props.socket.emit(ROLL, roll);
    };
  }

  componentDidMount() {
    this.props.socket.on(ROLL, msg => this.setState(handleRoll(msg)));
    this.props.socket.on(USERS, msg => this.setState(updateUsers(msg)));
  }

  render() {
    const userId = this.props.socket.id;

    return (
      <Page>
        <Header>d20</Header>
        <ConnectedUser user={this.state.users[userId] || userFromId(userId)} />

        <Result>
          <Users users={this.state.users} />

          <button onClick={this._emitRoll}>
            <FormattedMessage {...messages.roll} />
          </button>
          <Rolls rolls={this.state.rolls} users={this.state.users} />
        </Result>
      </Page>
    );
  }
}

function RollsPage() {
  return (
    <SocketContextProvider>
      <SocketContext>
        {socket => <WithSocketInfo socket={socket} />}
      </SocketContext>
    </SocketContextProvider>
  );
}

export default pageWithIntl(RollsPage);

const Header = styled.h1`
  text-align: center;
  font-size: 24px;
  font-weight: 400;
  margin-bottom: 10px;
`;

const Result = styled.div`
  font-size: 16px;
`;
