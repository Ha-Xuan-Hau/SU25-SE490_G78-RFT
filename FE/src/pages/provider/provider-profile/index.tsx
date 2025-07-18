"use client";

import { useState, useEffect } from "react";
import { useUserState, useRefreshUser } from "@/recoils/user.state";
import {
  Typography,
  Button,
  Spin,
  Avatar,
  Card,
  Row,
  Col,
  Divider,
  message,
  Image,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  IdcardOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import EditProfileModal from "@/components/EditProfileComponent";

const { Title } = Typography;

export default function ProviderAccountPage() {
  const [openEditModal, setOpenEditModal] = useState(false);
  const showModalEdit = () => setOpenEditModal(true);
  const handleCancleEditModal = () => setOpenEditModal(false);

  const [user, setUser] = useUserState();
  const refreshUser = useRefreshUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        await refreshUser();
      }
      setLoading(false);
    };
    loadData();
  }, [user, refreshUser]);

  const formatDOB = (dateArray: number[] | undefined | null): string => {
    if (!dateArray || !Array.isArray(dateArray) || dateArray.length < 3)
      return "N/A";
    const [year, month, day] = dateArray;
    return `${day.toString().padStart(2, "0")}/${month
      .toString()
      .padStart(2, "0")}/${year}`;
  };

  const formatTimestamp = (
    timestamp: number | string | number[] | undefined | null
  ): string => {
    if (!timestamp) return "";

    if (Array.isArray(timestamp) && timestamp.length >= 5) {
      const [year, month, day, hour, minute] = timestamp;
      return `${day.toString().padStart(2, "0")}/${month
        .toString()
        .padStart(2, "0")}/${year} ${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
    }

    if (typeof timestamp === "number" || typeof timestamp === "string") {
      const date = new Date(
        typeof timestamp === "number" ? timestamp * 1000 : timestamp
      );
      return `${date.getDate().toString().padStart(2, "0")}/${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${date.getFullYear()} ${date
        .getHours()
        .toString()
        .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    }

    return "";
  };

  useEffect(() => {
    if (user) {
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[300px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    // <Card className="overflow-hidden shadow-md">
    //   <Title level={4} className="mb-6">
    //     Hồ Sơ Của Tôi
    //   </Title>

    //   <Divider className="mb-8" />

    //   <Row gutter={[32, 20]}>
    //     {/* Cột 1: Thông tin cá nhân */}
    //     <Col xs={24} md={16}>
    //       <div className="space-y-6">
    //         {/* Tên đăng nhập */}
    //         <div className="flex items-center">
    //           <div className="w-36 text-gray-500 flex-shrink-0">
    //             Tên đăng nhập
    //           </div>
    //           <div className="font-medium">
    //             {user?.name || user?.email?.split("@")[0] || "user123"}
    //           </div>
    //         </div>

    //         {/* Họ tên */}
    //         <div className="flex items-center">
    //           <div className="w-36 text-gray-500 flex-shrink-0">
    //             <IdcardOutlined className="mr-2" />
    //             Họ và tên
    //           </div>
    //           <div className="font-medium">
    //             {user?.fullName || "Chưa cập nhật"}
    //           </div>
    //         </div>

    //         {/* Email */}
    //         <div className="flex items-center">
    //           <div className="w-36 text-gray-500 flex-shrink-0">
    //             <MailOutlined className="mr-2" />
    //             Email
    //           </div>
    //           <div className="font-medium">
    //             {user?.email || "Chưa cập nhật"}
    //           </div>
    //         </div>

    //         {/* Số điện thoại */}
    //         <div className="flex items-center">
    //           <div className="w-36 text-gray-500 flex-shrink-0">
    //             <PhoneOutlined className="mr-2" />
    //             Số điện thoại
    //           </div>
    //           <div className="font-medium">
    //             {user?.phone || "Chưa cập nhật"}
    //           </div>
    //         </div>

    //         {/* Địa chỉ */}
    //         <div className="flex items-center">
    //           <div className="w-36 text-gray-500 flex-shrink-0">
    //             <HomeOutlined className="mr-2" />
    //             Địa chỉ
    //           </div>
    //           <div className="font-medium">
    //             {user?.address || "Chưa cập nhật"}
    //           </div>
    //         </div>

    //         {/* Ngày sinh */}
    //         <div className="flex items-center">
    //           <div className="w-36 text-gray-500 flex-shrink-0">
    //             <CalendarOutlined className="mr-2" />
    //             Ngày sinh
    //           </div>
    //           <div className="font-medium">{formatDOB(user?.dateOfBirth)}</div>
    //         </div>

    //         {/* Vai trò */}
    //         <div className="flex items-center">
    //           <div className="w-36 text-gray-500 flex-shrink-0">Vai trò</div>
    //           <div className="font-medium">
    //             {user?.role === "USER" ? "Người dùng" : "Chủ thuê"}
    //           </div>
    //         </div>

    //         {/* Thời gian cập nhật */}
    //         <div className="flex items-center">
    //           <div className="w-36 text-gray-500 flex-shrink-0">
    //             <ClockCircleOutlined className="mr-2" />
    //             Cập nhật
    //           </div>
    //           <div className="font-medium">
    //             {formatTimestamp(user?.updatedAt)}
    //           </div>
    //         </div>
    //       </div>
    //     </Col>

    //     {/* Cột 2: Avatar và nút chỉnh sửa */}
    //     <Col xs={24} md={8}>
    //       <div className="flex flex-col items-center p-4 border-l border-gray-200 h-full">
    //         <div className="mb-4 relative">
    //           {user && user.profilePicture ? (
    //             <Avatar
    //               src={user.profilePicture}
    //               size={120}
    //               className="shadow-sm border-2 border-gray-200"
    //             />
    //           ) : (
    //             <Avatar
    //               icon={<UserOutlined />}
    //               size={120}
    //               className="shadow-sm bg-blue-50 text-blue-600 border-2 border-gray-200"
    //             />
    //           )}
    //         </div>

    //         <Button
    //           type="primary"
    //           icon={<EditOutlined />}
    //           onClick={showModalEdit}
    //           size="large"
    //           className="w-full bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
    //         >
    //           Chỉnh Sửa Hồ Sơ
    //         </Button>
    //       </div>
    //     </Col>
    //   </Row>

    //   <EditProfileModal
    //     openEditModal={openEditModal}
    //     handleCancleEditModal={handleCancleEditModal}
    //     currentUser={user}
    //     onUserUpdate={(updatedUser) => setUser({ ...user, ...updatedUser })}
    //   />
    // </Card>

    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Hồ sơ
        </h3>
        <div className="space-y-6">
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                <div className="mb-4 relative">
                  {user && user.profilePicture ? (
                    <Avatar
                      src={user.profilePicture}
                      size={120}
                      className="shadow-sm border-2 border-gray-200"
                    />
                  ) : (
                    <Avatar
                      icon={<UserOutlined />}
                      size={120}
                      className="shadow-sm bg-blue-50 text-blue-600 border-2 border-gray-200"
                    />
                  )}
                </div>
                <div className="order-3 xl:order-2">
                  <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                    {user?.name || user?.email?.split("@")[0] || "user123"}
                  </h4>
                  <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.role === "USER" ? "Người dùng" : "Chủ thuê"}
                    </p>
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.address || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end"></div>
              </div>
              <button
                onClick={showModalEdit}
                className="flex w-full min-w-[115px] gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
              >
                Chỉnh sửa
              </button>
            </div>
          </div>

          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                  Thông tin cá nhân
                </h4>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Họ và tên
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {user?.fullName || "Chưa cập nhật"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Địa chỉ
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {user?.address || "Chưa cập nhật"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Email
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {user?.email || "Chưa cập nhật"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Số điện thoại
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {user?.phone || "Chưa cập nhật"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Vai trò
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {user?.role === "USER" ? "Người dùng" : "Chủ thuê"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Ngày sinh
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {formatDOB(user?.dateOfBirth)}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Cập nhật lần cuối
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {formatTimestamp(user?.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <EditProfileModal
        openEditModal={openEditModal}
        handleCancleEditModal={handleCancleEditModal}
        currentUser={user}
        onUserUpdate={(updatedUser) => setUser({ ...user, ...updatedUser })}
      />
    </div>
  );
}

ProviderAccountPage.Layout = ProviderLayout;
