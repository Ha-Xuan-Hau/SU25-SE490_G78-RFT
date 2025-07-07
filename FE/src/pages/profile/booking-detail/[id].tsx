import React, { useState } from "react";
import { useRouter } from "next/router";
import { Image, Space, Divider, Table } from "antd";
import {
  ContainerOutlined,
  DownloadOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  UserOutlined,
  CarOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { formatCurrency } from "@/lib/format-currency";
import { showSuccess, showError } from "@/utils/toast.utils";

// Mock data for car123
const mockBookingData = {
  result: {
    _id: "booking123",
    carId: {
      _id: "car123",
      model: {
        name: "Toyota Camry",
      },
      yearManufacture: 2022,
      thumb: "/images/demo1.png",
      cost: 800000,
      numberSeat: 5,
      numberCar: "30A-12345",
      transmissions: "Số tự động",
    },
    timeBookingStart: "2023-06-15T00:00:00.000Z",
    timeBookingEnd: "2023-06-20T00:00:00.000Z",
    totalCost: 4000000,
    status: "Đã duyệt",
    address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
    phone: "0987654321",
    bookBy: {
      fullname: "Nguyễn Văn A",
      address: "456 Đường Nguyễn Huệ, Quận 1, TP.HCM",
    },
    contract: {
      status: "Đã tất toán",
      images: [
        "/images/demo1.png",
        "/images/contract1.jpg",
        "/images/contract2.jpg",
      ],
    },
  },
};

export default function BookingDetailPage() {
  const router = useRouter();
  const bookingId = router.query.id;

  // Mock data instead of API call
  const data = mockBookingData;
  const src = data?.result?.carId?.thumb;
  const [isPreviewVisible, setPreviewVisible] = useState(false);

  const onDownload = () => {
    if (!src) {
      showError("Không có hình ảnh để tải xuống!");
      return;
    }

    try {
      // This is a mock implementation
      const link = document.createElement("a");
      link.href = src;
      link.download = "booking-image.png";
      document.body.appendChild(link);
      link.click();
      link.remove();

      showSuccess("Tải xuống hình ảnh thành công!");
    } catch (error) {
      showError("Có lỗi xảy ra khi tải xuống hình ảnh!");
    }
  };

  return (
    <section>
      <div className="flex flex-col my-6 py-2 max-w-6xl mx-auto">
        <p className="flex justify-center items-center text-2xl font-bold mt-0 mb-8">
          Thông tin chi tiết
        </p>
        <div className="flex flex-row w-full gap-4">
          <div className="flex flex-col bg-neutral-50 p-4 ml-5 mr-5 w-1/2 shadow-xl rounded-lg">
            <div className="flex p-4">
              <Image
                width={200}
                src={src}
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
              <div className="flex flex-col ml-5 justify-between">
                <h2 className="text-green-500 font-semibold">
                  {data?.result?.carId?.model?.name}{" "}
                  {data?.result?.carId?.yearManufacture}
                </h2>
                <span className="flex items-center text-base font-semibold">
                  <UserOutlined className="mr-2 text-green-500" />
                  {data?.result?.carId?.numberSeat} ghế
                </span>
                <span className="flex items-center text-base font-semibold">
                  <CarOutlined className="mr-2 text-green-500" />
                  {data?.result?.carId?.numberCar}
                </span>
                <span className="flex items-center text-base font-semibold">
                  <SettingOutlined className="mr-2 text-green-500" />
                  {data?.result?.carId?.transmissions}
                </span>
              </div>
            </div>
            <Divider className="m-0 w-full border-1 border-gray-400" />
            <div className="flex flex-col">
              <div className="grid grid-cols-2 gap-4 ml-5"></div>

              <div className="flex flex-col items-center w-full ">
                <div className="p-4 w-full">
                  <h3 className="mt-0">Địa điểm giao xe</h3>
                  <span className="font-medium text-gray-800">
                    {data?.result?.address}
                  </span>
                </div>
                <Divider className="m-0 w-full border-1 border-gray-400" />

                <div className="w-full p-4">
                  <h3 className="mt-0">Thông tin người nhận</h3>
                  <span className="font-medium text-gray-800 text-sm">
                    Tên: {data?.result?.bookBy?.fullname}
                  </span>
                  <p className="font-medium text-gray-800">
                    Số điện thoại: {data?.result?.phone}
                  </p>
                  <p className="font-medium text-gray-800">
                    Địa chỉ: {data?.result?.bookBy?.address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-9 bg-neutral-50 shadow-xl rounded-lg w-1/2">
            <Table
              className="bg-transparent [&_.ant-table]:bg-transparent [&_.ant-table-thead>tr>th]:border-b-gray-400 [&_.ant-table-tbody>tr>td]:border-b-gray-400"
              columns={[
                { dataIndex: "label" },
                { dataIndex: "price", className: "text-right" },
              ]}
              bordered={false}
              showHeader={false}
              pagination={false}
              rowKey={(row) => row.label}
              dataSource={[
                {
                  label: "Ngày nhận xe",
                  price: moment(data?.result?.timeBookingStart).format(
                    "DD-MM-YYYY"
                  ),
                },
                {
                  label: "Ngày trả xe",
                  price: moment(data?.result?.timeBookingEnd).format(
                    "DD-MM-YYYY"
                  ),
                },
                {
                  label: "Đơn giá thuê",
                  price: formatCurrency(data?.result?.carId?.cost) + "/ngày",
                },
                {
                  label: "Phương thức thanh toán",
                  price: "VNPay",
                },
              ]}
            />
            <div className="pl-4 flex items-center justify-between m-0">
              <h3 className="text-green-500 text-lg m-0">Tổng giá thuê:</h3>
              <h3 className="text-green-500 text-lg m-0">
                {formatCurrency(data?.result?.totalCost)}
              </h3>
            </div>
            {data?.result?.contract && (
              <Image.PreviewGroup
                preview={{
                  visible: isPreviewVisible,
                  onChange: (current, prev) =>
                    console.log(
                      `current index: ${current}, prev index: ${prev}`
                    ),
                  onVisibleChange: (visible) => setPreviewVisible(visible),
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
                      <DownloadOutlined onClick={onDownload} />
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
              >
                <div className="pl-4 flex justify-end">
                  <a
                    className="text-base cursor-pointer"
                    onClick={() => setPreviewVisible(!isPreviewVisible)}
                  >
                    <ContainerOutlined className="mr-1" />
                    Xem hợp đồng
                  </a>
                </div>
                <div className="hidden">
                  {data?.result?.contract?.images.map((src, idx) => (
                    <Image key={idx} src={src} />
                  ))}
                </div>
              </Image.PreviewGroup>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
