// @flow
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
  rolls: number[]
};

const handleRoll = (msg: any) => (state: State) => ({
  rolls: state.rolls.concat(msg.value)
});

class WithSocketInfo extends React.Component<Props, State> {
  _emitRoll: () => void;

  constructor(props: Props) {
    super(props);

    this.state = {
      rolls: []
    };

    this._emitRoll = () => this.props.socket.emit(ROLL, roll());
  }

  componentDidMount() {
    this.props.socket.on(ROLL, msg => this.setState(handleRoll(msg)));
  }

  render() {
    return (
      <Result>
        <pre>{JSON.stringify(this.state.rolls)}</pre>
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
