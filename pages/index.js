// @flow
import type { RollEvent, ActiveUsers } from "~/app/types";

import React from "react";
import styled from "styled-components";

import SocketContext, {
  SocketContextProvider
} from "~/app/components/context/SocketContext";
import Page from "~/app/components/Page";
import Users from "~/app/components/Users";
import { USERS, ROLL } from "~/server/socket/Events";

import roll from "~/app/utils/roll";

type Props = {
  socket: any
};

type State = {
  rolls: RollEvent[],
  users: ActiveUsers
};

const handleRoll = (msg: RollEvent) => (state: State) => ({
  rolls: state.rolls.concat(msg)
});

const updateUsers = (users: ActiveUsers) => () => ({ users });

class WithSocketInfo extends React.Component<Props, State> {
  _emitRoll: () => void;

  constructor(props: Props) {
    super(props);

    this.state = {
      users: {},
      rolls: []
    };

    this._emitRoll = () =>
      this.props.socket.emit(ROLL, {
        user: this.props.socket.id,
        roll: roll(),
        time: Date.now()
      });
  }

  componentDidMount() {
    this.props.socket.on(ROLL, msg => this.setState(handleRoll(msg)));
    this.props.socket.on(USERS, msg => this.setState(updateUsers(msg)));
  }

  render() {
    return (
      <Result>
        <Users title="Active Userss" users={this.state.users} />

        <button onClick={this._emitRoll}>Roll</button>
        <Monospace>{JSON.stringify(this.state.rolls, null, 2)}</Monospace>
      </Result>
    );
  }
}

export default () => (
  <Page>
    <Header>d20</Header>

    <SocketContextProvider>
      <SocketContext>
        {socket => <WithSocketInfo socket={socket} />}
      </SocketContext>
    </SocketContextProvider>
  </Page>
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

const Monospace = styled.pre`
  font-family: monospace;
`;
