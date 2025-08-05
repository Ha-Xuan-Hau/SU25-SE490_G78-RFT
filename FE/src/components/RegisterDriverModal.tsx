import React, { useState, useEffect } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useUserState } from "@/recoils/user.state.js";
import { useMutation } from "@tanstack/react-query";
import { toast, ToastPosition } from "react-toastify"; // Thêm ToastPosition
import { UploadImage } from "@/components/UploadImage";
import axios from "axios";
import { Button, Form, notification, Modal, Input, Select } from "antd";

// Định nghĩa interface cho props
interface RegisterDriverModalProps {
  openRegisterDriver: boolean;
  handleCancelRegisterDriver: () => void;
}

// Định nghĩa kiểu dữ liệu cho values form
interface DriverFormValues {
  drivingLicenseNo: string | number;
  class: string;
  image: string;
  [key: string]: any; // Cho phép các trường khác nếu cần
}

function RegisterDriverModal({
  openRegisterDriver,
  handleCancelRegisterDriver,
}: RegisterDriverModalProps) {
  const [form] = Form.useForm<DriverFormValues>();
  const [user, setUser] = useUserState();
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile, clearProfile] = useLocalStorage("profile", "");

  const [accessToken, setAccessToken, clearAccessToken] =
    useLocalStorage("access_token");

  const onSubmit = async (values: DriverFormValues) => {
    setLoading(true);

    try {
      const did = user?.result?.driverLicenses?._id;

      const response = await axios({
        method: did ? "put" : "post",
        url: did
          ? `${process.env.NEXT_PUBLIC_REACT_APP_BACKEND_URL}/drivers/updateDriver/${did}`
          : `${process.env.NEXT_PUBLIC_REACT_APP_BACKEND_URL}/drivers/registerDriver`,
        data: values,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          withCredentials: true,
        },
      });

      if (response.status === 200) {
        console.log(response.data);
        setProfile({ ...response.data });
        handleCancelRegisterDriver();
        const successMessage = user?.result?.driverLicenses
          ? "Cập nhật thành công"
          : "Đăng kí thành công";

        notification.success({
          message: successMessage,
        });
      }
    } catch (error: any) {
      // Sửa cách sử dụng toast.POSITION
      toast.error(error.response?.data?.errors?.[0]?.msg || "Đã xảy ra lỗi", {
        position: "top-center" as ToastPosition,
      });
    } finally {
      setLoading(false);
    }
  };

  // Sửa cách khai báo useMutation với generic types
  const { mutate, isPending } = useMutation<void, Error, DriverFormValues>({
    mutationFn: onSubmit,
    onMutate: () => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    },
  });

  return (
    <Modal
      open={openRegisterDriver}
      onCancel={handleCancelRegisterDriver}
      footer={[
        <Button
          key="submit"
          loading={loading || isPending} // Thay isLoading bằng isPending
          htmlType="submit"
          type="primary"
          onClick={() => {
            // Sửa cách gọi mutate
            const values = form.getFieldsValue();
            mutate(values);
          }}
        >
          {user?.result?.driverLicenses ? "Cập nhật" : " Đăng kí"}
        </Button>,
      ]}
    >
      {/* Phần còn lại không thay đổi */}
      <p className="flex justify-center items-center w-full text-2xl font-bold">
        {user?.result?.driverLicenses ? "Cập nhật GPLX" : "Đăng kí GPLX"}
      </p>

      <Form
        form={form}
        layout="vertical"
        name="basic"
        onFinish={(values: DriverFormValues) => {
          // Thêm kiểu dữ liệu rõ ràng cho values
          mutate(values);
        }}
        initialValues={{
          ...(user?.result?.driverLicenses || {}),
        }}
        autoComplete="off"
        className="flex gap-4 mt-10"
      >
        <div className="w-2/3">
          <Form.Item
            label="Số GPLX"
            name="drivingLicenseNo"
            rules={[
              {
                required: true,
                message: "Số GPLX không được để trống!",
              },
            ]}
            hasFeedback
          >
            <Input className="w-full" />
          </Form.Item>

          <Form.Item label="Hạng" name="class" required hasFeedback>
            <Select
              className="py-0"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.value.toLowerCase() ?? "").includes(
                  input.toLowerCase()
                )
              }
              filterSort={(optionA, optionB) =>
                (optionA?.value ?? "")
                  .toLowerCase()
                  .localeCompare((optionB?.value ?? "").toLowerCase())
              }
              options={[
                { value: "B1" },
                { value: "B2" },
                { value: "C" },
                { value: "D" },
                { value: "E" },
                { value: "F" },
                { value: "FB2" },
                { value: "FC" },
                { value: "FD" },
                { value: "FE" },
              ]}
            />
          </Form.Item>
        </div>

        <div className="grow w-1/3">
          <Form.Item label="Hình ảnh" name="image" required>
            <UploadImage />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

export default RegisterDriverModal;
