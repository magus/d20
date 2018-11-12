// @flow
import React from 'react';

// _document is only rendered on the server side and not on the client side
// Event handlers like onClick can't be added to this file
import Document, { Head, Main, NextScript } from "next/document";
import { ServerStyleSheet } from "styled-components";

import StyleReset from '~/app/components/StyleReset';
import GlobalStyles from '~/app/components/GlobalStyles';

export default class MyDocument extends Document {
  static async getInitialProps(ctx: any) {
    const sheet = new ServerStyleSheet();

    const originalRenderPage = ctx.renderPage;
    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: App => props => sheet.collectStyles(<App {...props} />)
      });

    const initialProps = await Document.getInitialProps(ctx);
    return {
      ...initialProps,
      styles: [...initialProps.styles, ...sheet.getStyleElement()]
    };
  }

  render() {
    return (
      <html>
        <Head>
          <meta httpEquiv="Referrer-Policy" content="no-referrer" />
          <meta name="referrer" content="no-referrer" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
          />

          {/* Styles */}
          <StyleReset />
          <GlobalStyles />

          {/* <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js" /> */}
        </Head>

        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
