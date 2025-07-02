"use client";

import { createVehicle, updateVehicle } from "@/apis/vehicle.api";
import { getUserVehicleById, getUserVehicles } from "@/apis/user-vehicles.api";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import { useUserState } from "@/recoils/user.state";
import { EditOutlined, PlusOutlined, CarFilled } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Button,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Select,
  Skeleton,
  Table,
  message,
  Card,
  Typography,
  Empty,
  Tag,
  Tabs,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";
import type { Vehicle } from "@/types/vehicle";
import { UploadMultipleImage } from "@/components/UploadMultipleImage";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

enum VehicleType {
  CAR = "Car",
  MOTORBIKE = "Motorbike",
  BICYCLE = "Bicycle",
}

interface RegisterVehicleFormProps {
  vehicleId?: string;
  onOk?: () => void;
}

function RegisterVehicleForm({ vehicleId, onOk }: RegisterVehicleFormProps) {
  const [user] = useUserState();
  const [accessToken] = useLocalStorage("access_token");
  const isInsert = !vehicleId;
  const [form] = Form.useForm();
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.CAR);

  const vehicleDetail = useQuery({
    queryFn: () => getUserVehicleById(vehicleId),
    queryKey: ["GET_VEHICLE", vehicleId],
    enabled: !!vehicleId,
  });

  const apiCreateVehicle = useMutation({
    mutationFn: createVehicle,
  });

  const apiUpdateCar = useMutation({
    mutationFn: updateVehicle,
  });

  const featureOptions = [
    { label: "GPS", value: "GPS" },
    { label: "Bluetooth", value: "Bluetooth" },
    { label: "Điều hoà khí", value: "Air Conditioning" },
    { label: "Ghế da", value: "Leather Seats" },
    { label: "Cảm biến đỗ xe", value: "Parking Sensors" },
    { label: "Camera hành trình", value: "Backup Camera" },
    { label: "Kính chống nắng", value: "Sunroof" },
    { label: "Ghế sưởi", value: "Heated Seats" },
  ];

  const fuelTypeOptions = [
    { value: "GASOLINE", label: "Xăng" },
    { value: "DIESEL", label: "Dầu" },
    { value: "ELECTRIC", label: "Điện" },
    { value: "HYBRID", label: "Hybrid" },
  ];

  const brandOptions = [
    { value: "toyota", label: "Toyota" },
    { value: "honda", label: "Honda" },
    { value: "yamaha", label: "Yamaha" },
    { value: "suzuki", label: "Suzuki" },
    { value: "vespa", label: "Vespa" },
    { value: "giant", label: "Giant" },
    { value: "trek", label: "Trek" },
    { value: "specialized", label: "Specialized" },
  ];

  useEffect(() => {
    if (vehicleDetail.data?.data) {
      const vehicle = vehicleDetail.data.data;

      let type = VehicleType.CAR;

      if (vehicle.vehicleType) {
        if (
          vehicle.vehicleType === "MOTORBIKE" ||
          vehicle.vehicleType === "Motorbike"
        ) {
          type = VehicleType.MOTORBIKE;
        } else if (
          vehicle.vehicleType === "BICYCLE" ||
          vehicle.vehicleType === "Bicycle"
        ) {
          type = VehicleType.BICYCLE;
        }
      } else {
        if (!vehicle.numberSeat && !vehicle.licensePlate) {
          type = VehicleType.BICYCLE;
        } else if (!vehicle.numberSeat && vehicle.licensePlate) {
          type = VehicleType.MOTORBIKE;
        }
      }

      setVehicleType(type);

      const imageUrls =
        vehicle.vehicleImages?.map(
          (img: { imageUrl: string }) => img.imageUrl
        ) || [];

      const featureNames =
        vehicle.vehicleFeatures?.map(
          (feature: { name: string }) => feature.name
        ) || [];

      form.setFieldsValue({
        brandName: vehicle.brandName,
        modelName: vehicle.modelName,
        thumb: vehicle.thumb,
        numberSeat: vehicle.numberSeat?.toString(),
        transmission: vehicle.transmission,
        licensePlate: vehicle.licensePlate,
        yearOfManufacture: vehicle.yearManufacture,
        costPerDay: vehicle.costPerDay,
        description: vehicle.description,
        images: imageUrls,
        vehicleFeatures: featureNames,
        fuelType: vehicle.fuelType,
      });
    }
  }, [vehicleDetail.data, form]);

  const handleVehicleTypeChange = (type: VehicleType) => {
    setVehicleType(type);

    if (type === VehicleType.MOTORBIKE) {
      form.setFieldsValue({
        numberSeat: undefined,
      });
    } else if (type === VehicleType.BICYCLE) {
      form.setFieldsValue({
        numberSeat: undefined,
        licensePlate: undefined,
        transmission: undefined,
        vehicleFeatures: undefined,
        fuelType: undefined,
      });
    }
  };

  if (vehicleId && vehicleDetail.isLoading) {
    return <Skeleton active />;
  }

  return (
    <Form
      form={form}
      layout="vertical"
      className="flex flex-col gap-4"
      initialValues={{
        vehicleType: VehicleType.CAR,
      }}
      onFinish={async (values) => {
        try {
          const formattedFeatures =
            values.vehicleFeatures?.map((name: string) => ({ name })) || [];

          const submitData = {
            ...values,
            vehicleFeatures: formattedFeatures,
            vehicleType,
            user: user?.id || user?.result?.id,
          };

          if (isInsert) {
            await apiCreateVehicle.mutateAsync({
              body: submitData,
              accessToken,
            });
            message.success("Đăng ký xe thành công, vui lòng chờ duyệt");
          } else {
            await apiUpdateCar.mutateAsync({
              vehicleId,
              body: submitData,
              accessToken,
            });
            message.success("Cập nhật thông tin xe thành công");
          }

          onOk?.();
          form.resetFields();
        } catch (error) {
          message.error("Có lỗi xảy ra khi đăng ký xe");
          console.error(error);
        }
      }}
    >
      <Tabs
        activeKey={vehicleType}
        onChange={
          !vehicleId
            ? (key) => handleVehicleTypeChange(key as VehicleType)
            : undefined
        }
        className="mb-4"
        tabBarStyle={
          vehicleId ? { pointerEvents: "none", opacity: 0.6 } : undefined
        }
      >
        <TabPane
          tab={
            <>
              <CarFilled /> Ô tô
              {vehicleId &&
                vehicleType === VehicleType.CAR &&
                " (Đang chỉnh sửa)"}
            </>
          }
          key={VehicleType.CAR}
        />
        <TabPane
          tab={
            <>
              <CarFilled /> Xe máy
              {vehicleId &&
                vehicleType === VehicleType.MOTORBIKE &&
                " (Đang chỉnh sửa)"}
            </>
          }
          key={VehicleType.MOTORBIKE}
        />
        <TabPane
          tab={
            <>
              <CarFilled /> Xe đạp
              {vehicleId &&
                vehicleType === VehicleType.BICYCLE &&
                " (Đang chỉnh sửa)"}
            </>
          }
          key={VehicleType.BICYCLE}
        />
      </Tabs>

      <div className="md:flex gap-6">
        <div className="md:w-2/5">
          <Card title="Hình ảnh xe" className="mb-4">
            <Form.Item
              label="Các hình ảnh xe"
              name="images"
              rules={[
                {
                  required: true,
                  message: "Vui lòng tải lên ít nhất một hình ảnh",
                },
              ]}
              tooltip="Tải lên nhiều hình ảnh để người thuê có thể thấy rõ tình trạng xe"
            >
              <UploadMultipleImage />
            </Form.Item>
          </Card>
        </div>

        <div className="md:w-3/5">
          <Card title="Thông tin xe" className="mb-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Form.Item
                label="Tên hiển thị xe"
                name="thumb"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên hiển thị cho xe",
                  },
                ]}
              >
                <Input placeholder="Ví dụ: Toyota Camry 2022 - Sang trọng, đầy đủ tiện nghi" />
              </Form.Item>

              {(vehicleType === VehicleType.CAR ||
                vehicleType === VehicleType.MOTORBIKE) && (
                <Form.Item
                  label="Loại nhiên liệu"
                  name="fuelType"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn loại nhiên liệu",
                    },
                  ]}
                >
                  <Select
                    placeholder="Chọn loại nhiên liệu"
                    options={fuelTypeOptions}
                  />
                </Form.Item>
              )}

              {(vehicleType === VehicleType.CAR ||
                vehicleType === VehicleType.MOTORBIKE) && (
                <Form.Item
                  label="Tiện ích xe"
                  name="vehicleFeatures"
                  className="md:col-span-2"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn ít nhất một tiện ích",
                    },
                  ]}
                  tooltip="Chọn các tiện ích có sẵn trên xe của bạn"
                >
                  <Select
                    mode="multiple"
                    placeholder="Chọn các tiện ích của xe"
                    options={featureOptions}
                    optionFilterProp="label"
                    style={{ width: "100%" }}
                    tokenSeparators={[","]}
                    allowClear
                  />
                </Form.Item>
              )}

              <Form.Item
                label="Hãng xe"
                name="brandName"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập hãng xe",
                  },
                ]}
              >
                <Input placeholder="Nhập tên hãng xe (VD: Toyota, Honda...)" />
              </Form.Item>

              <Form.Item
                label="Loại xe"
                name="modelName"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập loại xe",
                  },
                ]}
              >
                <Input placeholder="Nhập loại xe" />
              </Form.Item>

              {vehicleType === VehicleType.CAR && (
                <Form.Item
                  label="Số ghế"
                  name="numberSeat"
                  rules={[
                    {
                      required: vehicleType === VehicleType.CAR,
                      message: "Vui lòng chọn số ghế của xe",
                    },
                  ]}
                >
                  <Select
                    placeholder="Chọn số ghế"
                    options={[
                      { value: "2 chỗ" },
                      { value: "4 chỗ" },
                      { value: "5 chỗ" },
                      { value: "7 chỗ" },
                      { value: "9 chỗ" },
                      { value: "12 chỗ" },
                    ]}
                  />
                </Form.Item>
              )}

              {(vehicleType === VehicleType.CAR ||
                vehicleType === VehicleType.MOTORBIKE) && (
                <Form.Item
                  label="Truyền động"
                  name="transmission"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn loại hộp số",
                    },
                  ]}
                >
                  <Select
                    placeholder="Chọn loại hộp số"
                    options={
                      vehicleType === VehicleType.CAR
                        ? [
                            { value: "MANUAL", label: "Số sàn" },
                            { value: "AUTOMATIC", label: "Số tự động" },
                          ]
                        : [
                            { value: "MANUAL", label: "Số côn tay" },
                            { value: "AUTOMATIC", label: "Xe ga" },
                          ]
                    }
                  />
                </Form.Item>
              )}

              {(vehicleType === VehicleType.CAR ||
                vehicleType === VehicleType.MOTORBIKE) && (
                <Form.Item
                  label="Biển số xe"
                  name="licensePlate"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập biển số xe",
                    },
                  ]}
                >
                  <Input
                    placeholder={
                      vehicleType === VehicleType.CAR
                        ? "Ví dụ: 51F-123.45"
                        : "Ví dụ: 59P1-12345"
                    }
                  />
                </Form.Item>
              )}

              <Form.Item
                label="Năm sản xuất"
                name="yearOfManufacture"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập năm sản xuất",
                  },
                ]}
              >
                <InputNumber
                  className="w-full"
                  min={1990}
                  max={new Date().getFullYear()}
                  placeholder="Nhập năm sản xuất"
                />
              </Form.Item>

              <Form.Item
                label="Giá thuê/ngày (VNĐ)"
                name="costPerDay"
                className={
                  vehicleType === VehicleType.BICYCLE ? "" : "md:col-span-2"
                }
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập giá thuê",
                  },
                ]}
              >
                <InputNumber className="w-full" />
              </Form.Item>

              <Form.Item
                label="Mô tả xe"
                name="description"
                className="md:col-span-2"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập mô tả về xe",
                  },
                ]}
              >
                <Input.TextArea
                  rows={5}
                  placeholder="Nhập thông tin chi tiết về xe, tính năng đặc biệt, tình trạng xe..."
                />
              </Form.Item>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="primary" htmlType="submit" size="large">
              {isInsert ? "Đăng ký xe" : "Cập nhật thông tin"}
            </Button>
          </div>
        </div>
      </div>
    </Form>
  );
}

export default function UserRegisterVehicle() {
  const [registerVehicleModal, setRegisterVehicleModal] = useState(false);
  const [editVehicleId, setEditVehicleId] = useState<Vehicle["id"] | null>(
    null
  );
  const [accessToken] = useLocalStorage("access_token");

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);

  const {
    data: myCarsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["user-vehicles", page, size],
    queryFn: () => getUserVehicles(page, size, "createdAt", "desc"),
    enabled: !!accessToken,
  });

  const vehicles = myCarsData?.data?.content || [];

  const handleAddVehicle = () => {
    setEditVehicleId(null);
    setRegisterVehicleModal(true);
  };

  const handleEditVehicle = (vehicleId: string) => {
    setEditVehicleId(vehicleId);
    setRegisterVehicleModal(true);
  };

  const columns: ColumnsType<Vehicle> = [
    {
      title: "Hình ảnh",
      dataIndex: "vehicleImages",
      key: "vehicleImages",
      width: 120,
      render: (vehicleImages: Vehicle["vehicleImages"]) => (
        <Image
          className="w-20 h-14 rounded-lg object-cover"
          src={
            vehicleImages?.[0]?.imageUrl ||
            "/placeholder.svg?height=56&width=80"
          }
          alt="Vehicle thumbnail"
          fallback="/placeholder.svg?height=56&width=80"
        />
      ),
    },
    {
      title: "Thông tin xe",
      key: "vehicleInfo",
      render: (_, record: Vehicle) => (
        <div>
          <div className="font-medium text-gray-900">{record.thumb}</div>
          <div className="text-sm text-gray-500">
            {record.brandName} {record.modelName}
          </div>
        </div>
      ),
    },
    {
      title: "Thông số",
      key: "specs",
      render: (_, record: Vehicle) => (
        <div className="text-sm">
          {record.numberSeat && (
            <div>
              Ghế: <span className="font-medium">{record.numberSeat}</span>
            </div>
          )}
          {record.transmission && (
            <div>
              Hộp số: <span className="font-medium">{record.transmission}</span>
            </div>
          )}
          {record.licensePlate && (
            <div>
              Biển số:{" "}
              <span className="font-medium">{record.licensePlate}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Giá thuê/ngày",
      dataIndex: "costPerDay",
      key: "costPerDay",
      render: (cost: number) => (
        <div className="font-semibold text-green-600">
          {cost?.toLocaleString("vi-VN")} VNĐ
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag
          color={status === "AVAILABLE" ? "green" : "orange"}
          className="rounded-full px-3 py-1"
        >
          {status === "AVAILABLE" ? "Đã duyệt" : "Chờ duyệt"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record: Vehicle) => (
        <Button
          type="primary"
          size="small"
          className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
          onClick={() => handleEditVehicle(record.id)}
        >
          <EditOutlined /> Chỉnh sửa
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-start">
          <div>
            <Title level={2} className="mb-2 text-gray-900">
              Danh sách xe của tôi
            </Title>
            <Text className="text-gray-600">
              Quản lý và theo dõi tình trạng các xe đã đăng ký
            </Text>
          </div>
          <Button
            type="primary"
            onClick={handleAddVehicle}
            className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
          >
            <PlusOutlined /> Đăng ký xe mới
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : vehicles.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table<Vehicle>
            columns={columns}
            dataSource={vehicles}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showQuickJumper: false,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} xe`,
            }}
            className="vehicle-table"
          />
        </div>
      ) : (
        <Empty
          description={
            <div>
              <p>Bạn chưa đăng ký xe nào</p>
              <Button type="primary" onClick={handleAddVehicle}>
                Đăng ký xe ngay
              </Button>
            </div>
          }
        />
      )}

      <Modal
        open={registerVehicleModal}
        title={editVehicleId ? "Cập nhật thông tin xe" : "Đăng ký xe mới"}
        width={1000}
        style={{ top: 20 }}
        destroyOnClose
        footer={null}
        onCancel={() => setRegisterVehicleModal(false)}
      >
        <RegisterVehicleForm
          vehicleId={editVehicleId || undefined}
          onOk={() => {
            setRegisterVehicleModal(false);
            refetch();
          }}
        />
      </Modal>
    </div>
  );
}

UserRegisterVehicle.Layout = ProviderLayout;
