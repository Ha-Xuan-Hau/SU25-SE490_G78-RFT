"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import {
  CheckCircleOutlined,
  SolutionOutlined,
  PayCircleOutlined,
  SmileOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Steps,
  Radio,
  Space,
  DatePicker,
  message,
  Spin,
} from "antd";
import Image from "next/image";
import dayjs, { Dayjs } from "dayjs";
import { RangePickerProps } from "antd/es/date-picker";

// Import component Coupon
import Coupon from "@/components/Coupon";
import { coupon as CouponType } from "@/types/coupon";

// Import API services
import { getVehicleById } from "@/apis/vehicle.api";
import { Vehicle } from "@/types/vehicle";
import { User } from "@/types/user";

import { useUserValue } from "@/recoils/user.state";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

// Component chính
const BookingPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  // State
  const [current, setCurrent] = useState<number>(0);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [costGetCar, setCostGetCar] = useState<number>(0);
  const [totalDays, setTotalDays] = useState<number>(3);
  const [validationMessage] = useState<string>("");
  const [form] = Form.useForm();
  const [amountDiscount, setAmountDiscount] = useState<number>(0);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponType | null>(null);
  const user = useUserValue() as User;

  // Fetch vehicle data and handle query params
  useEffect(() => {
    const fetchVehicle = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const vehicleData = await getVehicleById(id);
        setVehicle(vehicleData);

        // Check for time parameters in URL
        const { pickupTime, returnTime } = router.query;
        console.log("URL query params:", { pickupTime, returnTime });

        if (pickupTime && returnTime) {
          // Set pickup and return times from URL parameters
          const startDate = dayjs(pickupTime as string);
          const endDate = dayjs(returnTime as string);

          // Calculate the rental duration
          if (startDate.isValid() && endDate.isValid()) {
            const days = Math.ceil(endDate.diff(startDate, "hours") / 24);
            setTotalDays(days || 1);

            // Set default date range picker values
            const defaultStart = startDate;
            const defaultEnd = endDate;

            // Override the default date range picker values
            // (we'll use these in the component render)
            console.log("Setting date range from URL params:", {
              start: defaultStart.format("YYYY-MM-DD HH:mm"),
              end: defaultEnd.format("YYYY-MM-DD HH:mm"),
            });
          }
        }
      } catch (error) {
        console.error("Error fetching vehicle details:", error);
        message.error("Không thể tải thông tin xe");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVehicle();
    }
  }, [id, router.query]);

  // Hàm UI đơn giản
  const handleCheckout = (): void => {
    setCurrent(1);
  };

  const handleBack = (): void => {
    setCurrent(0);
  };

  // Xử lý thanh toán an toàn
  const handlePayment = async () => {
    try {
      // Lấy dữ liệu từ form
      const formValues = await form.validateFields();

      // Chuẩn bị dữ liệu thanh toán an toàn
      // Chỉ gửi thông tin ID và thời gian, KHÔNG gửi giá tiền từ client
      const paymentData = {
        vehicleId: id, // ID của xe
        startDate: formValues.date[0].format("YYYY-MM-DD HH:mm"),
        endDate: formValues.date[1].format("YYYY-MM-DD HH:mm"),
        fullname: formValues.fullname,
        phone: formValues.phone,
        address: formValues.address,
        pickupMethod: costGetCar === 0 ? "office" : "delivery",
        couponId: selectedCoupon ? selectedCoupon.id : null, // Lấy coupon ID từ state
      };

      console.log("Dữ liệu thanh toán an toàn:", paymentData);

      // Trong thực tế, bạn sẽ gửi dữ liệu này đến backend
      // const response = await apiClient.post('/bookings/create', paymentData);
      // if (response.status === 200) {
      //   setCurrent(2); // Chuyển đến màn hình thành công
      // }

      // Tạm thời giả lập thành công cho demo
      setCurrent(2);
    } catch (error) {
      console.error("Lỗi khi thanh toán:", error);
      message.error("Vui lòng kiểm tra lại thông tin thanh toán");
    }
  };

  const selectTimeSlots: RangePickerProps["onChange"] = (value) => {
    if (value && value[0] && value[1]) {
      const startDate = value[0] as Dayjs;
      const endDate = value[1] as Dayjs;
      const days = Math.ceil(endDate.diff(startDate, "hours") / 24);
      console.log("Date range changed, calculating days:", days);
      setTotalDays(days || 1);
    }
  };

  // Xử lý coupon
  const handleApplyCoupon = (coupon: CouponType | null): void => {
    if (coupon) {
      setAmountDiscount(coupon.discount);
      setSelectedCoupon(coupon);
      // Cập nhật form với coupon ID
      form.setFieldsValue({
        couponId: coupon.id,
      });
      message.success(`Đã áp dụng mã giảm giá "${coupon.name}" thành công!`);
    } else {
      setAmountDiscount(0);
      setSelectedCoupon(null);
      // Xóa coupon ID khỏi form
      form.setFieldsValue({
        couponId: undefined,
      });
    }
  };

  // Calculate total amount based on vehicle data
  const costPerDay = vehicle?.costPerDay || 0;
  const totalAmount: number =
    totalDays * costPerDay - (totalDays * costPerDay * amountDiscount) / 100;

  // SECURITY NOTE: Giá tiền được tính ở client chỉ để hiển thị
  // Việc tính toán giá cuối cùng PHẢI được thực hiện lại ở server
  // để ngăn người dùng thay đổi giá qua DevTools
  // Backend cần:
  // 1. Lấy giá xe từ database theo vehicleId
  // 2. Xác thực mã giảm giá và tính lại phần trăm giảm
  // 3. Tính toán lại số ngày thuê từ startDate và endDate
  // 4. Tính lại tổng tiền dựa trên dữ liệu đã xác thực

  // Update form when totalAmount changes
  useEffect(() => {
    if (form && totalAmount > 0) {
      form.setFieldsValue({
        amount: totalAmount.toLocaleString("it-IT", {
          style: "currency",
          currency: "VND",
        }),
      });
    }
  }, [form, totalAmount]);

  // Log user state and update form fields for user data
  useEffect(() => {
    console.log("Current user state:", user);

    // If user exists, update form fields
    if (user && form) {
      // Set fullname (read-only) and phone (editable)
      form.setFieldsValue({
        fullname: user.fullName || "",
        // Still pre-fill phone but allow editing
        phone: user.phone || "",
      });
    }
  }, [user, form]);

  // Chuẩn bị giá trị mặc định, using URL params if available
  const { pickupTime, returnTime } = router.query;
  const defaultStartDate: Dayjs = pickupTime
    ? dayjs(pickupTime as string)
    : dayjs().add(1, "day");
  const defaultEndDate: Dayjs = returnTime
    ? dayjs(returnTime as string)
    : dayjs().add(4, "day");

  // If loading, show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Đang tải thông tin xe..." />
      </div>
    );
  }

  // If no vehicle data after loading, show error
  if (!vehicle) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-xl mb-4 text-red-500">Không thể tải thông tin xe</p>
        <Link href="/vehicles">
          <Button type="primary">Quay lại trang tìm kiếm xe</Button>
        </Link>
      </div>
    );
  }

  return (
    <section className="!pt-20 pb-20 relative">
      <div className="mb-10 max-w-6xl mx-auto">
        <div className="flex flex-col mt-10 items-center justify-center border rounded-sm shadow-md bg-slate-100 p-2 pb-4 sm:flex-row sm:px-5 lg:px-5 xl:px-12">
          <div className="flex w-full mt-4 py-2 text-xs sm:mt-0 sm:ml-auto sm:text-base">
            <Steps
              className="mt-5"
              current={current}
              items={[
                {
                  title: "Thủ tục thanh toán",
                  icon: <SolutionOutlined />,
                },
                {
                  title: "Thanh toán",
                  icon:
                    current === 1 ? <LoadingOutlined /> : <PayCircleOutlined />,
                },
                {
                  title: "Kết quả",
                  icon: <SmileOutlined />,
                },
              ]}
            />
          </div>
        </div>

        {current === 0 && (
          <div className="grid sm:px- mt-3 lg:grid-cols-2 p-6 rounded-sm shadow-md bg-slate-100">
            <div className="px-10 pt-8">
              <p className="text-xl font-medium">Tổng kết đơn hàng</p>
              <p className="text-gray-400"></p>
              <div className="mt-8 space-y-3 rounded-lg shadow-md border bg-white px-2 py-4 sm:px-6">
                <div className="flex flex-col rounded-lg bg-white sm:flex-row relative">
                  <div className="relative rounded-lg w-1/2 h-48">
                    {/* Use next/image with proper fallbacks */}
                    <Image
                      alt="car"
                      src={
                        vehicle.vehicleImages &&
                        vehicle.vehicleImages.length > 0
                          ? vehicle.vehicleImages[0].imageUrl
                          : "/images/demo1.png"
                      }
                      layout="fill"
                      className="rounded-lg object-cover"
                      onError={() => {
                        console.log(
                          "Image failed to load, falling back to placeholder"
                        );
                      }}
                      unoptimized={true} // This bypasses the Next.js image optimization
                    />
                  </div>

                  <div className="flex w-full flex-col px-4 py-4">
                    <span className="font-semibold text-lg">
                      {vehicle.thumb} - {vehicle.modelName} (
                      {vehicle.yearManufacture})
                    </span>
                    <span className="float-right text-gray-400">
                      {vehicle.transmission} - {vehicle.numberSeat} chỗ
                    </span>
                    <p className="text-lg font-bold">
                      {vehicle.costPerDay.toLocaleString("it-IT", {
                        style: "currency",
                        currency: "VND",
                      })}
                      /ngày
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-8 text-lg font-medium">Phương thức nhận xe</p>
              <form className="mt-5 mb-5 grid gap-6">
                <Radio.Group
                  onChange={(e) => setCostGetCar(e.target.value)}
                  value={costGetCar}
                >
                  <Space direction="vertical">
                    <Radio value={0}>
                      <div>
                        <div className="font-medium">Nhận tại văn phòng</div>
                        <div className="text-gray-500 text-sm">
                          {vehicle.address || "Thạch Hòa, Thạch Thất, Hà Nội"}
                        </div>
                        <div className="text-green-500 text-sm font-medium">
                          Miễn phí
                        </div>
                      </div>
                    </Radio>
                    {vehicle.shipToAddress && (
                      <Radio value={1}>
                        <div>
                          <div className="font-medium">Giao tận nơi</div>
                          <div className="text-gray-500 text-sm">
                            Giao xe đến địa chỉ của bạn
                          </div>
                          <div className="text-green-500 text-sm font-medium">
                            Miễn phí
                          </div>
                        </div>
                      </Radio>
                    )}
                  </Space>
                </Radio.Group>
              </form>
            </div>
            <div className="mt-14 bg-gray-50 px-10 pt-4 lg:mt-5 rounded-md shadow-md">
              <p className="text-xl font-medium">Thông tin thuê chi tiết</p>
              <p className="text-gray-400">Thời gian thuê xe</p>
              <Space direction="vertical" size={12}>
                <RangePicker
                  showTime={{ format: "HH:mm" }}
                  format="DD-MM-YYYY HH:mm"
                  onChange={selectTimeSlots}
                  size="large"
                  value={[defaultStartDate, defaultEndDate]}
                />
                {validationMessage && (
                  <p className="text-red-500">{validationMessage}</p>
                )}
              </Space>
              <p className="text-gray-400">Tổng Số ngày thuê: {totalDays} </p>
              <p className="text-gray-400">
                Giá 1 ngày thuê:{" "}
                {vehicle.costPerDay.toLocaleString("it-IT", {
                  style: "currency",
                  currency: "VND",
                })}
              </p>

              {/* Phần mã giảm giá - Sử dụng component Coupon */}
              <div className="mt-4 mb-4">
                <p className="text-gray-600 font-medium">Mã giảm giá</p>
                <div className="border border-gray-200 rounded-md px-3 mt-2">
                  <Coupon applyCoupon={handleApplyCoupon} />
                </div>
                {amountDiscount > 0 && (
                  <p className="text-green-500 text-sm mt-1">
                    Đã áp dụng giảm giá {amountDiscount}%
                  </p>
                )}
              </div>

              <p className="text-lg font-bold">
                Tổng giá thuê:{" "}
                {totalAmount.toLocaleString("it-IT", {
                  style: "currency",
                  currency: "VND",
                })}
              </p>

              <button
                onClick={handleCheckout}
                className="mt-4 mb-2 w-full border-none rounded-md bg-green-400 hover:bg-green-600 px-6 py-2 text-lg font-bold text-white cursor-pointer"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {current === 1 && (
          <Form
            form={form}
            labelCol={{
              span: 6,
            }}
            wrapperCol={{
              span: 20,
            }}
            layout="horizontal"
            name="basic"
            initialValues={{
              bankCode: "",
              language: "vn",
              amount: totalAmount,
              fullname: user ? user.fullName || "" : "",
              phone: user ? user.phone || "" : "",
              date: [defaultStartDate, defaultEndDate],
              address:
                costGetCar === 0
                  ? vehicle.address || "Thạch Hòa, Thạch Thất, Hà Nội"
                  : "Địa chỉ nhận xe của bạn",
            }}
            size="large"
            className=""
          >
            <div className="grid sm:px-10 lg:grid-cols-2 p-5 mt-3 rounded-md shadow-md bg-slate-100">
              <div className="pt-8 pr-10">
                <Form.Item
                  name="fullname"
                  label="Họ và tên:"
                  rules={[
                    {
                      required: true,
                      message: "Họ và tên không được để trống",
                    },
                  ]}
                >
                  <Input readOnly />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label="Số điện thoại:"
                  rules={[
                    {
                      required: true,
                      message: "Số điện thoại không được để trống",
                    },
                    {
                      pattern: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/,
                      message: "Vui lòng nhập số điện thoại hợp lệ",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="address"
                  label="Địa chỉ giao xe:"
                  rules={[
                    {
                      required: true,
                      message: "Địa chỉ không được để trống",
                    },
                  ]}
                >
                  <TextArea rows={3} placeholder="Địa chỉ giao xe" />
                </Form.Item>
                <Form.Item name="date" label="Thời gian thuê xe">
                  <RangePicker
                    showTime={{ format: "HH mm" }}
                    format="DD-MM-YYYY HH:mm"
                    disabled
                    style={{ color: "white" }}
                  />
                </Form.Item>
                <Form.Item name="amount" label="Số tiền:">
                  <Input readOnly />
                </Form.Item>
              </div>
              <div className="mt-14 bg-gray-50 px-10 pt-8 lg:mt-5 rounded-md shadow-md">
                <Form.Item name="bankCode" label="Thanh toán:">
                  <Radio.Group name="bankCode" className="mt-2">
                    <Space direction="vertical">
                      <Radio value="" checked={true}>
                        Cổng thanh toán VNPAYQR
                      </Radio>
                      <Radio name="bankATM" value="BankATM">
                        Thanh toán qua ATM - Tài khoản ngân hàng nội địa
                      </Radio>
                      <Radio name="wallet" value="wallet">
                        Thanh toán qua ví điện tử
                      </Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>

                {/* <Form.Item name="language" label="Ngôn ngữ:">
                  <Radio.Group name="language" className="mt-2">
                    <Space direction="vertical">
                      <Radio value="vn">Tiếng việt</Radio>
                      <Radio value="en">Tiếng anh</Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item> */}

                <Form.Item>
                  <Space direction="horizontal" className="ml-12">
                    <Button
                      type="primary"
                      htmlType="submit"
                      onClick={handlePayment}
                    >
                      Thanh Toán
                    </Button>
                    <Button type="dashed" onClick={handleBack}>
                      Trở về thủ tục thanh toán
                    </Button>
                  </Space>
                </Form.Item>
              </div>
            </div>
          </Form>
        )}

        {current === 2 && (
          <div className="flex justify-center items-start mt-5 text-gray-700">
            <div className="flex flex-col justify-center items-center mt-5 text-gray-700">
              <CheckCircleOutlined
                style={{ fontSize: "35px", color: "#22c12a" }}
              />
              <h1 className="text-2xl font-semibold my-4">
                Giao dịch thành công
              </h1>
              <p className="mb-4">
                Cám ơn bạn đã đặt xe. Mã đơn hàng của bạn là: #BK12345
              </p>
              <Link href="/profile/booking-history">
                <Button type="primary" size="large">
                  Xem đơn của tôi
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default BookingPage;
