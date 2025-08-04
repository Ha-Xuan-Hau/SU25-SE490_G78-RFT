// RegisterDriverModal.tsx
import React, { useState } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useUserState } from "@/recoils/user.state.js";
import { useMutation } from "@tanstack/react-query";
import { toast, ToastPosition } from "react-toastify";
import { UploadImage } from "@/components/UploadImage";
import axios from "axios";
import { Button, Form, notification, Modal, Input } from "antd";

// Định nghĩa interface cho props
interface RegisterDriverModalProps {
  openRegisterDriver: boolean;
  handleCancelRegisterDriver: () => void;
}

// Định nghĩa kiểu dữ liệu cho values form
interface DriverFormValues {
  licenseNumber: string | number;
  classField: string;
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
    const { licenseNumber, classField, image } = values; // lấy image từ values

    try {
      const did = user?.result?.driverLicenses?._id;
      const response = await axios({
        method: did ? "put" : "post",
        url: did
          ? `${process.env.NEXT_PUBLIC_REACT_APP_BACKEND_URL}/driver-licenses/${did}`
          : `${process.env.NEXT_PUBLIC_REACT_APP_BACKEND_URL}/driver-licenses`,
        data: {
          licenseNumber,
          classField,
          image, // gửi image lên backend
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          withCredentials: true,
        },
      });

      console.log(response.data);
      setProfile({ ...response.data });
      notification.success({
        message: user?.result?.driverLicenses
          ? "Cập nhật thành công"
          : "Đăng ký thành công",
      });
      handleCancelRegisterDriver();
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0]?.msg || "Đã xảy ra lỗi", {
        position: "top-center" as ToastPosition,
      });
    } finally {
      setLoading(false);
    }
  };

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
          loading={loading || isPending}
          htmlType="submit"
          type="primary"
          onClick={() => {
            const values = form.getFieldsValue();
            mutate(values);
          }}
        >
          {user?.result?.driverLicenses ? "Cập nhật" : " Đăng kí"}
        </Button>,
      ]}
    >
      <p className="flex justify-center items-center w-full text-2xl font-bold">
        {user?.result?.driverLicenses ? "Cập nhật GPLX" : "Đăng kí GPLX"}
      </p>

      <Form
        form={form}
        layout="vertical"
        name="basic"
        onFinish={(values: DriverFormValues) => {
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
            name="licenseNumber"
            rules={[
              { required: true, message: "Số GPLX không được để trống!" },
            ]}
            hasFeedback
          >
            <Input className="w-full" readOnly />
          </Form.Item>

          <Form.Item
            label="Hạng"
            name="classField"
            rules={[{ required: true, message: "Hạng không được để trống!" }]}
            hasFeedback
          >
            <Input className="w-full" readOnly />
          </Form.Item>
        </div>

        <div className="grow w-1/3">
          <Form.Item label="Hình ảnh" name="image" required>
            <UploadImage
              onChange={(licenseNumber, classField, imageUrl) => {
                form.setFieldsValue({
                  licenseNumber: licenseNumber,
                  classField: classField,
                  image: imageUrl, // set image url vào form
                });
              }}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

export default RegisterDriverModal;
