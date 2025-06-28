import React, { useState } from "react";
import { Image, Spin, Upload, message } from "antd";
import { CloseCircleFilled, CloudUploadOutlined } from "@ant-design/icons";
import axios from "axios";
import type { UploadProps } from "antd";

interface UploadContractProps {
  value?: string[];
  onChange?: (value: string[]) => void;
}

export const UploadContract: React.FC<UploadContractProps> = ({
  value,
  onChange,
}) => {
  const endpoint = `https://api.cloudinary.com/v1_1/djllhxlfc/image/upload`;
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState<boolean>(false);
  const [images, setImages] = useState<string[]>([]);
  const computedValue = value ?? images;

  const handleCustomRequest: UploadProps["customRequest"] = async ({
    file,
    onSuccess,
    onError,
  }) => {
    if (!(file instanceof File)) {
      onError?.(new Error("Not a file"), undefined as any);
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "contracts");

    try {
      const { data } = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newImages = [...images, data.url];

      setImages(newImages);
      onChange?.(newImages);
      onSuccess?.(data, undefined as any);
    } catch (error) {
      messageApi.error(String(error));
      onError?.(error as Error, undefined as any);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    const newImages = images.filter((image) => image !== imageUrl);
    setImages(newImages);
    onChange?.(newImages);
  };

  return (
    <>
      {contextHolder}

      <div className="grid gap-2 grid-cols-3">
        {computedValue?.map((image) => (
          <div
            key={image}
            className="rounded overflow-hidden aspect-square relative"
          >
            <CloseCircleFilled
              className="absolute z-50 cursor-pointer right-0 top-0 text-red-500"
              onClick={() => handleRemoveImage(image)}
            />
            <Image
              src={image}
              className="w-full h-full object-contain aspect-square"
              alt="Contract image"
            />
          </div>
        ))}

        <Upload.Dragger
          listType="picture-card"
          showUploadList={false}
          className="aspect-square p-0"
          customRequest={handleCustomRequest}
        >
          <Spin spinning={loading}>
            <CloudUploadOutlined />
          </Spin>
        </Upload.Dragger>
      </div>
    </>
  );
};
