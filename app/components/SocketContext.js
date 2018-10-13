import React from 'react';

const SocketContext = React.createContext('socketio');

export class SocketContextProvider extends React.Component {
  constructor(props) {
    super(props);

    this.state = { socket: null };
  }

  componentDidMount() {
    const socket = io();
    this.setState({ socket });
  }

  render() {
    if (!this.state.socket) return null;

    // Use a Provider to pass the current theme to the tree below.
    // Any component can read it, no matter how deep it is.
    return (
      <SocketContext.Provider value={this.state.socket}>
        {this.props.children}
      </SocketContext.Provider>
    );
  }
}

export default SocketContext.Consumer;
