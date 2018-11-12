// _document is only rendered on the server side and not on the client side
// Event handlers like onClick can't be added to this file
import Document, { Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components'

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const sheet = new ServerStyleSheet();

    const originalRenderPage = ctx.renderPage;
    ctx.renderPage = () => originalRenderPage({
      enhanceApp: App => props => sheet.collectStyles(<App {...props} />)
    });

    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps, styles: [...initialProps.styles, ...sheet.getStyleElement()] };
  }

  render() {
    return (
      <html>
        <Head>
          <meta httpEquiv="Referrer-Policy" content="no-referrer" />
          <meta name="referrer" content="no-referrer" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3.0, minimum-scale=1" />

          <style jsx global>{`
            html, body, div, span, applet, object, iframe,
            h1, h2, h3, h4, h5, h6, p, blockquote, pre,
            a, abbr, acronym, address, big, cite, code,
            del, dfn, em, img, ins, kbd, q, s, samp,
            small, strike, strong, sub, sup, tt, var,
            b, u, i, center,
            dl, dt, dd, ol, ul, li,
            fieldset, form, label, legend,
            table, caption, tbody, tfoot, thead, tr, th, td,
            article, aside, canvas, details, embed,
            figure, figcaption, footer, header, hgroup,
            main, menu, nav, output, ruby, section, summary,
            time, mark, audio, video {
              margin: 0;
              padding: 0;
              border: 0;
              font-size: 100%;
              font: inherit;
              vertical-align: baseline;
            }
            /* HTML5 display-role reset for older browsers */
            article, aside, details, figcaption, figure,
            footer, header, hgroup, main, menu, nav, section {
              display: block;
            }
            /* HTML5 hidden-attribute fix for newer browsers */
            *[hidden] {
                display: none;
            }
            body {
              line-height: 1;
            }
            ol, ul {
              list-style: none;
            }
            blockquote, q {
              quotes: none;
            }
            blockquote:before, blockquote:after,
            q:before, q:after {
              content: '';
              content: none;
            }
            table {
              border-collapse: collapse;
              border-spacing: 0;
            }
          `}</style>

          <style jsx global>{`
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
            }
          `}
          </style>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
