import "./globals.css";
import type { AppProps } from "next/app";
import { NextPage } from "next";
import { ReactElement, ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import dynamic from "next/dynamic";
import { queryClient } from "@/apis/client";
import { UserWebLayout } from "@/layouts/UserLayout";
import { AuthProvider } from "@/context/AuthContext";
import "react-toastify/dist/ReactToastify.css";
import { RecoilRoot } from "recoil";
import { ToastContainer } from "react-toastify";

// Khai báo kiểu cho page có custom layout
type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
  Layout?: React.ComponentType<{ children: React.ReactNode }>;
  title?: string;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({ Component, pageProps: { ...pageProps } }: AppPropsWithLayout) {
  const Layout = Component.Layout || UserWebLayout;
  const title = Component.title || "RFT - Rent For Travel";

  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          enableSystem={true}
          defaultTheme="light"
        >
          <AuthProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
            <ReactQueryDevtools initialIsOpen={false} />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}

export default dynamic(() => Promise.resolve(MyApp), {
  ssr: false,
});
