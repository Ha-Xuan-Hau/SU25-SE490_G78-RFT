// RegisterDriverModal.tsx
import React, { useState } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useUserState } from "@/recoils/user.state";
import { useMutation } from "@tanstack/react-query";
import { toast, ToastPosition } from "react-toastify";
import { UploadImage } from "@/components/uploadImage/UploadImage";
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
  [key: string]: any;
}

// Interface cho driver license
interface DriverLicense {
  _id?: string;
  id?: string;
  licenseNumber?: string;
  classField?: string;
  image?: string;
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

  // Lấy driver license từ user (không qua result)
  const driverLicense = (user as any)?.driverLicenses;

  const onSubmit = async (values: DriverFormValues) => {
    setLoading(true);
    const { licenseNumber, classField, image } = values;

    try {
      // Lấy ID của driver license (nếu có)
      const did = driverLicense?._id || driverLicense?.id;

      const response = await axios({
        method: did ? "put" : "post",
        url: did
          ? `${process.env.NEXT_PUBLIC_REACT_APP_BACKEND_URL}/driver-licenses/${did}`
          : `${process.env.NEXT_PUBLIC_REACT_APP_BACKEND_URL}/driver-licenses`,
        data: {
          licenseNumber,
          classField,
          image,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log(response.data);

      // Update user state với driver license mới
      if (response.data) {
        setUser((prevUser) => {
          if (!prevUser) return prevUser;
          return {
            ...prevUser,
            driverLicenses: response.data,
          };
        });

        // Update localStorage
        const updatedUser = {
          ...user,
          driverLicenses: response.data,
        };
        localStorage.setItem("user_profile", JSON.stringify(updatedUser));
      }

      notification.success({
        message: driverLicense ? "Cập nhật thành công" : "Đăng ký thành công",
      });

      handleCancelRegisterDriver();

      // Reload page sau một chút delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Đã xảy ra lỗi",
        {
          position: "top-center" as ToastPosition,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const { mutate, isPending } = useMutation<void, Error, DriverFormValues>({
    mutationFn: onSubmit,
  });

  return (
    <Modal
      title={
        <p className="text-center text-2xl font-bold">
          {driverLicense ? "Cập nhật GPLX" : "Đăng ký GPLX"}
        </p>
      }
      open={openRegisterDriver}
      onCancel={handleCancelRegisterDriver}
      footer={[
        <Button key="cancel" onClick={handleCancelRegisterDriver}>
          Hủy
        </Button>,
        <Button
          key="submit"
          loading={loading || isPending}
          type="primary"
          onClick={() => {
            form.validateFields().then((values) => {
              mutate(values);
            });
          }}
        >
          {driverLicense ? "Cập nhật" : "Đăng ký"}
        </Button>,
      ]}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        name="driverLicenseForm"
        onFinish={(values: DriverFormValues) => {
          mutate(values);
        }}
        initialValues={{
          licenseNumber: driverLicense?.licenseNumber || "",
          classField: driverLicense?.classField || "",
          image: driverLicense?.image || "",
        }}
        autoComplete="off"
        className="mt-6"
      >
        <div className="flex gap-4">
          <div className="flex-1">
            <Form.Item
              label="Số GPLX"
              name="licenseNumber"
              rules={[
                { required: true, message: "Số GPLX không được để trống!" },
                {
                  pattern: /^[0-9]{12}$/,
                  message: "Số GPLX phải có 12 chữ số!",
                },
              ]}
              hasFeedback
            >
              <Input
                placeholder="Nhập số GPLX"
                readOnly={!!driverLicense} // Readonly nếu đã có license
              />
            </Form.Item>

            <Form.Item
              label="Hạng"
              name="classField"
              rules={[{ required: true, message: "Hạng không được để trống!" }]}
              hasFeedback
            >
              <Input
                placeholder="Nhập hạng GPLX (VD: B2, C, D...)"
                readOnly={!!driverLicense} // Readonly nếu đã có license
              />
            </Form.Item>
          </div>

          <div className="w-1/3">
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
        </div>
      </Form>
    </Modal>
  );
}

export default RegisterDriverModal;
