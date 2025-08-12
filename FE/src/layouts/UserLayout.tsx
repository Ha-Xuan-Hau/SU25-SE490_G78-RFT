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

  // useEffect(() => {
  //   // Sử dụng user?.role thay vì user?.result?.role
  //   const role = user?.role;

  //   if (
  //     role === "STAFF" &&
  //     !(pathname.includes("STAFF") || pathname.includes("_error"))
  //   ) {
  //     push("/admin/dashboard");
  //   }

  //   if (
  //     role === "ADMIN" &&
  //     !(pathname.includes("ADMIN") || pathname.includes("_error"))
  //   ) {
  //     push("/admin/dashboard");
  //   }
  // }, [user, pathname, push]);

  return (
    <>
      <HeaderComponent />
      <Content className="bg-white py-2">{children}</Content>
      <FooterComponent />
    </>
  );
}
