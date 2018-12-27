// @flow
import type { UserIdentity } from '~/app/types';

import React from 'react';
import styled from 'styled-components';

import { emojiFromUserId } from '~/app/utils/emoji';

export default function User({
  identity,
}: {
  identity: UserIdentity,
}) {
  return (
    <Username inactive={!identity.active}>
      {emojiFromUserId(identity.id)} {identity.name}
    </Username>
  );
}

const Username = styled.div`
  border: 1px solid #666;
  border-radius: 4px;
  padding: 4px;
  margin: 0 4px 4px 0;
  display: inline-block;

  background: ${props => (props.inactive ? '#999' : '#FFF')};
  opacity: ${props => (props.inactive ? '0.4' : 'initial')};
`;
