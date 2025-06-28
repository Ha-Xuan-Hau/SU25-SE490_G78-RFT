"use client";

import { useState, useEffect } from "react";
import { useUserState, useRefreshUser } from "@/recoils/user.state";
import { Typography, Button, Spin, Avatar, Card } from "antd"; // Import Card
import { UserOutlined } from "@ant-design/icons";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import EditProfileModal from "@/components/EditProfileComponent";

const { Title, Text } = Typography;

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
    timestamp: number | string | undefined | null
  ): string => {
    if (!timestamp) return "";
    const date = new Date(
      typeof timestamp === "number" ? timestamp * 1000 : timestamp
    );
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
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
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card className="shadow-lg rounded-lg p-8">
        {" "}
        {/* Tăng padding */}
        {/* Header Section: Avatar, Name, Email, Edit Button */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          {" "}
          {/* Thêm border-b */}
          <div className="flex items-center gap-4">
            {user && user.profilePicture ? (
              <Avatar
                src={user.profilePicture}
                size={80}
                className="shadow-sm\"
              />
            ) : (
              <Avatar
                icon={<UserOutlined />}
                size={80}
                className="shadow-sm bg-blue-100 text-blue-600"
              />
            )}
            <div>
              <Title level={4} className="m-0 text-gray-900">
                {user && user.fullName ? user.fullName : "Người cho thuê"}
              </Title>
              <Text className="text-gray-600 text-base">{user?.email}</Text>
            </div>
          </div>
          <Button
            type="primary"
            onClick={showModalEdit}
            className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600 px-6 py-2 h-auto text-base" // Nút Edit lớn hơn
          >
            Chỉnh sửa
          </Button>
        </div>
        {/* Profile Details Section: Form-like Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {" "}
          {/* Grid 2 cột */}
          {/* Full Name */}
          <div>
            <p className="text-base font-semibold text-gray-800 mb-2">
              Tên đây đủ
            </p>
            <div className="bg-gray-100 p-3 rounded-md text-gray-700 text-base">
              {user && user.fullName ? user.fullName : "Your Full Name"}
            </div>
          </div>
          {/* Role (Simulating Nick Name) */}
          <div>
            <p className="text-base font-semibold text-gray-800 mb-2">
              Vai trò
            </p>
            <div className="bg-gray-100 p-3 rounded-md text-gray-700 text-base">
              {user?.role === "PROVIDER" ? "Người cho thuê" : "Quản trị viên"}
            </div>
          </div>
          {/* Phone Number (Simulating Gender) */}
          <div>
            <p className="text-base font-semibold text-gray-800 mb-2">
              Số điện thoại
            </p>
            <div className="bg-gray-100 p-3 rounded-md text-gray-700 text-base">
              {user?.phone || "Chưa cập nhật"}
            </div>
          </div>
          {/* Address (Simulating Country) */}
          <div>
            <p className="text-base font-semibold text-gray-800 mb-2">
              Địa chỉ
            </p>
            <div className="bg-gray-100 p-3 rounded-md text-gray-700 text-base">
              {user?.address || "Chưa cập nhật"}
            </div>
          </div>
          {/* Date of Birth (Simulating Language) */}
          <div>
            <p className="text-base font-semibold text-gray-800 mb-2">
              Ngày sinh
            </p>
            <div className="bg-gray-100 p-3 rounded-md text-gray-700 text-base">
              {formatDOB(user?.dateOfBirth)}
            </div>
          </div>
          {/* Last Updated (Simulating Time Zone) */}
          <div>
            <p className="text-base font-semibold text-gray-800 mb-2">
              Cập nhật lần cuối
            </p>
            <div className="bg-gray-100 p-3 rounded-md text-gray-700 text-base">
              {formatTimestamp(user?.updatedAt)}
            </div>
          </div>
        </div>
      </Card>

      <EditProfileModal
        openEditModal={openEditModal}
        handleCancleEditModal={handleCancleEditModal}
      />
    </div>
  );
}

ProviderAccountPage.Layout = ProviderLayout;
