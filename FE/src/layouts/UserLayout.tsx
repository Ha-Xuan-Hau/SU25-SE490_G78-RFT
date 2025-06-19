import { Divider, Layout, Menu } from "antd";
import HeaderComponent from "@/components/HeaderComponent";
import FooterComponent from "@/components/FooterComponent";
import { useRouter } from "next/router";
import { useUserState } from "@/recoils/user.state";
import { useEffect } from "react";

const { Content } = Layout;

interface UserWebLayoutProps {
  children: React.ReactNode;
}

export function UserWebLayout({ children }: UserWebLayoutProps) {
  const [user] = useUserState();
  const { pathname, push } = useRouter();

  // Chuyển logic redirecting vào useEffect
  useEffect(() => {
    const role = user?.result?.role;

    if (
      role === "admin" &&
      !(pathname.includes("admin") || pathname.includes("_error"))
    ) {
      push("/admin/dashboard");
    }
  }, [user, pathname, push]);

  return (
    <Layout className="bg-white min-h-screen">
      <HeaderComponent />
      <Content className="bg-white py-2">{children}</Content>
      <FooterComponent />
    </Layout>
  );
}
