// @flow
import type { RollEvent } from "~/app/types";

import React from "react";
import styled from "styled-components";

import SocketContext, {
  SocketContextProvider
} from "~/app/components/context/SocketContext";
import Page from "~/app/components/Page";
import { ROLL } from "~/server/socket/Events";

import roll from "~/app/utils/roll";

type Props = {
  socket: any
};

type State = {
  rolls: RollEvent[]
};

const handleRoll = (msg: RollEvent) => (state: State) => ({
  rolls: state.rolls.concat(msg)
});

class WithSocketInfo extends React.Component<Props, State> {
  _emitRoll: () => void;

  constructor(props: Props) {
    super(props);

    this.state = {
      rolls: []
    };

    this._emitRoll = () => this.props.socket.emit(ROLL, { user: 'UserA', roll: roll() });
  }

  componentDidMount() {
    this.props.socket.on(ROLL, msg => this.setState(handleRoll(msg)));
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
