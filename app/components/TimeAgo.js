// @flow
import React from 'react';
import { FormattedRelative } from 'react-intl';

export default function TimeAgo({ time }: { time: Date | number }) {
  return <FormattedRelative value={time} updateInterval={1000} />;
}
