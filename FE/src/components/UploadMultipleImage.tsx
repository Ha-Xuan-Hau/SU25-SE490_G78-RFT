import { Image, Spin, Upload, message } from "antd";
import { CloseCircleFilled, CloudUploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { useEffect, useState } from "react";

interface UploadMultipleImageProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
}

export const UploadMultipleImage = ({
  value,
  onChange,
}: UploadMultipleImageProps) => {
  const endpoint = process.env.NEXT_PUBLIC_CLOUDINARY_API!;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState<boolean>(false);
  const [images, setImages] = useState<string[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const computedValue = value ?? images;

  useEffect(() => {
    if (value && Array.isArray(value)) {
      setImages(value);
    }
  }, [value]);

  return (
    <>
      {contextHolder}
      <div className="grid gap-2 grid-cols-3">
        {computedValue?.map((image: string, idx: number) => (
          <div
            key={image}
            className="rounded overflow-hidden aspect-square relative"
          >
            <CloseCircleFilled
              className="absolute z-50 cursor-pointer right-0 top-0 text-red-500"
              onClick={() => {
                const newImages = images.filter((e: string) => e !== image);
                const newFileNames = fileNames.filter((_, i) => i !== idx);
                setImages(newImages);
                setFileNames(newFileNames);
                onChange?.(newImages);
              }}
            />
            <Image
              src={image}
              className="w-full h-full object-contain aspect-square"
            />
          </div>
        ))}

        {computedValue.length < 4 && (
          <Upload.Dragger
            listType="picture-card"
            showUploadList={false}
            className="aspect-square p-0"
            customRequest={async ({ file }) => {
              // Kiểm tra số lượng ảnh
              if (images.length >= 4) {
                messageApi.warning("Chỉ được phép tải lên tối đa 4 ảnh!");
                return;
              }
              // Kiểm tra trùng tên file
              const name = (file as File).name;
              if (fileNames.includes(name)) {
                messageApi.error("Không được upload hai ảnh cùng tên!");
                return;
              }

              setLoading(true);
              const formData = new FormData();
              formData.append("file", file);
              formData.append("upload_preset", uploadPreset);

              try {
                const { data } = await axios.post(endpoint, formData, {
                  headers: {
                    "Content-Type": "multipart/form-data",
                  },
                });

                const newImages = [...images, data.url];
                const newFileNames = [...fileNames, name];
                setImages(newImages);
                setFileNames(newFileNames);
                onChange?.(newImages);
              } catch (error: any) {
                const msg =
                  error?.response?.data?.error?.message ||
                  error?.response?.data?.message ||
                  error.message ||
                  "Lỗi không xác định";
                messageApi.error(msg);
                console.error(
                  "Cloudinary upload error:",
                  error?.response?.data || error
                );
              } finally {
                setLoading(false);
              }
            }}
          >
            <Spin spinning={loading}>
              <CloudUploadOutlined />
            </Spin>
          </Upload.Dragger>
        )}
      </div>
    </>
  );
};
