"use client";

import { useState, useEffect } from "react";
import { useUserState, useRefreshUser } from "@/recoils/user.state";
import { Typography, Spin, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import EditProfileModal from "@/components/EditProfileComponent";
import type { User } from "@/types/user"; // Adjust the import path as needed
import { showError } from "@/utils/toast.utils";

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

  const handleUserUpdate = async (updatedData: Partial<User>) => {
    try {
      // 1. Update Recoil state
      setUser((prevUser) => {
        if (!prevUser) return prevUser;

        const newUser = {
          ...prevUser,
          ...updatedData,
          id: prevUser.id, // QUAN TRỌNG: Giữ lại ID
          role: prevUser.role, // QUAN TRỌNG: Giữ lại ROLE
        };

        // 2. Update localStorage NGAY LẬP TỨC
        localStorage.setItem("user_profile", JSON.stringify(newUser));

        return newUser;
      });

      // 3. Đợi một chút để đảm bảo state đã được lưu
      setTimeout(() => {
        // 4. Reload page
        window.location.reload();
      }, 500); // Đợi 500ms
    } catch (error) {
      console.error("Error updating user:", error);
      showError("Cập nhật thất bại");
    }
  };

  return (
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
                className="flex w-full min-w-[115px] justify-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
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
        currentUser={user || undefined}
        onUserUpdate={handleUserUpdate} // Dùng function mới
      />
    </div>
  );
}

ProviderAccountPage.Layout = ProviderLayout;
