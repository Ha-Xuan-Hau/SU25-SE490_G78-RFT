import "./globals.css";
import type { AppProps } from "next/app";
import { NextPage } from "next";
import { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import dynamic from "next/dynamic";
import { queryClient } from "@/apis/client";
import { UserWebLayout } from "@/layouts/UserLayout";
import { AuthProvider } from "@/context/AuthContext";
import { SimpleWebSocketProvider } from "@/context/WebSocketContext";
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
            <SimpleWebSocketProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </SimpleWebSocketProvider>
            <ReactQueryDevtools initialIsOpen={false} />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}

export default dynamic(() => Promise.resolve(MyApp), {
  ssr: false,
});
