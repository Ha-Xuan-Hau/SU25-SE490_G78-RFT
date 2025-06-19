import React, { useState, useEffect } from "react";
import { useUserState } from "@/recoils/user.state.js";
import { useDriverState } from "@/recoils/driver.state";
import {
  Typography,
  Button,
  Input,
  Image,
  Space,
  Select,
  Tabs,
  Empty,
  Spin,
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

import { ProfileLayout } from "@/layouts/ProfileLayout";
import RegisterDriverModal from "@/components/RegisterDriverModal";
import { getUserDriverLicenses } from "@/apis/driver-licenses";
import { DriverLicense } from "@/types/driverLicense";

const { Title } = Typography;
const { TabPane } = Tabs;

const inputStyle = {
  display: "flex",
  alignItems: "center",
  padding: "12px",
  width: "100%",
};

export default function DriverPage() {
  const [openRegisterDriver, setOpenRegisterDriver] = useState(false);
  const showModalRegister = () => setOpenRegisterDriver(true);
  const handleCancleRegisterDriver = () => setOpenRegisterDriver(false);

  const [user, setUser] = useUserState();
  const [driver, setDriver] = useDriverState();

  // State để lưu tất cả giấy phép
  const [driverLicenses, setDriverLicenses] = useState<DriverLicense[]>([]);
  // State để lưu index của giấy phép đang được chọn
  const [selectedLicenseIndex, setSelectedLicenseIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchLicenseInfo = async () => {
      try {
        setLoading(true);
        const data = await getUserDriverLicenses();
        console.log("Licenses data:", data);

        if (data && Array.isArray(data) && data.length > 0) {
          // Lưu tất cả giấy phép
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

  // Lấy giấy phép hiện tại dựa trên index đã chọn
  const currentLicense = driverLicenses[selectedLicenseIndex];

  // Xử lý trạng thái để hiển thị UI
  const status =
    currentLicense?.status === "VALID" ? "Đã xác thực" : "Chưa xác thực";
  const backgroundColor = status === "Chưa xác thực" ? "#ffd0cd" : "#cff1db";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" tip="Đang tải thông tin giấy phép..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col mb-7 gap-5">
      <div className="flex flex-col pl-10 pr-5 pb-6 relative border rounded-xl border-solid border-neutral-200 p-4">
        <div className="flex items-center justify-between">
          <Title className="flex items-center font-semibold text-xl" level={3}>
            Giấy phép lái xe
            {currentLicense && (
              <p
                className={`rounded-lg text-xs ml-1 ${
                  status === "Chưa xác thực" ? "text-red-500" : "text-green-500"
                }`}
                style={{
                  background: backgroundColor,
                  borderRadius: "100px",
                  padding: "4px 6px",
                }}
              >
                {status}
              </p>
            )}
          </Title>
          <div className="flex">
            <Button type="default" onClick={showModalRegister}>
              Đăng ký giấy phép mới
              <EditOutlined />
            </Button>
            <RegisterDriverModal
              openRegisterDriver={openRegisterDriver}
              handleCancleRegisterDriver={handleCancleRegisterDriver}
            />
          </div>
        </div>
        <div className="flex items-center mb-4">
          <h1 className="text-xs font-medium">
            Cần phải có giấy phép lái xe để sử dụng dịch vụ của RFT
          </h1>
        </div>

        {driverLicenses.length > 0 ? (
          <>
            {/* Hiển thị tabs nếu có nhiều giấy phép */}
            {driverLicenses.length > 1 && (
              <Tabs
                activeKey={selectedLicenseIndex.toString()}
                onChange={(key) => setSelectedLicenseIndex(parseInt(key))}
                className="mb-4"
              >
                {driverLicenses.map((license, index) => (
                  <TabPane
                    tab={
                      <span>
                        <IdcardOutlined /> {license.classField} -{" "}
                        {license.licenseNumber.substring(0, 8)}...
                      </span>
                    }
                    key={index.toString()}
                  />
                ))}
              </Tabs>
            )}

            <div className="content flex flex-row">
              <div className="w-full flex flex-col">
                <Title level={5} className="font-semibold">
                  Thông tin chung
                </Title>
                <div className="w-4/5 flex flex-col">
                  <div className="flex flex-col justify-between mb-4">
                    <Title
                      level={5}
                      className="flex items-center text-xs font-medium mb-2"
                    >
                      Số GPLX
                    </Title>
                    <Input
                      disabled
                      type="text"
                      className="flex items-center text-base font-semibold text-slate-950"
                      size="large"
                      value={currentLicense?.licenseNumber}
                      style={inputStyle}
                    />
                  </div>

                  <div className="flex flex-col justify-between mb-4">
                    <Title
                      level={5}
                      className="flex items-center text-xs font-medium mb-2"
                    >
                      Hạng
                    </Title>
                    <Input
                      disabled
                      type="text"
                      className="flex items-center text-base font-semibold text-slate-950"
                      size="large"
                      value={currentLicense?.classField}
                      style={inputStyle}
                    />
                  </div>

                  {/* <div className="flex flex-col justify-between">
                    <Title
                      level={5}
                      className="flex items-center text-xs font-medium mb-2"
                    >
                      Trạng thái
                    </Title>
                    <Input
                      disabled
                      type="text"
                      className={`flex items-center text-base font-semibold ${
                        status === "Đã xác thực"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                      size="large"
                      value={status}
                      style={inputStyle}
                    />
                  </div> */}
                </div>
              </div>
              <div className="w-full flex flex-col">
                <Title level={5} className="font-semibold">
                  Hình ảnh
                </Title>

                <div className="flex flex-col justify-evenly h-full">
                  <Image
                    className="w-full object-cover"
                    src={
                      currentLicense?.image ||
                      "https://res.cloudinary.com/djllhxlfc/image/upload/v1700240517/cars/default-thumbnail_ycj6n3.jpg"
                    }
                    alt="Driver License"
                    width={300}
                    height={200}
                    fallback="data:image/png;base64,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"
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
            description="Bạn chưa có giấy phép lái xe nào"
            className="my-8"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    </div>
  );
}

DriverPage.Layout = ProfileLayout;
