import { createVehicle, updateVehicle } from "@/apis/vehicle.api";
import { getUserVehicleById, getUserVehicles } from "@/apis/user-vehicles.api";
import { ProfileLayout } from "@/layouts/ProfileLayout";
import { useUserState } from "@/recoils/user.state";
import {
  CarOutlined,
  EditOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  CarFilled,
} from "@ant-design/icons";
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
  Tooltip,
  message,
  Card,
  Steps,
  Alert,
  Typography,
  Divider,
  Empty,
  Tag,
  Tabs,
} from "antd";
import { useEffect, useState } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Vehicle } from "@/types/vehicle";
import { UploadImage } from "@/components/UploadImage";
import { UploadMultipleImage } from "@/components/UploadMultipleImage";
import { VehicleFeature } from "@/types/vehicle";

const { Title, Text } = Typography;
const { Step } = Steps;
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
    // Thêm các hãng xe phổ biến cho cả xe máy và xe đạp
  ];
  // Set form data when vehicle detail is loaded
  // Update the useEffect to handle images correctly
  useEffect(() => {
    if (vehicleDetail.data?.data) {
      const vehicle = vehicleDetail.data.data;

      // Better detection of vehicle type
      let type = VehicleType.CAR; // Default to car

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
      }
      // If no explicit type, infer from properties
      else {
        if (!vehicle.numberSeat && !vehicle.licensePlate) {
          type = VehicleType.BICYCLE;
        } else if (!vehicle.numberSeat && vehicle.licensePlate) {
          type = VehicleType.MOTORBIKE;
        }
      }

      setVehicleType(type);

      // Fix TypeScript errors by using your defined types
      const imageUrls =
        vehicle.vehicleImages?.map(
          (img: { imageUrl: string }) => img.imageUrl
        ) || [];

      const featureNames =
        vehicle.vehicleFeatures?.map(
          (feature: { name: string }) => feature.name
        ) || [];

      // Set all form values
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
        images: imageUrls, // Changed: Set just the URLs
        vehicleFeatures: featureNames, // Changed: Set just the feature names
        fuelType: vehicle.fuelType,
      });

      console.log("Form values set:", form.getFieldsValue());
    }
  }, [vehicleDetail.data, form]);

  const handleVehicleTypeChange = (type: VehicleType) => {
    setVehicleType(type);

    // Reset các trường không liên quan khi đổi loại xe
    if (type === VehicleType.MOTORBIKE) {
      form.setFieldsValue({
        numberSeat: undefined,
        // Keep other fields that apply to motorcycles
        // Don't reset vehicleFeatures and fuelType for motorcycles
      });
    } else if (type === VehicleType.BICYCLE) {
      form.setFieldsValue({
        numberSeat: undefined,
        licensePlate: undefined,
        transmission: undefined,
        vehicleFeatures: undefined, // Reset for bicycles
        fuelType: undefined, // Reset for bicycles
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
          // Fix for TypeScript error by adding explicit type annotation
          const formattedFeatures =
            values.vehicleFeatures?.map((name: string) => ({ name })) || [];

          // Thêm loại phương tiện vào dữ liệu gửi đi
          const submitData = {
            ...values,
            vehicleFeatures: formattedFeatures, // Use formatted features
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
      {/* Tab chọn loại phương tiện */}
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
      {/* Add warning message when editing */}
      {vehicleId && (
        <Alert
          message="Đang chỉnh sửa xe"
          description="Bạn không thể thay đổi loại xe khi đang chỉnh sửa. Nếu muốn đổi loại xe, vui lòng xóa xe này và đăng ký mới."
          type="info"
          showIcon
          className="mb-4"
        />
      )}
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

              {/* Số ghế - chỉ hiển thị cho ô tô */}
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

              {/* Truyền động - chỉ hiển thị cho ô tô và xe máy */}
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

              {/* Biển số xe - chỉ hiển thị cho ô tô và xe máy */}
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

              {/* Trường này luôn hiển thị cho cả 3 loại phương tiện */}
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

  const handlePageChange = (newPage: number, pageSize: number) => {
    setPage(newPage - 1);
    setSize(pageSize);
  };

  const {
    data: myCarsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["user-vehicles", page, size],
    queryFn: () => getUserVehicles(page, size, "createdAt", "desc"),
    enabled: !!accessToken,
  });

  // Truy cập dữ liệu từ response đúng cấu trúc
  const vehicles = myCarsData?.data?.content || [];
  // const totalItems = myCarsData?.data?.totalElements || 0;
  // const totalPages = myCarsData?.data?.totalPages || 0;

  const dataSource = vehicles.map((item: Vehicle, idx: number) => ({
    id: idx + 1,
    vehicleId: item?.id,
    firstImage: item?.vehicleImages?.[0]?.imageUrl || "",
    thumb: item?.thumb,
    brand: item?.brandName,
    model: item?.modelName,
    numberSeat: item?.numberSeat,
    transmissions: item?.transmission,
    licensePlate: item?.licensePlate,
    cost: item?.costPerDay,
    status: item?.status,
  }));

  const handleAddVehicle = () => {
    setEditVehicleId(null);
    setRegisterVehicleModal(true);
  };

  const handleEditVehicle = (vehicleId: string) => {
    setEditVehicleId(vehicleId);
    setRegisterVehicleModal(true);
  };

  // const getStepStatus = () => {
  //   if (
  //     !user?.result?.driverLicenses ||
  //     user?.result?.driverLicenses?.status !== "VALID"
  //   ) {
  //     return 0; // Chưa xác thực GPLX
  //   }
  //   if (vehicles.length === 0) {
  //     return 1; // Chưa đăng ký xe
  //   }
  //   if (vehicles.some((car) => car.status === "Không hoạt động")) {
  //     return 2; // Đã đăng ký xe, đang chờ duyệt
  //   }
  //   return 3; // Đã là tài xế
  // };

  return (
    <div>
      <Title level={3}>
        <CarOutlined /> Đăng ký làm tài xế
      </Title>

      {/* <Card className="mb-6">
        <Steps
          current={getStepStatus()}
          items={[
            {
              title: "Xác thực GPLX",
              description: "Xác thực giấy phép lái xe",
            },
            {
              title: "Đăng ký xe",
              description: "Cung cấp thông tin về xe",
            },
            {
              title: "Chờ duyệt",
              description: "Quản trị viên xem xét",
            },
            {
              title: "Hoàn tất",
              description: "Bạn đã là tài xế",
            },
          ]}
        />

        {getStepStatus() === 0 && (
          <Alert
            message="Bạn cần xác thực giấy phép lái xe trước"
            description={
              <div>
                <p>
                  Để đăng ký làm tài xế, bạn cần phải có giấy phép lái xe hợp lệ
                  đã được xác thực.
                </p>
                <Button type="primary" href="/profile/driver-licenses">
                  Đi đến trang xác thực GPLX
                </Button>
              </div>
            }
            type="info"
            showIcon
            className="mt-4"
          />
        )}
      </Card> */}

      <div className="mb-6 flex justify-between items-center">
        <Title level={4}>Xe của tôi</Title>
        <Button
          type="primary"
          onClick={handleAddVehicle}
          // disabled={getStepStatus() === 0}
        >
          <PlusOutlined /> Đăng ký xe mới
        </Button>
      </div>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : dataSource.length > 0 ? (
        <div className="shadow-lg rounded-md overflow-x-auto">
          <Table
            scroll={{ y: 460, x: 1000 }}
            pagination={{ pageSize: 5 }}
            columns={[
              // Trong phần render của cột bảng
              {
                key: "firstImage",
                title: "Hình ảnh xe",
                dataIndex: "firstImage",
                render: (url) => (
                  <Image
                    className="h-32 aspect-video rounded-md object-cover"
                    src={url}
                    alt="Car thumbnail"
                  />
                ),
              },
              {
                key: "thumb",
                title: "Tên xe",
                dataIndex: "thumb",
              },
              {
                key: "numberSeat",
                title: "Số ghế",
                dataIndex: "numberSeat",
              },
              {
                key: "transmissions",
                title: "Hộp số",
                dataIndex: "transmissions",
              },

              {
                key: "status",
                title: "Trạng thái",
                dataIndex: "status",
                render: (status) => (
                  <Tag color={status === "AVAILABLE" ? "green" : "red"}>
                    {status === "AVAILABLE" ? "Đã duyệt" : "Chờ duyệt"}
                  </Tag>
                ),
              },
              {
                key: "action",
                title: "Thao tác",
                render: (_, vehicle: { vehicleId: string }) => (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => handleEditVehicle(vehicle.vehicleId)}
                  >
                    Sửa
                  </Button>
                ),
              },
            ]}
            dataSource={dataSource}
            rowKey="id"
          />
        </div>
      ) : (
        <Empty
          description={
            <div>
              <p>Bạn chưa đăng ký xe nào</p>
              {/* {getStepStatus() > 0 && ( */}
              {
                <Button type="primary" onClick={handleAddVehicle}>
                  Đăng ký xe ngay
                </Button>
              }
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
          vehicleId={editVehicleId || undefined} // Chuyển null thành undefined
          onOk={() => {
            setRegisterVehicleModal(false);
            refetch();
          }}
        />
      </Modal>

      <Divider />

      <div className="bg-blue-50 p-4 rounded-lg my-6">
        <div className="flex items-center mb-2">
          <InfoCircleOutlined className="text-blue-500 mr-2 text-xl" />
          <Title level={5} className="m-0">
            Quy trình đăng ký làm tài xế
          </Title>
        </div>
        <ol className="list-decimal ml-6 text-gray-700">
          <li className="mb-2">
            Xác thực giấy phép lái xe của bạn ở mục{" "}
            <strong>Giấy phép lái xe</strong>
          </li>
          <li className="mb-2">
            Đăng ký thông tin xe của bạn bằng cách nhấn vào nút{" "}
            <strong>Đăng ký xe mới</strong>
          </li>
          <li className="mb-2">
            Chờ quản trị viên phê duyệt thông tin xe của bạn
          </li>
          <li className="mb-2">
            Khi được duyệt, trạng thái xe sẽ chuyển thành{" "}
            <strong>Đã duyệt</strong> và bạn có thể bắt đầu cho thuê xe
          </li>
        </ol>
        <Text type="secondary">
          Lưu ý: Mọi thông tin cung cấp phải chính xác. Thông tin xe sẽ được
          quản trị viên xem xét kỹ lưỡng trước khi chấp thuận.
        </Text>
      </div>
    </div>
  );
}

UserRegisterVehicle.Layout = ProfileLayout;
