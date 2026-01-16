import Document, { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    // Get locale from props (Next.js i18n provides this)
    const locale = this.props.__NEXT_DATA__.locale || 'en';

    return (
      <Html lang={locale}>
        <Head>
          {/* DNS Prefetch for Performance */}
          <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
          <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

          {/* Security Headers */}
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta name="format-detection" content="telephone=no" />

          {/* Verification Tags (Add your actual verification codes) */}
          {/* <meta name="google-site-verification" content="your-verification-code" /> */}
          {/* <meta name="msvalidate.01" content="your-bing-verification-code" /> */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
