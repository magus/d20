// @flow
import type { RollEvent, Users } from "~/app/types";

import React from "react";
import styled from "styled-components";

import SocketContext, {
  SocketContextProvider
} from "~/app/components/context/SocketContext";
import Page from "~/app/components/Page";
import { USERS, ROLL } from "~/server/socket/Events";

import roll from "~/app/utils/roll";

type Props = {
  socket: any
};

type State = {
  rolls: RollEvent[],
  users: Users
};

const handleRoll = (msg: RollEvent) => (state: State) => ({
  rolls: state.rolls.concat(msg)
});

const updateUsers = (users: Users) => () => ({ users });

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
        <Monospace>{JSON.stringify(this.state.rolls, null, 2)}</Monospace>
        <button onClick={this._emitRoll}>Roll</button>
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
