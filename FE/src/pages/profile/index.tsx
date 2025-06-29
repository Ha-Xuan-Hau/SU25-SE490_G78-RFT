import React, { useState, useEffect } from "react";
import { useUserState, useRefreshUser } from "@/recoils/user.state";
import { Typography, Button, Spin, Avatar } from "antd";
import { EditOutlined, UserOutlined } from "@ant-design/icons";
import { ProfileLayout } from "@/layouts/ProfileLayout";
// import EditProfileModal from "@/components/EditProfileModal";

const { Title } = Typography;

export default function AccountPage() {
  const [openEditModal, setOpenEditModal] = useState(false);
  const showModalEdit = () => setOpenEditModal(true);
  const handleCancleEditModal = () => setOpenEditModal(false);

  const [user, setUser] = useUserState();
  const refreshUser = useRefreshUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to refresh user data when component mounts
    const loadData = async () => {
      if (!user) {
        await refreshUser();
      }
      setLoading(false);
    };

    loadData();
  }, [user, refreshUser]);

  // Hàm format ngày sinh từ mảng [năm, tháng, ngày]
  const formatDOB = (dateArray: number[] | undefined | null): string => {
    if (!dateArray || !Array.isArray(dateArray) || dateArray.length < 3)
      return "N/A";
    const [year, month, day] = dateArray;
    return `${day.toString().padStart(2, "0")}/${month
      .toString()
      .padStart(2, "0")}/${year}`;
  };

  // Format timestamp thành date string
  const formatTimestamp = (
    timestamp: number | string | undefined | null
  ): string => {
    if (!timestamp) return "";
    // Đảm bảo timestamp là số dù nó đến dạng gì
    const date = new Date(
      typeof timestamp === "number" ? timestamp * 1000 : timestamp
    );
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  // Check if user data is loading or already loaded
  useEffect(() => {
    // If user data is already available, we can stop loading
    if (user) {
      setLoading(false);
      return;
    }

    // If no user data, we wait a bit to let Recoil finish its async fetch
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // Give Recoil some time to fetch data

    return () => clearTimeout(timer);
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-grow relative p-4">
        <div
          className="flex flex-col relative justify-center items-center"
          style={{ width: "30%" }}
        >
          <div className="flex flex-row">
            <p className="font-semibold text-xl mt-0">Thông tin tài khoản</p>
            <Button
              className="flex items-center ml-2"
              style={{
                padding: "8px",
                border: "1px solid #e0e0e0",
                borderRadius: "50%",
                cursor: "pointer",
              }}
              onClick={showModalEdit}
            >
              <EditOutlined />
            </Button>
            {/* <EditProfileModal
              openEditModal={openEditModal}
              handleCancleEditModal={handleCancleEditModal}
            /> */}
          </div>

          <div className="flex w-full flex-col justify-center items-center mx-auto">
            {user && user.profilePicture ? (
              <Avatar src={user.profilePicture} size={120} />
            ) : (
              <Avatar icon={<UserOutlined />} size={120} />
            )}
          </div>

          <div className="flex flex-col mt-4 text-center">
            <h5 className="text-xl font-semibold mt-1 mb-2">
              {user && user.fullName ? user.fullName : "Người dùng"}
            </h5>
            <p className="text-gray-500 mb-1">
              {user?.role === "USER" ? "Người dùng" : "Quản trị viên"}
            </p>
            <p className="text-sm text-gray-500">
              Tham gia: {formatTimestamp(user?.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-col w-[calc(100%-30%)] mt-8">
          {/* Email */}
          <div className="flex flex-col mb-4">
            <div className="flex flex-row w-full">
              <p className="m-0 text-base font-semibold flex w-full">Email</p>
              <p className="m-0 text-base text-gray-500 flex w-full">
                {user?.email}
              </p>
            </div>
            <hr className="w-full my-2 opacity-25" />
          </div>

          {/* Số điện thoại */}
          <div className="flex flex-col mb-4">
            <div className="flex flex-row w-full">
              <p className="m-0 text-base font-semibold flex w-full">
                Số điện thoại
              </p>
              <p className="m-0 text-base text-gray-500 flex w-full">
                {user?.phone}
              </p>
            </div>
            <hr className="w-full my-2 opacity-25" />
          </div>

          {/* Địa chỉ */}
          <div className="flex flex-col mb-4">
            <div className="flex flex-row w-full">
              <p className="m-0 text-base font-semibold flex w-full">Địa chỉ</p>
              <p className="m-0 text-base text-gray-500 flex w-full">
                {user?.address || "Chưa cập nhật"}
              </p>
            </div>
            <hr className="w-full my-2 opacity-25" />
          </div>

          {/* Ngày sinh */}
          <div className="flex flex-col mb-4">
            <div className="flex flex-row w-full">
              <p className="m-0 text-base font-semibold flex w-full">
                Ngày sinh
              </p>
              <p className="m-0 text-base text-gray-500 flex w-full">
                {formatDOB(user?.dateOfBirth)}
              </p>
            </div>
            <hr className="w-full my-2 opacity-25" />
          </div>

          {/* Trạng thái */}
          <div className="flex flex-col mb-4">
            <div className="flex flex-row w-full">
              <p className="m-0 text-base font-semibold flex w-full">
                Trạng thái
              </p>
              <p
                className={`m-0 text-base font-medium flex w-full ${
                  user?.status === "ACTIVE" ? "text-green-500" : "text-red-500"
                }`}
              >
                {user?.status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
              </p>
            </div>
            <hr className="w-full my-2 opacity-25" />
          </div>

          {/* Lần cuối cập nhật */}
          <div className="flex flex-col">
            <div className="flex flex-row w-full">
              <p className="m-0 text-base font-semibold flex w-full">
                Lần cuối cập nhật
              </p>
              <p className="m-0 text-base text-gray-500 flex w-full">
                {formatTimestamp(user?.updatedAt)}
              </p>
            </div>
            <hr className="w-full my-2 opacity-25" />
          </div>
        </div>
      </div>
    </div>
  );
}

AccountPage.Layout = ProfileLayout;
