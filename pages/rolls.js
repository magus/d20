// @flow
import type { RollEvent, ActiveUsers, RollsByUser } from '~/app/types';

import React from 'react';
import styled from 'styled-components';

import SocketContext, {
  SocketContextProvider,
} from '~/app/components/context/SocketContext';

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
  users: ActiveUsers,
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

const updateUsers = (users: ActiveUsers) => () => ({ users });

const createGUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

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

          <button onClick={this._emitRoll}>Roll</button>
          <Rolls rolls={this.state.rolls} users={this.state.users} />
        </Result>
      </Page>
    );
  }
}

export default () => (
  <SocketContextProvider>
    <SocketContext>
      {socket => <WithSocketInfo socket={socket} />}
    </SocketContext>
  </SocketContextProvider>
);

const Header = styled.h1`
  text-align: center;
  font-size: 24px;
  font-weight: 400;
  margin-bottom: 10px;
`;

const Result = styled.div`
  font-size: 16px;
`;
