import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="vi">
      <Head>
        <meta
          name="description"
          content="Rent For Travel - Cho thuê xe tại các điểm du lịch"
        />

        <link rel="icon" href="/images/rft-icon.png" />

        {/* Thêm Open Graph meta tags cho social sharing */}
        <meta property="og:title" content="Rent For Travel" />
        <meta
          property="og:description"
          content="Cho thuê xe tại các điểm du lịch"
        />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:type" content="website" />

        {/* Thêm meta tags cho SEO */}
        <meta name="keywords" content="thuê xe, du lịch, rent car, travel" />
        <meta name="author" content="Rent For Travel" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
