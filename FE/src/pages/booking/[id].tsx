"use client";
import React, { useState } from "react";
import Link from "next/link";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SolutionOutlined,
  PayCircleOutlined,
  SmileOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Typography,
  Steps,
  Radio,
  Space,
  DatePicker,
  message,
} from "antd";
import Image from "next/image";
import dayjs, { Dayjs } from "dayjs";
import { RangePickerProps } from "antd/es/date-picker";

// Import component Coupon
import Coupon from "@/components/Coupon";
import { coupon as CouponType } from "@/types/coupon";

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

// Interfaces
interface CarData {
  _id: string;
  model: {
    name: string;
  };
  yearManufacture: string;
  transmissions: string;
  numberSeat: number;
  cost: number;
  thumb: string;
}

// Mẫu dữ liệu xe
const sampleCarData: CarData = {
  _id: "car123",
  model: {
    name: "Toyota Camry",
  },
  yearManufacture: "2022",
  transmissions: "Tự động",
  numberSeat: 5,
  cost: 800000,
  thumb: "/images/demo1.png",
};

// Component chính
const BookingPage: React.FC = () => {
  // State đơn giản cho UI
  const [current, setCurrent] = useState<number>(0);
  const [costGetCar, setCostGetCar] = useState<number>(0);
  const [totalDays, setTotalDays] = useState<number>(3);
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [form] = Form.useForm();
  const [amountDiscount, setAmountDiscount] = useState<number>(0);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponType | null>(null);

  // Hàm UI đơn giản
  const handleCheckout = (): void => {
    setCurrent(1);
  };

  const handleBack = (): void => {
    setCurrent(0);
  };

  const onChange = (e: any): void => {
    setCostGetCar(parseInt(e.target.value));
  };

  const selectTimeSlots: RangePickerProps["onChange"] = (value) => {
    if (value && value[0] && value[1]) {
      const startDate = value[0] as Dayjs;
      const endDate = value[1] as Dayjs;
      const days = Math.ceil(endDate.diff(startDate, "hours") / 24);
      setTotalDays(days || 1);
    }
  };

  // Xử lý coupon
  const handleApplyCoupon = (coupon: CouponType | null): void => {
    if (coupon) {
      setAmountDiscount(coupon.discount);
      message.success(`Đã áp dụng mã giảm giá "${coupon.name}" thành công!`);
    } else {
      setAmountDiscount(0);
    }
    setSelectedCoupon(coupon);
  };

  // Mock dữ liệu
  const data: CarData = sampleCarData;
  const totalAmount: number =
    totalDays * data.cost - (totalDays * data.cost * amountDiscount) / 100;
  // Đã loại bỏ costGetCar từ phép tính

  // Chuẩn bị giá trị mặc định
  const defaultStartDate: Dayjs = dayjs().add(1, "day");
  const defaultEndDate: Dayjs = dayjs().add(4, "day");

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
                    <Image
                      alt="car"
                      src={data.thumb}
                      layout="fill"
                      className="rounded-lg object-cover"
                    />
                  </div>

                  <div className="flex w-full flex-col px-4 py-4">
                    <span className="font-semibold text-lg">
                      {data.model.name} {data.yearManufacture}
                    </span>
                    <span className="float-right text-gray-400">
                      {data.transmissions} - {data.numberSeat} chỗ
                    </span>
                    <p className="text-lg font-bold">
                      {data.cost.toLocaleString("it-IT", {
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
                <Radio.Group onChange={onChange} value={costGetCar}>
                  <Space direction="vertical">
                    <Radio value={0}>
                      <div>
                        <div className="font-medium">Nhận tại văn phòng</div>
                        <div className="text-gray-500 text-sm">
                          Thạch Hòa, Thạch Thất, Hà Nội
                        </div>
                        <div className="text-green-500 text-sm font-medium">
                          Miễn phí
                        </div>
                      </div>
                    </Radio>
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
                  defaultValue={[defaultStartDate, defaultEndDate]}
                />
                {validationMessage && (
                  <p className="text-red-500">{validationMessage}</p>
                )}
              </Space>
              <p className="text-gray-400">Tổng Số ngày thuê: {totalDays} </p>
              <p className="text-gray-400">
                Giá 1 ngày thuê:{" "}
                {data.cost.toLocaleString("it-IT", {
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
              fullname: "Nguyễn Văn A",
              phone: "0987654321",
              address:
                costGetCar === 0
                  ? "Thạch Hòa, Thạch Thất, Hà Nội"
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
                  <Input />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label="Số điện thoại:"
                  rules={[
                    {
                      required: true,
                      message: "Số điện thoại không được để trống",
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
                    defaultValue={[defaultStartDate, defaultEndDate]}
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
                      <Radio name="bankCode" value="VNPAYQR">
                        Thanh toán qua ứng dụng hỗ trợ VNPAYQR
                      </Radio>
                      <Radio name="bankATM" value="BankATM">
                        Thanh toán qua ATM - Tài khoản ngân hàng nội địa
                      </Radio>
                      <Radio name="bankVisa" value="BankVisa">
                        Thanh toán qua thẻ quốc tế
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
                      onClick={() => setCurrent(2)}
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
