import React from "react";
import Head from "next/head";
import Script from "next/script";

type Props = {
  children: JSX.Element;
};

function Layout({children}: Props) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL"
        crossOrigin="anonymous"
      ></Script>
      <Head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4229101464965146"
          crossOrigin="anonymous"
        ></script>
        <meta name="viewport" content="width=device-width, minimum-scale=1" />
        <title>Click Battle</title>

        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
          rel="stylesheet"
          integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN"
          crossOrigin="anonymous"
        />
        <meta
          name="description"
          content="Online multiplayer Click battle - Challenge your friends to a 10 second click battle!"
        />
        <meta property="og:type" content="article" />
        <meta property="og:title" content="CLICK BATTLE" />
        <meta
          property="og:image"
          content="http://pngimg.com/uploads/cursor/cursor_PNG100721.png"
        />
        <meta
          property="og:description"
          content="Online multiplayer Click battle"
        />
        <meta property="og:url" content="https://click-battle-mp.web.app/" />
        <meta property="og:site_name" content="Click battle" />
        <meta name="twitter:title" content="Click battle" />
        <meta
          name="twitter:description"
          content="Online multiplayer Click battle"
        />
        <meta
          name="twitter:image"
          content="http://pngimg.com/uploads/cursor/cursor_PNG100721.png"
        />
        <meta name="twitter:creator" content="@LeanLescano_" />
        <meta name="author" content="Lescano Leandro Nicolas" />
      </Head>
      {children}
    </>
  );
}

export default Layout;
