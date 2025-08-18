"use client";

import { useState, useEffect } from "react";
import { useUserState, useRefreshUser } from "@/recoils/user.state";
import { Typography, Spin } from "antd";
import {
  EditIcon,
  CalendarIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  ShieldCheckIcon,
  ClockIcon,
  User2,
  UserPlus,
} from "lucide-react";
import EditProfileModal from "@/components/EditProfileComponent";
import AdminLayout from "@/layouts/AdminLayout";
import type { User } from "@/types/user";
import { showError } from "@/utils/toast.utils";

const { Title } = Typography;

export default function AdminAccountPage() {
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
      <div className="flex justify-center items-center h-full min-h-[400px] bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spin size="large" />
          <p className="text-muted-foreground font-open-sans">
            Đang tải thông tin...
          </p>
        </div>
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
    <div className="min-h-screen bg-background p-6 font-open-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-montserrat font-bold text-foreground">
            Hồ sơ cá nhân
          </h1>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 px-6 sm:px-8 py-8 sm:py-10">
            <div className="flex flex-col lg:flex-row items-center lg:items-center gap-6 lg:gap-8">
              {/* Avatar Section */}
              <div className="relative flex-shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary to-secondary p-1">
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                    {user && user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-[104px] h-[104px] sm:w-[120px] sm:h-[120px] rounded-full object-cover"
                      />
                    ) : (
                      <User2 className="w-12 h-12 sm:w-14 sm:h-14 text-primary" />
                    )}
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center border-2 border-card">
                  <ShieldCheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center lg:text-left space-y-2 sm:space-y-3 min-w-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-montserrat font-bold text-foreground truncate">
                    {user?.name || user?.email?.split("@")[0] || "user123"}
                  </h2>
                  <p className="text-base sm:text-lg text-muted-foreground font-open-sans">
                    {user?.role === "ADMIN" ? "Quản trị viên" : "Nhân viên"}
                  </p>
                </div>

                <div className="flex flex-col items-center lg:items-start gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <MapPinIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">
                      {user?.address || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <MailIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">
                      {user?.email || "Chưa cập nhật"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={showModalEdit}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-open-sans text-sm sm:text-base flex-shrink-0 mt-2 lg:mt-0"
              >
                <EditIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Chỉnh sửa</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-8">
          <h3 className="text-xl font-montserrat font-semibold text-foreground mb-8 flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <User2 className="text-primary" />
            </div>
            Thông tin chi tiết
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Full Name */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <User2 className="w-4 h-4" />
                Họ và tên
              </div>
              <p className="text-foreground font-medium text-lg font-open-sans">
                {user?.fullName || "Chưa cập nhật"}
              </p>
            </div>

            {/* Address */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <MapPinIcon className="w-4 h-4" />
                Địa chỉ
              </div>
              <p className="text-foreground font-medium text-lg font-open-sans">
                {user?.address || "Chưa cập nhật"}
              </p>
            </div>

            {/* Email */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <MailIcon className="w-4 h-4" />
                Email
              </div>
              <p className="text-foreground font-medium text-lg font-open-sans">
                {user?.email || "Chưa cập nhật"}
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <PhoneIcon className="w-4 h-4" />
                Số điện thoại
              </div>
              <p className="text-foreground font-medium text-lg font-open-sans">
                {user?.phone || "Chưa cập nhật"}
              </p>
            </div>

            {/* Role */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <ShieldCheckIcon className="w-4 h-4" />
                Vai trò
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user?.role === "ADMIN"
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary/10 text-secondary"
                  }`}
                >
                  {user?.role === "ADMIN" ? "Quản trị viên" : "Nhân viên"}
                </span>
              </div>
            </div>

            {/* Date of Birth */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <CalendarIcon className="w-4 h-4" />
                Ngày sinh
              </div>
              <p className="text-foreground font-medium text-lg font-open-sans">
                {formatDOB(user?.dateOfBirth)}
              </p>
            </div>

            {/* Join Date */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <UserPlus className="w-4 h-4" />
                Ngày tham gia
              </div>
              <p className="text-foreground font-medium text-lg font-open-sans">
                {formatTimestamp(user?.createdAt)}
              </p>
            </div>

            {/* Last Updated */}
            <div className="space-y-3 ">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <ClockIcon className="w-4 h-4" />
                Cập nhật lần cuối
              </div>
              <p className="text-foreground font-medium text-lg font-open-sans">
                {formatTimestamp(user?.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        openEditModal={openEditModal}
        handleCancleEditModal={handleCancleEditModal}
        currentUser={user || undefined}
        onUserUpdate={handleUserUpdate}
      />
    </div>
  );
}

AdminAccountPage.Layout = AdminLayout;
