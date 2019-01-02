// @flow
import type { UserRollEvent, UserLookup, RollsByUser, RollType } from '~/app/types';

import React from 'react';
import styled from 'styled-components';

import SocketContext, {
  SocketContextProvider,
} from '~/app/components/context/SocketContext';
import pageWithIntl from '~/app/components/context/PageWithIntl';

import ConnectedUser from '~/app/components/ConnectedUser';
import Page from '~/app/components/Page';
import Rolls from '~/app/components/Rolls';
import Users from '~/app/components/Users';
import Roller from '~/app/components/Roller';

import { USERS, ROLL } from '~/server/socket/Events';
import { userFromId } from '~/app/types';

type Props = {
  socket: any,
};

type State = {
  rolls: RollsByUser,
  users: UserLookup,
  allRolls: UserRollEvent[],
};

const handleRoll = (roll: UserRollEvent) => (state: State) => {
  const rolls = { ...state.rolls };
  const { userId } = roll;

  if (!rolls[userId]) rolls[userId] = [];

  const allRolls = [roll, ...state.allRolls];
  rolls[userId] = [roll, ...rolls[userId]];

  return {
    rolls,
    allRolls,
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

class WithSocketInfo extends React.Component<Props, State> {
  _handleRoll: (dice: RollType[]) => void;

  constructor(props: Props) {
    super(props);

    this.state = {
      users: {},
      rolls: {},
      allRolls: [],
    };

    this._handleRoll = rolls => {
      const roll: UserRollEvent = {
        rolls,
        userId: this.props.socket.id,
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
        <ConnectedUser user={this.state.users[userId] || userFromId(userId)} />

        <Roller myUserId={userId} playbackRoll={this.state.allRolls[0]} onRoll={this._handleRoll} />

        <BelowRoller>
          <Result>
            <Users users={this.state.users} />
            <Rolls rolls={this.state.rolls} users={this.state.users} />
          </Result>
        </BelowRoller>
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

const BelowRoller = styled.div``;

const Result = styled.div`
  font-size: 16px;
`;
