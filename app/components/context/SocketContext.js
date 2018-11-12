import React from 'react';
import io from 'socket.io-client';

const SocketContext = React.createContext('socketio');

export class SocketContextProvider extends React.Component {
  constructor(props) {
    super(props);

    this.state = { socket: null };
  }

  componentDidMount() {
    const socket = io();
    socket.on('connect', () => {
      this.setState({ socket });
    });
  }

  render() {
    const { socket } = this.state;

    if (!socket) return null;

    // Use a Provider to pass the current theme to the tree below.
    // Any component can read it, no matter how deep it is.
    return (
      <SocketContext.Provider value={socket}>
        {this.props.children}
      </SocketContext.Provider>
    );
  }
}

export default SocketContext.Consumer;
