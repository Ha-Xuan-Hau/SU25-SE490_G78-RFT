import "./globals.css"; // Adjust this path as needed
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import NextTopLoader from "nextjs-toploader";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/apis/client";

import Head from "next/head";

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <ThemeProvider
          attribute="class"
          enableSystem={true}
          defaultTheme="light"
        >
          <NextTopLoader color="#07be8a" />
          <Head>
            <title>RFT - Rent For Travel</title>
          </Head>
          <Header />
          <Component {...pageProps} />
          <Footer />
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
