// @flow
import type { UserIdentity } from '~/app/types';

import React from 'react';
import styled from 'styled-components';

import { emojiFromUserId } from '~/app/utils/emoji';

type Props = {
  identity: UserIdentity,
};

export function UserEmoji({ identity}: Props) {
  return emojiFromUserId(identity.id);
}

export default function User({
  identity,
}: Props) {
  return (
    <Username inactive={!identity.active}>
      <UserEmoji identity={identity} /> {identity.name}
    </Username>
  );
}

const Username = styled.div`
  border: 1px solid #666;
  border-radius: 4px;
  padding: 4px;
  display: inline-block;

  background: ${props => (props.inactive ? '#999' : '#FFF')};
  opacity: ${props => (props.inactive ? '0.4' : 'initial')};
`;
