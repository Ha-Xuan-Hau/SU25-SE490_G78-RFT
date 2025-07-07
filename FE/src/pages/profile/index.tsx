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
import { ProfileLayout } from "@/layouts/ProfileLayout";
import EditProfileModal from "@/components/EditProfileComponent";

const { Title } = Typography;

export default function AccountPage() {
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

    // Nếu là mảng [year, month, day, hour, minute] hoặc [year, month, day, hour, minute, second]
    if (Array.isArray(timestamp) && timestamp.length >= 5) {
      const [year, month, day, hour, minute] = timestamp;
      return `${day.toString().padStart(2, "0")}/${month
        .toString()
        .padStart(2, "0")}/${year} ${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
    }

    // Nếu là timestamp số hoặc string
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
    <Card className="overflow-hidden shadow-md">
      <Title level={4} className="mb-6">
        Hồ Sơ Của Tôi
      </Title>

      <Divider className="mb-8" />

      <Row gutter={[32, 20]}>
        {/* Cột 1: Thông tin cá nhân */}
        <Col xs={24} md={16}>
          <div className="space-y-6">
            {/* Tên đăng nhập */}
            <div className="flex items-center">
              <div className="w-36 text-gray-500 flex-shrink-0">
                Tên đăng nhập
              </div>
              <div className="font-medium">
                {user?.name || user?.email?.split("@")[0] || "user123"}
              </div>
            </div>

            {/* Họ tên */}
            <div className="flex items-center">
              <div className="w-36 text-gray-500 flex-shrink-0">
                <IdcardOutlined className="mr-2" />
                Họ và tên
              </div>
              <div className="font-medium">
                {user?.fullName || "Chưa cập nhật"}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center">
              <div className="w-36 text-gray-500 flex-shrink-0">
                <MailOutlined className="mr-2" />
                Email
              </div>
              <div className="font-medium">
                {user?.email || "Chưa cập nhật"}
              </div>
            </div>

            {/* Số điện thoại */}
            <div className="flex items-center">
              <div className="w-36 text-gray-500 flex-shrink-0">
                <PhoneOutlined className="mr-2" />
                Số điện thoại
              </div>
              <div className="font-medium">
                {user?.phone || "Chưa cập nhật"}
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="flex items-center">
              <div className="w-36 text-gray-500 flex-shrink-0">
                <HomeOutlined className="mr-2" />
                Địa chỉ
              </div>
              <div className="font-medium">
                {user?.address || "Chưa cập nhật"}
              </div>
            </div>

            {/* Ngày sinh */}
            <div className="flex items-center">
              <div className="w-36 text-gray-500 flex-shrink-0">
                <CalendarOutlined className="mr-2" />
                Ngày sinh
              </div>
              <div className="font-medium">{formatDOB(user?.dateOfBirth)}</div>
            </div>

            {/* Vai trò */}
            <div className="flex items-center">
              <div className="w-36 text-gray-500 flex-shrink-0">Vai trò</div>
              <div className="font-medium">
                {user?.role === "USER" ? "Người dùng" : "Chủ thuê"}
              </div>
            </div>

            {/* Thời gian cập nhật */}
            <div className="flex items-center">
              <div className="w-36 text-gray-500 flex-shrink-0">
                <ClockCircleOutlined className="mr-2" />
                Cập nhật
              </div>
              <div className="font-medium">
                {formatTimestamp(user?.updatedAt)}
              </div>
            </div>
          </div>
        </Col>

        {/* Cột 2: Avatar và nút chỉnh sửa */}
        <Col xs={24} md={8}>
          <div className="flex flex-col items-center p-4 border-l border-gray-200 h-full">
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

            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={showModalEdit}
              size="large"
              className="w-full bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
            >
              Chỉnh Sửa Hồ Sơ
            </Button>
          </div>
        </Col>
      </Row>

      <EditProfileModal
        openEditModal={openEditModal}
        handleCancleEditModal={handleCancleEditModal}
        currentUser={user}
        onUserUpdate={(updatedUser) => setUser({ ...user, ...updatedUser })}
      />
    </Card>
  );
}

AccountPage.Layout = ProfileLayout;
