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

  useEffect(() => {
    const role = user?.role;

    // Nếu không có role (chưa login) - không redirect
    if (!role) return;

    // Define các path mà admin và staff KHÔNG được truy cập
    const restrictedPathsForAdminStaff = ["/become-provider", "/booking"];

    // Kiểm tra nếu path hiện tại là restricted path
    const isRestrictedPath = restrictedPathsForAdminStaff.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    // Logic cho ADMIN
    if (role === "ADMIN") {
      // Nếu admin đang cố truy cập restricted paths -> redirect
      if (isRestrictedPath) {
        push("/not-found");
        return;
      }

      // Admin có thể truy cập /admin và các trang khác
      // Không redirect nếu không phải restricted path
      return;
    }

    // Logic cho STAFF
    if (role === "STAFF") {
      // Nếu staff đang cố truy cập restricted paths -> redirect
      if (isRestrictedPath) {
        push("/not-found");
        return;
      }

      if (pathname.includes("/admin") && !pathname.includes("_error")) {
        push("/not-found");
        return;
      }

      // Không redirect nếu không phải restricted path
      return;
    }

    // USER hoặc các role khác có thể truy cập bình thường
  }, [user, pathname, push]);

  return (
    <>
      <HeaderComponent />
      <Content className="bg-white py-2">{children}</Content>
      <FooterComponent />
    </>
  );
}
