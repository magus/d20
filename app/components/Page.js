// @flow
import React from 'react';
import styled from 'styled-components';

function preventPullToRefresh(element) {
  if (!element) return;

  let prevent = false;

  element.addEventListener('touchstart', (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    if (!window || !document.body || !document.documentElement) return;

    const scrollY =
      window.pageYOffset ||
      document.body.scrollTop ||
      document.documentElement.scrollTop;
    prevent = scrollY === 0;
  });

  element.addEventListener('touchmove', (e: TouchEvent) => {
    if (prevent) {
      prevent = false;
      e.preventDefault();
    }
  });
}

type Props = {
  children: any,
};

export default class Page extends React.Component<Props> {
  containerRef: { current: null | HTMLElement };

  constructor(props: Props) {
    super(props);

    this.containerRef = React.createRef();
  }
  componentDidMount() {
    preventPullToRefresh(this.containerRef.current);
  }

  render() {
    return <Container ref={this.containerRef}>{this.props.children}</Container>;
  }
}

const Container = styled.div`
  color: #000;
`;
