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

  useEffect(() => {
    if (value && Array.isArray(value)) {
      setImages(value);
      // Sync fileNames from URLs if possible (extract name from URL)
      setFileNames(
        value.map((url) => {
          try {
            return decodeURIComponent(
              url.split("/").pop()?.split("?")[0] || ""
            );
          } catch {
            return "";
          }
        })
      );
    }
  }, [value]);

  // Always use local images state for display, but keep parent in sync
  const computedValue = images;

  return (
    <>
      {contextHolder}
      <div className="grid gap-2 grid-cols-3">
        {images.map((image: string, idx: number) => (
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

        {images.length < 4 && (
          <Upload.Dragger
            listType="picture-card"
            showUploadList={false}
            className="aspect-square p-0"
            multiple
            beforeUpload={async (file, fileList) => {
              // Kiểm tra tổng số lượng ảnh sau khi chọn
              if (images.length + fileList.length > 4) {
                messageApi.warning("Chỉ được phép tải lên tối đa 4 ảnh!");
                return Upload.LIST_IGNORE;
              }
              // Kiểm tra trùng tên file trong batch
              const batchNames = fileList.map((f) => f.name);
              if (batchNames.some((name) => fileNames.includes(name))) {
                messageApi.error("Không được upload hai ảnh cùng tên!");
                return Upload.LIST_IGNORE;
              }
              setLoading(true);
              const uploadedImages: string[] = [];
              const uploadedNames: string[] = [];
              for (const f of fileList) {
                const name = (f as File).name;
                if (images.length + uploadedImages.length >= 4) break;
                if (fileNames.includes(name) || uploadedNames.includes(name)) {
                  messageApi.error("Không được upload hai ảnh cùng tên!");
                  continue;
                }
                const formData = new FormData();
                formData.append("file", f);
                formData.append("upload_preset", uploadPreset);
                try {
                  const { data } = await axios.post(endpoint, formData, {
                    headers: {
                      "Content-Type": "multipart/form-data",
                    },
                  });
                  uploadedImages.push(data.url);
                  uploadedNames.push(name);
                } catch (error) {
                  let msg = "Lỗi không xác định";
                  if (error && typeof error === "object") {
                    const axiosError = error as {
                      response?: {
                        data?: {
                          error?: { message?: string };
                          message?: string;
                        };
                      };
                      message?: string;
                    };
                    msg =
                      axiosError.response?.data?.error?.message ||
                      axiosError.response?.data?.message ||
                      axiosError.message ||
                      msg;
                    console.error(
                      "Cloudinary upload error:",
                      axiosError.response?.data || axiosError
                    );
                  } else if (error instanceof Error) {
                    msg = error.message;
                    console.error("Cloudinary upload error:", error);
                  }
                  messageApi.error(msg);
                }
              }
              const newImages = [...images, ...uploadedImages];
              const newFileNames = [...fileNames, ...uploadedNames];
              setImages(newImages);
              setFileNames(newFileNames);
              onChange?.(newImages);
              setLoading(false);
              return Upload.LIST_IGNORE;
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
