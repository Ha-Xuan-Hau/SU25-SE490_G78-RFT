"use client";

import { useState, useEffect } from "react";
import { useUserState } from "@/recoils/user.state";
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
  Row,
  Col,
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

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600 text-sm">
            Đang tải thông tin giấy phép...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <IdcardOutlined className="text-blue-600 text-lg" />
              </div>
              <Title level={4} className="m-0 text-gray-900">
                Giấy phép lái xe
              </Title>
            </div>
            <Button
              type="primary"
              onClick={showModalRegister}
              className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600 h-auto px-5 py-2 text-sm font-medium shadow-sm"
              icon={<EditOutlined />}
            >
              <span className="hidden sm:inline">Đăng ký giấy phép mới</span>
            </Button>
          </div>
        </div>

        {/* Content Section */}
        {driverLicenses.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Multiple licenses - Card grid view */}
            {driverLicenses.length > 1 ? (
              <div className="p-6 sm:p-8">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Danh sách giấy phép ({driverLicenses.length})
                </h3>
                <Row gutter={[12, 12]}>
                  {driverLicenses.map((license, index) => (
                    <Col xs={12} sm={8} lg={6} key={index}>
                      <Card
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedLicenseIndex === index
                            ? "border-blue-500 shadow-sm bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => setSelectedLicenseIndex(index)}
                        bodyStyle={{ padding: "12px" }}
                        size="small"
                      >
                        <div className="text-center">
                          <h4 className="font-medium text-gray-900 mb-1 text-xs">
                            Hạng {license.classField}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2 font-mono truncate">
                            {license.licenseNumber}
                          </p>
                          <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Đã xác thực
                          </span>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {/* Selected license details */}
                {currentLicense && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      Chi tiết giấy phép đã chọn
                    </h3>
                    <Row gutter={[24, 24]}>
                      <Col xs={24} lg={12}>
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <label className="text-xs font-medium text-gray-700 mb-2 block">
                              Số giấy phép lái xe
                            </label>
                            <div className="text-base font-mono font-semibold text-gray-900 bg-white p-3 rounded-md border">
                              {currentLicense.licenseNumber}
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-4">
                            <label className="text-xs font-medium text-gray-700 mb-2 block">
                              Hạng giấy phép
                            </label>
                            <div className="text-base font-semibold text-gray-900 bg-white px-4 py-3 rounded-md border text-center">
                              {currentLicense.classField}
                            </div>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} lg={12}>
                        <div className="bg-gray-50 rounded-lg p-4 h-full">
                          <label className="text-xs font-medium text-gray-700 mb-2 block">
                            Hình ảnh giấy phép
                          </label>
                          <div className="aspect-[4/3] w-full bg-white rounded-lg border-2 border-dashed border-gray-300 overflow-hidden hover:border-blue-400 transition-colors">
                            <Image
                              className="w-full h-full object-contain"
                              src={
                                currentLicense.image ||
                                "/placeholder.svg?height=300&width=400"
                              }
                              alt="Giấy phép lái xe"
                              fallback="/placeholder.svg?height=300&width=400"
                              preview={{
                                mask: (
                                  <div className="flex flex-col items-center gap-2 text-white">
                                    <ZoomInOutlined className="text-lg" />
                                    <span className="text-xs">
                                      Xem chi tiết
                                    </span>
                                  </div>
                                ),
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
                                    <SwapOutlined
                                      rotate={90}
                                      onClick={onFlipY}
                                    />
                                    <SwapOutlined onClick={onFlipX} />
                                    <RotateLeftOutlined
                                      onClick={onRotateLeft}
                                    />
                                    <RotateRightOutlined
                                      onClick={onRotateRight}
                                    />
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
                      </Col>
                    </Row>
                  </div>
                )}
              </div>
            ) : (
              // Single license view
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-center mb-6">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Đã xác thực
                  </span>
                </div>

                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={12}>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <label className="text-xs font-medium text-gray-700 mb-2 block">
                          Số giấy phép lái xe
                        </label>
                        <div className="text-base font-mono font-semibold text-gray-900 bg-white p-3 rounded-md border">
                          {currentLicense?.licenseNumber || "N/A"}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <label className="text-xs font-medium text-gray-700 mb-2 block">
                          Hạng giấy phép
                        </label>
                        <div className="text-base font-semibold text-gray-900 bg-white px-4 py-3 rounded-md border text-center">
                          {currentLicense?.classField || "N/A"}
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} lg={12}>
                    <div className="bg-gray-50 rounded-lg p-4 h-full">
                      <label className="text-xs font-medium text-gray-700 mb-2 block">
                        Hình ảnh giấy phép
                      </label>
                      <div className="aspect-[4/3] w-full bg-white rounded-lg border-2 border-dashed border-gray-300 overflow-hidden hover:border-blue-400 transition-colors">
                        <Image
                          className="w-full h-full object-contain"
                          src={
                            currentLicense?.image ||
                            "/placeholder.svg?height=300&width=400"
                          }
                          alt="Giấy phép lái xe"
                          fallback="/placeholder.svg?height=300&width=400"
                          preview={{
                            mask: (
                              <div className="flex flex-col items-center gap-2 text-white">
                                <ZoomInOutlined className="text-lg" />
                                <span className="text-xs">Xem chi tiết</span>
                              </div>
                            ),
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
                  </Col>
                </Row>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              imageStyle={{
                height: 100,
              }}
              description={
                <div className="text-center max-w-md mx-auto">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Chưa có giấy phép lái xe
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                    Bạn cần đăng ký giấy phép lái xe để có thể sử dụng dịch vụ
                    thuê xe của chúng tôi.
                  </p>
                  {/* <Button
                    type="primary"
                    onClick={showModalRegister}
                    className="bg-blue-500 hover:bg-blue-600 px-6 py-2 h-auto text-sm font-medium"
                    icon={<EditOutlined />}
                  >
                    Đăng ký giấy phép ngay
                  </Button> */}
                </div>
              }
              className="py-12"
            />
          </div>
        )}
      </div>

      <RegisterDriverModal
        openRegisterDriver={openRegisterDriver}
        handleCancelRegisterDriver={handleCancleRegisterDriver}
      />
    </>
  );
}

DriverLicensePage.Layout = ProfileLayout;
