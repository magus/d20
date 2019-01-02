// @flow
import type { UserRollEvent, UserLookup, RollsByUser } from '~/app/types';

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
  playbackRolls: UserRollEvent[],
};

const removePlaybackRoll = () => (state: State) => {
  const playbackRolls = state.playbackRolls.slice(1);
  return { playbackRolls };
};

const handleRoll = (roll: UserRollEvent) => (state: State, props: Props) => {
  const rolls = { ...state.rolls };
  const { userId } = roll;

  if (!rolls[userId]) rolls[userId] = [];

  // Add non-user rolls
  const playbackRolls = [...state.playbackRolls];
  if (roll.userId !== props.socket.id) playbackRolls.push(roll);

  rolls[userId] = [roll, ...rolls[userId]];

  return {
    rolls,
    playbackRolls,
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

class WithSocketInfo extends React.Component<Props, State> {
  _handleRoll: (userRollEvent: UserRollEvent) => void;

  constructor(props: Props) {
    super(props);

    this.state = {
      users: {},
      rolls: {},
      playbackRolls: [],
    };

    this._handleRoll = userRollEvent => {
      const playbackRoll = this.state.playbackRolls[0];

      // do not emit playback rolls
      if (userRollEvent.id === (playbackRoll && playbackRoll.id)) {
        this.setState(removePlaybackRoll());
        return;
      }

      // emit new userRollEvent
      this.props.socket.emit(ROLL, userRollEvent);
    };
  }

  componentDidMount() {
    this.props.socket.on(ROLL, msg => this.setState(handleRoll(msg)));
    this.props.socket.on(USERS, msg => this.setState(updateUsers(msg)));
  }

  render() {
    const userId = this.props.socket.id;

    if (!userId) return <Page>Socket unavailable</Page>;

    return (
      <Page>
        <ConnectedUser user={this.state.users[userId] || userFromId(userId)} />

        <Roller
          myUserId={userId}
          playbackRoll={this.state.playbackRolls[0]}
          onRoll={this._handleRoll}
        />

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
