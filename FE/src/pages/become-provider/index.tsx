import { useState } from "react";
import { useRouter } from "next/router";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useUserState } from "@/recoils/user.state";
import { useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
dayjs.extend(isSameOrAfter);

import {
  Steps,
  Typography,
  Checkbox,
  Button,
  Form,
  Input,
  Radio,
  Space,
  Card,
  Divider,
  theme,
  TimePicker,
  Modal,
} from "antd";
import {
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  CarOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { registerProvider } from "@/apis/provider.api";
import { showError, showSuccess } from "@/utils/toast.utils";

const { Title, Paragraph, Text } = Typography;

// Services data
const rentalServices = [
  { id: "CAR", name: "Ô tô", description: "Cho thuê ô tô các loại" },
  { id: "MOTORBIKE", name: "Xe máy", description: "Cho thuê xe máy các loại" },
  { id: "BICYCLE", name: "Xe đạp", description: "Cho thuê xe đạp các loại" },
];

const BecomeProviderPage = () => {
  const { token } = theme.useToken();
  const [accessToken, setAccessToken, clearAccessToken] =
    useLocalStorage("access_token");
  const [profile, setProfile, clearProfile] = useLocalStorage("profile", "");
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [openTime, setOpenTime] = useState<Dayjs | null>(null);
  const [closeTime, setCloseTime] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [timeOption, setTimeOption] = useState<"fulltime" | "custom">(
    "fulltime"
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [user, setUser] = useUserState();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullname: user.fullName || user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        address: user.address || "",
      });
    }
  }, [user, form]);

  const steps = [
    {
      title: "Điều khoản",
      content: "terms-content",
    },
    {
      title: "Thông tin",
      content: "info-content",
    },
    {
      title: "Dịch vụ",
      content: "service-content",
    },
    {
      title: "Hoàn tất",
      content: "completed-content",
    },
  ];

  const next = () => {
    // Kiểm tra đã đồng ý điều khoản khi ở bước 0
    if (current === 0 && !termsAccepted) {
      showError(
        "Vui lòng đọc và đồng ý với các điều khoản và điều kiện trước khi tiếp tục."
      );
      return;
    }

    if (current === 1) {
      form
        .validateFields()
        .then(() => {
          setCurrent(current + 1);
        })
        .catch((info) => {
          console.log("Validate Failed:", info);
        });
      return;
    }

    // if (current === 2) {
    //   // Validate chọn dịch vụ
    //   if (selectedServices.length === 0) {
    //     showError(
    //       "Cần chọn ít nhất một dịch vụ cho thuê xe bạn muốn cung cấp."
    //     );
    //     return;
    //   }
    //   if (!openTime || !closeTime) {
    //     showError("Vui lòng chọn đầy đủ giờ mở cửa và giờ đóng cửa.");
    //     return;
    //   }
    //   if (!openTime || !closeTime) {
    //     showError("Vui lòng chọn đầy đủ giờ mở cửa và giờ đóng cửa.");
    //     return;
    //   }

    //   // Chỉ cho phép mở 24/24 nếu cả hai đều là 00:00, còn lại phải openTime < closeTime
    //   const isOpenAllDay =
    //     openTime.format("HH:mm") === "00:00" &&
    //     closeTime.format("HH:mm") === "00:00";

    //   if (!isOpenAllDay && openTime.isSameOrAfter(closeTime)) {
    //     showError(
    //       "Giờ mở cửa phải trước giờ đóng cửa (trừ trường hợp mở 24/24 là 00:00 đến 00:00)."
    //     );
    //     return;
    //   }

    //   const formValues = form.getFieldsValue();
    //   const openTimeStr = openTime ? openTime.format("HH:mm") : null;
    //   const closeTimeStr = closeTime ? closeTime.format("HH:mm") : null;

    //   const payload = {
    //     ...formValues,
    //     userId: user?.id,
    //     vehicleTypes: selectedServices,
    //     openTime: openTimeStr,
    //     closeTime: closeTimeStr,
    //   };

    //   setLoading(true);
    //   registerProvider(payload)
    //     .then(() => {
    //       setLoading(false);
    //       setCurrent(current + 1);
    //       showSuccess("Đăng ký thành công!");
    //       // Sau khi chuyển sang bước hoàn tất, timeout 10s rồi logout
    //       setTimeout(() => {
    //         clearAccessToken();
    //         setUser(null);
    //         clearProfile();
    //         window.location.href = "/";
    //       }, 10000);
    //     })
    //     .catch((err) => {
    //       setLoading(false);
    //       showError(
    //         err?.response?.data?.message ||
    //           "Đăng ký thất bại. Vui lòng thử lại sau!"
    //       );
    //     });
    //   return;
    // }

    if (current === 2) {
      // Validate chọn dịch vụ
      if (selectedServices.length === 0) {
        showError(
          "Cần chọn ít nhất một dịch vụ cho thuê xe bạn muốn cung cấp."
        );
        return;
      }

      // Validate thời gian cho custom option
      if (timeOption === "custom") {
        if (!openTime || !closeTime) {
          showError("Vui lòng chọn đầy đủ giờ mở cửa và giờ đóng cửa.");
          return;
        }

        if (openTime.isSameOrAfter(closeTime)) {
          showError("Giờ mở cửa phải trước giờ đóng cửa.");
          return;
        }
      }

      // Hiển thị modal xác nhận
      setShowConfirmModal(true);
      return;
    }

    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const onServiceChange = (serviceId: string, checked: boolean) => {
    setSelectedServices((prev) =>
      checked ? [...prev, serviceId] : prev.filter((id) => id !== serviceId)
    );
  };

  const handleConfirmRegistration = () => {
    const formValues = form.getFieldsValue();

    // Set thời gian dựa trên option đã chọn
    let openTimeStr, closeTimeStr;
    if (timeOption === "fulltime") {
      openTimeStr = "00:00";
      closeTimeStr = "00:00";
    } else {
      openTimeStr = openTime ? openTime.format("HH:mm") : null;
      closeTimeStr = closeTime ? closeTime.format("HH:mm") : null;
    }

    const payload = {
      ...formValues,
      userId: user?.id,
      vehicleTypes: selectedServices,
      openTime: openTimeStr,
      closeTime: closeTimeStr,
    };

    setLoading(true);
    registerProvider(payload)
      .then(() => {
        setLoading(false);
        setShowConfirmModal(false);
        setCurrent(current + 1);
        showSuccess("Đăng ký thành công!");
        setTimeout(() => {
          clearAccessToken();
          setUser(null);
          clearProfile();
          window.location.href = "/";
        }, 10000);
      })
      .catch((err) => {
        setLoading(false);
        showError(
          err?.response?.data?.message ||
            "Đăng ký thất bại. Vui lòng thử lại sau!"
        );
      });
  };

  // Render functions for different steps
  const renderTermsContent = () => (
    <div className="p-6 bg-white rounded-lg shadow">
      <Title level={4}>Điều khoản và Điều kiện Cho Thuê Xe</Title>
      <div className="border p-4 rounded-lg h-64 overflow-y-auto mb-6 bg-gray-50">
        <Paragraph>
          <strong>1. Quy định chung</strong>
          <br />
          1.1. Người cho thuê xe (sau đây gọi là Người cung cấp) phải đảm bảo xe
          cho thuê có đầy đủ giấy tờ hợp pháp.
          <br />
          1.2. Nhà cung cấp phải cung cấp thông tin chính xác về xe và các điều
          kiện cho thuê.
          <br />
          1.3. Nền tảng RFT sẽ thu phí hoa hồng 10% trên mỗi giao dịch thành
          công.
          <br />
          <br />
          <strong>2. Trách nhiệm của nhà cung cấp</strong>
          <br />
          2.1. Đảm bảo xe cho thuê trong tình trạng an toàn và vệ sinh.
          <br />
          2.2. Cung cấp đầy đủ giấy tờ xe theo quy định của pháp luật.
          <br />
          2.3. Tuân thủ lịch đặt và bàn giao xe đúng thời gian đã thỏa thuận.
          <br />
          <br />
          <strong>3. Chính sách bảo hiểm và bồi thường</strong>
          <br />
          3.1. Nhà cung cấp nên có bảo hiểm cho xe cho thuê.
          <br />
          3.2. Trong trường hợp xảy ra tai nạn, hai bên sẽ giải quyết theo quy
          định của pháp luật và điều khoản bảo hiểm.
          <br />
          <br />
          <strong>4. Thông tin thanh toán</strong>
          <br />
          4.1. Nền tảng sẽ chuyển tiền cho Nhà cung cấp trong vòng 24 giờ sau
          khi giao dịch hoàn tất.
          <br />
          4.2. Các khoản phí và thuế liên quan sẽ được trừ trực tiếp trước khi
          thanh toán.
          <br />
          <br />
          <strong>5. Hủy bỏ và hoàn tiền</strong>
          <br />
          5.1. Nhà cung cấp có thể bị phạt nếu hủy đơn đặt xe đã xác nhận mà
          không có lý do chính đáng.
          <br />
          5.2. Các trường hợp hủy đơn và mức phạt được quy định cụ thể trong
          chính sách hủy đơn.
          <br />
        </Paragraph>
      </div>
      <Checkbox
        checked={termsAccepted}
        onChange={(e) => setTermsAccepted(e.target.checked)}
      >
        Tôi đã đọc và đồng ý với các <Text strong>Điều khoản và Điều kiện</Text>{" "}
        của RFT
      </Checkbox>
    </div>
  );

  const renderInfoContent = () => (
    <div className="p-6 bg-white rounded-lg shadow">
      <Title level={4}>Xác nhận thông tin cá nhân</Title>
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="fullname"
          label="Họ và tên"
          rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Số điện thoại"
          rules={[
            { required: true, message: "Vui lòng nhập số điện thoại!" },
            {
              pattern: /^[0-9]{10}$/,
              message: "Số điện thoại phải có 10 chữ số!",
            },
          ]}
        >
          <Input
            prefix={<PhoneOutlined className="text-gray-400" />}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Vui lòng nhập email!" },
            { type: "email", message: "Email không hợp lệ!" },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-gray-400" />}
            size="large"
            disabled
            className="bg-gray-100 cursor-not-allowed"
          />
        </Form.Item>

        <Form.Item
          name="address"
          label="Địa chỉ"
          rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
        >
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} size="large" />
        </Form.Item>
      </Form>
    </div>
  );

  // const renderServiceContent = () => (
  //   <div className="p-6 bg-white rounded-lg shadow">
  //     <Title level={4}>Chọn dịch vụ cho thuê</Title>
  //     <Paragraph className="mb-4 text-gray-600">
  //       Vui lòng chọn (các) dịch vụ cho thuê xe bạn muốn cung cấp trên nền tảng
  //       RFT
  //     </Paragraph>

  //     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 mb-8">
  //       {rentalServices.map((service) => (
  //         <Card
  //           key={service.id}
  //           className={`cursor-pointer transition-all ${
  //             selectedServices.includes(service.id)
  //               ? `border-2 border-[${token.colorPrimary}] shadow-md`
  //               : "border border-gray-200"
  //           }`}
  //           onClick={() =>
  //             onServiceChange(
  //               service.id,
  //               !selectedServices.includes(service.id)
  //             )
  //           }
  //           style={{
  //             borderColor: selectedServices.includes(service.id)
  //               ? token.colorPrimary
  //               : undefined,
  //           }}
  //         >
  //           <div className="flex items-center">
  //             <Checkbox
  //               checked={selectedServices.includes(service.id)}
  //               onChange={(e) => onServiceChange(service.id, e.target.checked)}
  //             />
  //             <div className="ml-4">
  //               <Title level={5} className="mb-0">
  //                 {service.name}
  //               </Title>
  //               <Text type="secondary">{service.description}</Text>
  //             </div>
  //           </div>
  //         </Card>
  //       ))}
  //     </div>
  //     <Title level={4}>Chọn thời gian hoạt động</Title>
  //     <Paragraph className="mb-4 text-gray-600">
  //       Vui lòng chọn giờ mở cửa và đóng cửa cho dịch vụ cho thuê xe của bạn.
  //       <br />
  //       Phải đảm bảo rằng bạn hoạt động trong khoảng thời gian này.
  //     </Paragraph>
  //     <Form layout="inline" className="mb-6 mt-8">
  //       <Form.Item label="Giờ mở cửa">
  //         <TimePicker
  //           value={openTime}
  //           onChange={setOpenTime}
  //           format="HH:mm"
  //           minuteStep={30}
  //           placeholder="Giờ mở cửa"
  //         />
  //       </Form.Item>
  //       <Form.Item label="Giờ đóng cửa">
  //         <TimePicker
  //           value={closeTime}
  //           onChange={setCloseTime}
  //           format="HH:mm"
  //           minuteStep={30}
  //           placeholder="Giờ đóng cửa"
  //         />
  //       </Form.Item>
  //     </Form>
  //   </div>
  // );

  const renderServiceContent = () => (
    <div className="p-6 bg-white rounded-lg shadow">
      <Title level={4}>Chọn dịch vụ cho thuê</Title>
      <Paragraph className="mb-4 text-gray-600">
        Vui lòng chọn (các) dịch vụ cho thuê xe bạn muốn cung cấp trên nền tảng
        RFT
      </Paragraph>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 mb-8">
        {rentalServices.map((service) => (
          <Card
            key={service.id}
            className={`cursor-pointer transition-all ${
              selectedServices.includes(service.id)
                ? `border-2 border-[${token.colorPrimary}] shadow-md`
                : "border border-gray-200"
            }`}
            onClick={() =>
              onServiceChange(
                service.id,
                !selectedServices.includes(service.id)
              )
            }
            style={{
              borderColor: selectedServices.includes(service.id)
                ? token.colorPrimary
                : undefined,
            }}
          >
            <div className="flex items-center">
              <Checkbox
                checked={selectedServices.includes(service.id)}
                onChange={(e) => onServiceChange(service.id, e.target.checked)}
              />
              <div className="ml-4">
                <Title level={5} className="mb-0">
                  {service.name}
                </Title>
                <Text type="secondary">{service.description}</Text>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Title level={4}>Chọn thời gian hoạt động</Title>
      <Paragraph className="mb-4 text-gray-600">
        Vui lòng chọn thời gian hoạt động cho dịch vụ cho thuê xe của bạn.
      </Paragraph>

      <Radio.Group
        value={timeOption}
        onChange={(e) => {
          setTimeOption(e.target.value);
          if (e.target.value === "fulltime") {
            setOpenTime(dayjs("00:00", "HH:mm"));
            setCloseTime(dayjs("00:00", "HH:mm"));
          } else {
            setOpenTime(null);
            setCloseTime(null);
          }
        }}
        className="mb-6"
      >
        <Space direction="vertical" size="large">
          <Radio value="fulltime">
            <div>
              <div className="font-medium">Hoạt động toàn thời gian (24/7)</div>
              <div className="text-gray-500 text-sm">
                Cung cấp dịch vụ 24 giờ/ngày, 7 ngày/tuần
              </div>
            </div>
          </Radio>
          <Radio value="custom">
            <div>
              <div className="font-medium">Chọn khung thời gian hoạt động</div>
              <div className="text-gray-500 text-sm">
                Tự chọn giờ mở cửa và đóng cửa
              </div>
            </div>
          </Radio>
        </Space>
      </Radio.Group>

      {timeOption === "custom" && (
        <div className="ml-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <Form layout="inline" className="mb-4">
            <Form.Item label="Giờ mở cửa">
              <TimePicker
                value={openTime}
                onChange={setOpenTime}
                format="HH:mm"
                minuteStep={30}
                placeholder="Giờ mở cửa"
              />
            </Form.Item>
            <Form.Item label="Giờ đóng cửa">
              <TimePicker
                value={closeTime}
                onChange={setCloseTime}
                format="HH:mm"
                minuteStep={30}
                placeholder="Giờ đóng cửa"
              />
            </Form.Item>
          </Form>
          <Text type="secondary" className="text-sm">
            Phải đảm bảo rằng bạn hoạt động trong khoảng thời gian này.
          </Text>
        </div>
      )}
    </div>
  );

  const renderCompletedContent = () => (
    <div className="p-8 bg-white rounded-lg shadow text-center">
      <div className="text-green-500 text-6xl mb-4">
        <CheckCircleOutlined style={{ color: token.colorSuccess }} />
      </div>
      <Title level={3} style={{ color: token.colorSuccess }}>
        Đăng ký thành công!
      </Title>
      <Paragraph className="text-lg mb-6">
        Cảm ơn bạn đã đăng ký làm người cho thuê xe trên nền tảng RFT. Bây giờ
        bạn có thể bắt đầu cung cấp dịch vụ cho thuê xe và kiếm thêm thu nhập.
      </Paragraph>
      <Paragraph className="text-gray-500">
        Bạn sẽ được chuyển về trang chủ trong vòng 10 giây.
      </Paragraph>
    </div>
  );

  const renderContent = () => {
    switch (current) {
      case 0:
        return renderTermsContent();
      case 1:
        return renderInfoContent();
      case 2:
        return renderServiceContent();
      case 3:
        return renderCompletedContent();
      default:
        return null;
    }
  };

  return (
    <section className="bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <Title level={2}>Đăng ký làm Người cho thuê xe</Title>
          <Text className="text-gray-500">
            Tham gia cung cấp dịch vụ cho thuê xe và tạo thêm thu nhập
          </Text>
        </div>

        <div className="mb-12">
          <Steps
            current={current}
            responsive={true}
            items={steps.map((item) => ({ title: item.title }))}
          />
        </div>

        <div className="mt-8">{renderContent()}</div>

        <div className="mt-8 flex justify-between">
          {current < steps.length - 1 && current > 0 && (
            <Button onClick={prev}>Quay lại</Button>
          )}
          {current === 0 && <div></div>}
          {current < steps.length - 1 && (
            <Button
              type="primary"
              onClick={next}
              loading={current === 2 && loading}
              disabled={current === 0 && !termsAccepted}
            >
              {current === 2 ? "Hoàn tất đăng ký" : "Tiếp theo"}
            </Button>
          )}
        </div>
      </div>

      <Modal
        title="Xác nhận thông tin đăng ký"
        open={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowConfirmModal(false)}>
            Quay lại chỉnh sửa
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={loading}
            onClick={handleConfirmRegistration}
          >
            Xác nhận đăng ký
          </Button>,
        ]}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <Title level={5}>Dịch vụ cung cấp:</Title>
            <div className="flex flex-wrap gap-2">
              {selectedServices.map((serviceId) => {
                const service = rentalServices.find((s) => s.id === serviceId);
                return (
                  <span
                    key={serviceId}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {service?.name}
                  </span>
                );
              })}
            </div>
          </div>

          <div>
            <Title level={5}>Thời gian hoạt động:</Title>
            <Text>
              {timeOption === "fulltime"
                ? "Hoạt động 24/7 (toàn thời gian)"
                : `${openTime?.format("HH:mm")} - ${closeTime?.format(
                    "HH:mm"
                  )} hàng ngày`}
            </Text>
          </div>

          <Divider />

          <Text type="secondary">
            Vui lòng kiểm tra lại thông tin trước khi xác nhận đăng ký.
          </Text>
        </div>
      </Modal>
    </section>
  );
};

export default BecomeProviderPage;
