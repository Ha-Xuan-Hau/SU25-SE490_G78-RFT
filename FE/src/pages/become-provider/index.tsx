import { useState } from "react";
import { useRouter } from "next/router";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useUserState, useRefreshUser } from "@/recoils/user.state";
import { useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import {
  getProvinces,
  getDistrictsByProvinceCode,
  getWardsByDistrictCode,
  GeoUnit,
} from "@/lib/vietnam-geo-data";
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
  Select,
} from "antd";
import {
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  CheckCircleOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { registerProvider } from "@/apis/provider.api";
import { updateUserProfile } from "@/apis/user.api";
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
  const [savingProfile, setSavingProfile] = useState(false); // THÊM STATE
  const router = useRouter();

  const [timeOption, setTimeOption] = useState<"fulltime" | "custom">(
    "fulltime"
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [user, setUser] = useUserState();

  const [countdown, setCountdown] = useState(10);

  const refreshUser = useRefreshUser();

  // Thêm các state cho địa chỉ
  const [provinces, setProvinces] = useState<GeoUnit[]>([]);
  const [districts, setDistricts] = useState<GeoUnit[]>([]);
  const [wards, setWards] = useState<GeoUnit[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedWard, setSelectedWard] = useState<string>("");
  const [detailAddress, setDetailAddress] = useState<string>("");

  // Load provinces khi component mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await getProvinces();
        setProvinces(data);
      } catch (error) {
        console.error("Load provinces error:", error);
      }
    };
    loadProvinces();
  }, []);

  // Load districts khi chọn province
  useEffect(() => {
    if (selectedProvince) {
      const loadDistricts = async () => {
        try {
          const provinceCode = provinces.find(
            (p) => p.name === selectedProvince
          )?.code;
          if (provinceCode) {
            const data = await getDistrictsByProvinceCode(provinceCode);
            setDistricts(data);
          }
        } catch (error) {
          setDistricts([]);
        }
      };
      loadDistricts();
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [selectedProvince, provinces]);

  // Load wards khi chọn district
  useEffect(() => {
    if (selectedDistrict) {
      const loadWards = async () => {
        try {
          const districtCode = districts.find(
            (d) => d.name === selectedDistrict
          )?.code;
          if (districtCode) {
            const data = await getWardsByDistrictCode(districtCode);
            setWards(data);
          }
        } catch (error) {
          setWards([]);
        }
      };
      loadWards();
    } else {
      setWards([]);
    }
  }, [selectedDistrict, districts]);

  // Load địa chỉ hiện tại của user vào form
  useEffect(() => {
    if (user?.address) {
      // Parse địa chỉ hiện tại (giả sử format: "Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố")
      const addressParts = user.address.split(", ");
      if (addressParts.length >= 4) {
        setDetailAddress(addressParts[0] || "");
        setSelectedWard(addressParts[1] || "");
        setSelectedDistrict(addressParts[2] || "");
        setSelectedProvince(addressParts[3] || "");
      } else {
        // Nếu địa chỉ không đúng format, set toàn bộ vào detail
        setDetailAddress(user.address);
      }
    }
  }, [user]);

  // Hàm tạo địa chỉ đầy đủ
  const getFullAddress = () => {
    const addressParts = [
      detailAddress,
      selectedWard,
      selectedDistrict,
      selectedProvince,
    ].filter(Boolean); // Loại bỏ các giá trị rỗng

    return addressParts.join(", ");
  };

  useEffect(() => {
    if (user?.registeredVehicles && user.registeredVehicles.length > 0) {
      // Tự động thêm các dịch vụ đã đăng ký vào selectedServices
      setSelectedServices((prev) => {
        const newSelected = [...prev];
        if (user.registeredVehicles) {
          user.registeredVehicles.forEach((vehicleType) => {
            if (!newSelected.includes(vehicleType)) {
              newSelected.push(vehicleType);
            }
          });
        }
        return newSelected;
      });
    }
  }, [user]);

  useEffect(() => {
    if (current === 3) {
      // Bước hoàn tất
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Redirect
            clearAccessToken();
            setUser(null);
            clearProfile();
            window.location.href = "/";
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [current]);

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

  // THÊM HÀM LƯU PROFILE
  const handleSaveProfile = () => {
    form
      .validateFields()
      .then(async (values) => {
        // Validate địa chỉ
        if (
          !selectedProvince ||
          !selectedDistrict ||
          !selectedWard ||
          !detailAddress
        ) {
          showError("Vui lòng điền đầy đủ thông tin địa chỉ!");
          return;
        }

        setSavingProfile(true);
        try {
          // Tạo địa chỉ đầy đủ
          const fullAddress = getFullAddress();

          const updateData = {
            fullName: values.fullname,
            phone: values.phone,
            address: fullAddress, // Địa chỉ đầy đủ với format: "Số nhà, Phường, Quận, Thành phố"
          };

          await updateUserProfile(user?.id, updateData);
          await refreshUser();
          showSuccess("Cập nhật thông tin thành công!");
        } catch (error) {
          console.error("Error updating profile:", error);
          showError("Cập nhật thông tin thất bại!");
        } finally {
          setSavingProfile(false);
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const next = () => {
    // Kiểm tra đã đồng ý điều khoản khi ở bước 0
    if (current === 0 && !termsAccepted) {
      showError(
        "Vui lòng đọc và đồng ý với các điều khoản và điều kiện trước khi tiếp tục."
      );
      return;
    }

    if (current === 1) {
      // Validate địa chỉ
      if (
        !selectedProvince ||
        !selectedDistrict ||
        !selectedWard ||
        !detailAddress
      ) {
        showError("Vui lòng điền đầy đủ thông tin địa chỉ!");
        return;
      }

      form
        .validateFields()
        .then(() => {
          // Update form với địa chỉ đầy đủ
          form.setFieldValue("address", getFullAddress());
          setCurrent(current + 1);
        })
        .catch((info) => {
          console.log("Validate Failed:", info);
        });
      return;
    }

    if (current === 2) {
      // Validate form fields trước
      form
        .validateFields(["deliveryRadius"])
        .then(() => {
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
        })
        .catch(() => {
          showError("Vui lòng điền đầy đủ thông tin!");
        });
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

  const handleCloseModal = () => {
    // Không cho đóng nếu đang loading
    if (loading) {
      return;
    }
    setShowConfirmModal(false);
  };

  const handleConfirmRegistration = () => {
    // Validate lại trước khi submit
    if (!user?.id) {
      showError("Không tìm thấy thông tin người dùng");
      return;
    }

    // Lấy giá trị deliveryRadius từ form
    const deliveryRadius = form.getFieldValue("deliveryRadius");

    // Validate deliveryRadius
    if (!deliveryRadius || deliveryRadius < 1 || deliveryRadius > 100) {
      showError("Phạm vi giao xe không hợp lệ!");
      return;
    }

    // Set thời gian dựa trên option đã chọn
    let openTimeStr, closeTimeStr;
    if (timeOption === "fulltime") {
      openTimeStr = "00:00";
      closeTimeStr = "00:00";
    } else {
      openTimeStr = openTime ? openTime.format("HH:mm") : null;
      closeTimeStr = closeTime ? closeTime.format("HH:mm") : null;

      // Validate custom time
      if (!openTimeStr || !closeTimeStr) {
        showError("Vui lòng chọn thời gian hoạt động");
        return;
      }
    }

    // THÊM deliveryRadius VÀO PAYLOAD
    const payload = {
      userId: user?.id,
      vehicleTypes: selectedServices,
      openTime: openTimeStr,
      closeTime: closeTimeStr,
      deliveryRadius: Number(deliveryRadius), // THÊM TRƯỜNG NÀY
    };

    console.log("Provider registration payload:", payload);

    setLoading(true);
    registerProvider(payload)
      .then(() => {
        setLoading(false);
        setShowConfirmModal(false);
        setCurrent(current + 1);
        showSuccess("Đăng ký thành công!");

        // Clear timeout nếu component unmount
        const timeoutId = setTimeout(() => {
          clearAccessToken();
          setUser(null);
          clearProfile();
          window.location.href = "/";
        }, 10000);

        // Cleanup function
        return () => clearTimeout(timeoutId);
      })
      .catch((err) => {
        setLoading(false);
        setShowConfirmModal(false); // Đóng modal khi lỗi
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
      <Paragraph className="text-gray-600 mb-4">
        Vui lòng kiểm tra và cập nhật thông tin cá nhân của bạn nếu cần thiết
      </Paragraph>
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
          rules={[{ type: "email", message: "Email không hợp lệ!" }]}
        >
          <Input
            prefix={<MailOutlined className="text-gray-400" />}
            size="large"
            disabled
            className="bg-gray-100 cursor-not-allowed"
          />
        </Form.Item>

        {/* Phần địa chỉ với dropdown */}
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-2">
            <span className="text-red-500">* </span>
            Địa chỉ (Khách vui lòng sử dụng địa chỉ trước khi sáp nhập)
          </label>

          {/* 3 Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {/* Tỉnh/Thành phố */}
            <Select
              placeholder="Chọn tỉnh/thành phố"
              size="large"
              value={selectedProvince || undefined}
              onChange={(value) => {
                setSelectedProvince(value);
                setSelectedDistrict("");
                setSelectedWard("");
                form.setFieldValue("province", value);
                form.setFieldValue("district", undefined);
                form.setFieldValue("ward", undefined);
              }}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {provinces.map((p) => (
                <Select.Option key={p.code} value={p.name}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>

            {/* Quận/Huyện */}
            <Select
              placeholder="Chọn quận/huyện"
              size="large"
              value={selectedDistrict || undefined}
              onChange={(value) => {
                setSelectedDistrict(value);
                setSelectedWard("");
                form.setFieldValue("district", value);
                form.setFieldValue("ward", undefined);
              }}
              disabled={!selectedProvince}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {districts.map((d) => (
                <Select.Option key={d.code} value={d.name}>
                  {d.name}
                </Select.Option>
              ))}
            </Select>

            {/* Phường/Xã */}
            <Select
              placeholder="Chọn phường/xã"
              size="large"
              value={selectedWard || undefined}
              onChange={(value) => {
                setSelectedWard(value);
                form.setFieldValue("ward", value);
              }}
              disabled={!selectedDistrict}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {wards.map((w) => (
                <Select.Option key={w.code} value={w.name}>
                  {w.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* Input địa chỉ chi tiết */}
          <Input.TextArea
            placeholder="Số nhà, tên đường, tòa nhà..."
            autoSize={{ minRows: 2, maxRows: 3 }}
            size="large"
            value={detailAddress}
            onChange={(e) => {
              setDetailAddress(e.target.value);
              form.setFieldValue("detailAddress", e.target.value);
            }}
          />

          {/* Hiển thị địa chỉ đầy đủ */}
          {(selectedProvince ||
            selectedDistrict ||
            selectedWard ||
            detailAddress) && (
            <div className="mt-2 p-2 bg-gray-50 rounded">
              <Text type="secondary" className="text-sm">
                Địa chỉ đầy đủ: {getFullAddress() || "Chưa có"}
              </Text>
            </div>
          )}
        </div>
      </Form>
    </div>
  );

  const renderServiceContent = () => (
    <div className="p-6 bg-white rounded-lg shadow">
      <Form form={form} layout="vertical">
        <Title level={4}>Chọn dịch vụ cho thuê</Title>

        {/* ✅ Thêm thông báo cho user đã có registeredVehicles */}
        {user?.registeredVehicles && user.registeredVehicles.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircleOutlined className="text-blue-500 mt-1" />
              <div>
                <Text className="font-medium text-blue-800">
                  Bạn đã đăng ký các dịch vụ sau:
                </Text>
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.registeredVehicles.map((vehicleType) => {
                    const service = rentalServices.find(
                      (s) => s.id === vehicleType
                    );
                    return (
                      <span
                        key={vehicleType}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        ✓ {service?.name}
                      </span>
                    );
                  })}
                </div>
                <Text className="text-blue-600 text-sm mt-2 block">
                  Các dịch vụ đã đăng ký không thể bỏ chọn, bạn chỉ có thể đăng
                  ký thêm dịch vụ mới.
                </Text>
              </div>
            </div>
          </div>
        )}

        <Paragraph className="mb-4 text-gray-600">
          {user?.registeredVehicles && user.registeredVehicles.length > 0
            ? "Bạn có thể đăng ký thêm các dịch vụ cho thuê xe khác trên nền tảng RFT"
            : "Vui lòng chọn (các) dịch vụ cho thuê xe bạn muốn cung cấp trên nền tảng RFT"}
        </Paragraph>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 mb-8">
          {rentalServices.map((service) => {
            // ✅ Check xem service này đã được đăng ký chưa
            const isAlreadyRegistered = user?.registeredVehicles?.includes(
              service.id
            );
            const isSelected = selectedServices.includes(service.id);

            return (
              <Card
                key={service.id}
                className={`transition-all ${
                  isAlreadyRegistered
                    ? `border-2 border-green-400 bg-green-50 cursor-not-allowed` // Đã đăng ký - màu xanh, không click được
                    : isSelected
                    ? `cursor-pointer border-2 border-[${token.colorPrimary}] shadow-md` // Đang chọn - màu primary
                    : "cursor-pointer border border-gray-200 hover:border-gray-300" // Chưa chọn - có thể click
                }`}
                onClick={() => {
                  // ✅ Chỉ cho phép click nếu chưa đăng ký
                  if (!isAlreadyRegistered) {
                    onServiceChange(service.id, !isSelected);
                  }
                }}
                style={{
                  borderColor: isAlreadyRegistered
                    ? "#4ade80" // green-400
                    : isSelected
                    ? token.colorPrimary
                    : undefined,
                }}
              >
                <div className="flex items-center">
                  <Checkbox
                    checked={isSelected || isAlreadyRegistered} // ✅ Checked nếu đã chọn HOẶC đã đăng ký
                    disabled={isAlreadyRegistered} // ✅ Disable nếu đã đăng ký
                    style={{ pointerEvents: "none" }}
                  />
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <Title
                        level={5}
                        className={`mb-0 ${
                          isAlreadyRegistered ? "text-green-700" : ""
                        }`}
                      >
                        {service.name}
                      </Title>
                      {/* ✅ Hiển thị badge "Đã đăng ký" */}
                      {isAlreadyRegistered && (
                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          Đã đăng ký
                        </span>
                      )}
                    </div>
                    <Text
                      type="secondary"
                      className={isAlreadyRegistered ? "text-green-600" : ""}
                    >
                      {service.description}
                    </Text>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Phần phạm vi giao xe và thời gian hoạt động giữ nguyên */}
        {/* PHẦN PHẠM VI GIAO XE - Đặt trong Form */}
        <div className="mb-8">
          <Title level={4}>Phạm vi giao xe tận nơi</Title>
          <Paragraph className="mb-4 text-gray-600">
            Xác định khoảng cách tối đa bạn có thể giao xe cho khách hàng
          </Paragraph>
          <Form.Item
            name="deliveryRadius"
            label="Phạm vi chấp nhận giao xe tận nơi"
            rules={[
              { required: true, message: "Vui lòng nhập phạm vi giao xe!" },
              {
                validator: (_, value) => {
                  const num = Number(value);
                  if (isNaN(num) || num < 1 || num > 100) {
                    return Promise.reject("Phạm vi phải từ 1-100 km");
                  }
                  return Promise.resolve();
                },
              },
            ]}
            initialValue={5}
          >
            <Input
              type="number"
              min={1}
              max={100}
              addonAfter="km"
              placeholder="Nhập phạm vi (km)"
              style={{ width: 200 }}
            />
          </Form.Item>
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
                <div className="font-medium">
                  Hoạt động toàn thời gian (24/7)
                </div>
                <div className="text-gray-500 text-sm">
                  Cung cấp dịch vụ 24 giờ/ngày, 7 ngày/tuần
                </div>
              </div>
            </Radio>
            <Radio value="custom">
              <div>
                <div className="font-medium">
                  Chọn khung thời gian hoạt động
                </div>
                <div className="text-gray-500 text-sm">
                  Tự chọn giờ mở cửa và đóng cửa
                </div>
              </div>
            </Radio>
          </Space>
        </Radio.Group>

        {timeOption === "custom" && (
          <div className="ml-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giờ mở cửa
                </label>
                <TimePicker
                  value={openTime}
                  onChange={setOpenTime}
                  format="HH:mm"
                  minuteStep={30}
                  placeholder="Chọn giờ"
                  showNow={false}
                  allowClear={true}
                  defaultOpenValue={dayjs().minute(0).second(0)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giờ đóng cửa
                </label>
                <TimePicker
                  value={closeTime}
                  onChange={setCloseTime}
                  format="HH:mm"
                  minuteStep={30}
                  placeholder="Chọn giờ"
                  showNow={false}
                  allowClear={true}
                  defaultOpenValue={dayjs().minute(0).second(0)}
                />
              </div>
            </div>
            <Text type="secondary" className="text-sm">
              Phải đảm bảo rằng bạn hoạt động trong khoảng thời gian này.
            </Text>
          </div>
        )}
      </Form>
    </div>
  );
  const renderCompletedContent = () => {
    const isProviderUpdate = user?.role === "PROVIDER";
    const newServices = selectedServices.filter(
      (serviceId) => !user?.registeredVehicles?.includes(serviceId)
    );
    const existingServices = selectedServices.filter((serviceId) =>
      user?.registeredVehicles?.includes(serviceId)
    );

    return (
      <div className="p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">
            <CheckCircleOutlined style={{ color: token.colorSuccess }} />
          </div>

          <Title level={3} style={{ color: token.colorSuccess }}>
            {isProviderUpdate
              ? "Cập nhật dịch vụ thành công!"
              : "Đăng ký thành công!"}
          </Title>

          <Paragraph className="text-lg mb-6">
            {isProviderUpdate ? (
              <>
                Tài khoản của bạn đã được cập nhật với{" "}
                <strong>{newServices.length} dịch vụ mới</strong>.
                <br />
                Bạn có thể tiếp tục cung cấp dịch vụ cho thuê xe trên nền tảng
                RFT.
              </>
            ) : (
              <>
                Cảm ơn bạn đã đăng ký làm người cho thuê xe trên nền tảng RFT.
                <br />
                Bây giờ bạn có thể bắt đầu cung cấp dịch vụ cho thuê xe và kiếm
                thêm thu nhập.
              </>
            )}
          </Paragraph>
        </div>

        {/* Chi tiết dịch vụ */}
        <div className="mt-6 space-y-4">
          {isProviderUpdate && existingServices.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <Text className="text-blue-700 font-medium block mb-2">
                Dịch vụ đã có:
              </Text>
              <div className="flex flex-wrap gap-2 justify-center">
                {existingServices.map((serviceId) => {
                  const service = rentalServices.find(
                    (s) => s.id === serviceId
                  );
                  return (
                    <span
                      key={serviceId}
                      className="px-3 py-1 bg-white text-blue-600 rounded-full text-sm border border-blue-200"
                    >
                      ✓ {service?.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {isProviderUpdate && newServices.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <Text className="text-green-700 font-medium block mb-2">
                Dịch vụ mới thêm:
              </Text>
              <div className="flex flex-wrap gap-2 justify-center">
                {newServices.map((serviceId) => {
                  const service = rentalServices.find(
                    (s) => s.id === serviceId
                  );
                  return (
                    <span
                      key={serviceId}
                      className="px-3 py-1 bg-white text-green-600 rounded-full text-sm border border-green-200 font-medium"
                    >
                      + {service?.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {!isProviderUpdate && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <Text className="text-gray-700 font-medium block mb-2">
                Dịch vụ đã đăng ký:
              </Text>
              <div className="flex flex-wrap gap-2 justify-center">
                {selectedServices.map((serviceId) => {
                  const service = rentalServices.find(
                    (s) => s.id === serviceId
                  );
                  return (
                    <span
                      key={serviceId}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                    >
                      {service?.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Paragraph className="text-gray-500 text-center mt-6">
          Bạn sẽ được chuyển về trang chủ trong vòng {countdown} giây.
        </Paragraph>
      </div>
    );
  };

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

          {/* SỬA LẠI PHẦN NÚT CHO BƯỚC 1 (THÔNG TIN) */}
          {current === 1 && (
            <div className="flex gap-3">
              <Button
                icon={<SaveOutlined />}
                onClick={handleSaveProfile}
                loading={savingProfile}
              >
                Lưu chỉnh sửa
              </Button>
              <Button type="primary" onClick={next}>
                Tiếp theo
              </Button>
            </div>
          )}

          {/* CÁC BƯỚC KHÁC */}
          {current < steps.length - 1 && current !== 1 && (
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
        onCancel={handleCloseModal}
        maskClosable={!loading}
        closable={!loading}
        footer={[
          <Button key="cancel" onClick={handleCloseModal} disabled={loading}>
            Quay lại chỉnh sửa
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={loading}
            onClick={handleConfirmRegistration}
          >
            {user?.role === "PROVIDER"
              ? "Cập nhật dịch vụ"
              : "Xác nhận đăng ký"}
          </Button>,
        ]}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <Title level={5}>
              {user?.role === "PROVIDER"
                ? "Dịch vụ hiện tại:"
                : "Dịch vụ cung cấp:"}
            </Title>
            <div className="flex flex-wrap gap-2">
              {selectedServices.map((serviceId) => {
                const service = rentalServices.find((s) => s.id === serviceId);
                const isAlreadyRegistered =
                  user?.registeredVehicles?.includes(serviceId);

                return (
                  <span
                    key={serviceId}
                    className={`px-3 py-1 rounded-full text-sm ${
                      isAlreadyRegistered
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {isAlreadyRegistered && "✓ "}
                    {service?.name}
                    {isAlreadyRegistered && " (Đã có)"}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Phần còn lại giữ nguyên */}
          <div>
            <Title level={5}>Phạm vi giao xe:</Title>
            <Text>{form.getFieldValue("deliveryRadius")} km</Text>
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
            {user?.role === "PROVIDER"
              ? "Vui lòng kiểm tra lại thông tin trước khi cập nhật dịch vụ."
              : "Vui lòng kiểm tra lại thông tin trước khi xác nhận đăng ký."}
          </Text>
        </div>
      </Modal>
    </section>
  );
};

export default BecomeProviderPage;
