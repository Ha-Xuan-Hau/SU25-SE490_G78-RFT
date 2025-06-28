"use client";

import { useState, useEffect } from "react";
import { useUserState } from "@/recoils/user.state.js";
import { ProfileLayout } from "@/layouts/ProfileLayout";
import {
  Typography,
  Button,
  Image,
  Space,
  Tabs,
  Empty,
  Spin,
  Card,
} from "antd";
import {
  EditOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  IdcardOutlined,
} from "@ant-design/icons";

import RegisterDriverModal from "@/components/RegisterDriverModal";
import { getUserDriverLicenses } from "@/apis/driver-licenses.api";
import type { DriverLicense } from "@/types/driverLicense";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function DriverLicensePage() {
  const [openRegisterDriver, setOpenRegisterDriver] = useState(false);
  const showModalRegister = () => setOpenRegisterDriver(true);
  const handleCancleRegisterDriver = () => setOpenRegisterDriver(false);

  const [user, setUser] = useUserState();

  const [driverLicenses, setDriverLicenses] = useState<DriverLicense[]>([]);
  const [selectedLicenseIndex, setSelectedLicenseIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchLicenseInfo = async () => {
      try {
        setLoading(true);
        const data = await getUserDriverLicenses();
        console.log("Licenses data:", data);

        if (data && Array.isArray(data) && data.length > 0) {
          setDriverLicenses(data);
        }
      } catch (error) {
        console.error("Không thể lấy thông tin giấy phép:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLicenseInfo();
  }, []);

  const currentLicense = driverLicenses[selectedLicenseIndex];

  const status =
    currentLicense?.status === "VALID" ? "Đã xác thực" : "Chưa xác thực";
  const backgroundColor = status === "Chưa xác thực" ? "#ffd0cd" : "#cff1db";
  const textColor =
    status === "Chưa xác thực" ? "text-red-500" : "text-green-500";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" tip="Đang tải thông tin giấy phép..." />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card className="shadow-lg rounded-lg p-8">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Title level={3} className="m-0 text-gray-900">
              Giấy phép lái xe
            </Title>
            {currentLicense && (
              <span
                className={`rounded-full text-xs px-3 py-1 font-medium ${textColor}`}
                style={{ background: backgroundColor }}
              >
                {status}
              </span>
            )}
          </div>
          <Button
            type="primary"
            onClick={showModalRegister}
            className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600 px-6 py-2 h-auto text-base"
          >
            Đăng ký giấy phép mới <EditOutlined />
          </Button>
          <RegisterDriverModal
            openRegisterDriver={openRegisterDriver}
            handleCancelRegisterDriver={handleCancleRegisterDriver}
          />
        </div>

        <div className="mb-6">
          <Text className="text-gray-600 text-base">
            Cần phải có giấy phép lái xe để sử dụng dịch vụ của RFT
          </Text>
        </div>

        {driverLicenses.length > 0 ? (
          <>
            {driverLicenses.length > 1 && (
              <Tabs
                activeKey={selectedLicenseIndex.toString()}
                onChange={(key) =>
                  setSelectedLicenseIndex(Number.parseInt(key))
                }
                className="mb-6"
                type="card"
                tabBarStyle={{ marginBottom: 0 }}
              >
                {driverLicenses.map((license, index) => (
                  <TabPane
                    tab={
                      <span className="px-4 py-2">
                        <IdcardOutlined /> {license.classField} -{" "}
                        {license.licenseNumber.substring(0, 8)}...
                      </span>
                    }
                    key={index.toString()}
                  />
                ))}
              </Tabs>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <p className="text-base font-semibold text-gray-800 mb-2">
                  Thông tin chung
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Số GPLX
                    </p>
                    <div className="bg-gray-100 p-3 rounded-md text-gray-700 text-base">
                      {currentLicense?.licenseNumber || "N/A"}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Hạng
                    </p>
                    <div className="bg-gray-100 p-3 rounded-md text-gray-700 text-base">
                      {currentLicense?.classField || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-base font-semibold text-gray-800 mb-2">
                  Hình ảnh
                </p>
                <div className="w-full h-64 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                  <Image
                    className="w-full h-full object-contain rounded-md"
                    src={
                      currentLicense?.image ||
                      "/placeholder.svg?height=200&width=300" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg"
                    }
                    alt="Driver License"
                    fallback="/placeholder.svg?height=200&width=300"
                    preview={{
                      toolbarRender: (
                        _,
                        {
                          transform: { scale },
                          actions: {
                            onFlipY,
                            onFlipX,
                            onRotateLeft,
                            onRotateRight,
                            onZoomOut,
                            onZoomIn,
                          },
                        }
                      ) => (
                        <Space size={12} className="toolbar-wrapper">
                          <SwapOutlined rotate={90} onClick={onFlipY} />
                          <SwapOutlined onClick={onFlipX} />
                          <RotateLeftOutlined onClick={onRotateLeft} />
                          <RotateRightOutlined onClick={onRotateRight} />
                          <ZoomOutOutlined
                            disabled={scale === 1}
                            onClick={onZoomOut}
                          />
                          <ZoomInOutlined
                            disabled={scale === 50}
                            onClick={onZoomIn}
                          />
                        </Space>
                      ),
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <Empty
            description={
              <div>
                <p className="text-gray-500 mb-4">
                  Bạn chưa có giấy phép lái xe nào
                </p>
                <Button type="primary" onClick={showModalRegister}>
                  Đăng ký giấy phép ngay
                </Button>
              </div>
            }
            className="my-8"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>
    </div>
  );
}

DriverLicensePage.Layout = ProfileLayout;
