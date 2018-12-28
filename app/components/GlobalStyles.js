// @flow
import { createGlobalStyle } from 'styled-components';

export default createGlobalStyle`
  body {
    font-size: 16px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
      "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
      "Helvetica Neue", sans-serif;

    /* Disables pull-to-refresh but allows overscroll glow effects. */
    overscroll-behavior-y: contain;
  }
`;
