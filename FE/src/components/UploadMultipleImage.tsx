import { Image, Spin, Upload, message } from "antd";
import { CloseCircleFilled, CloudUploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { useEffect, useState } from "react";

// Định nghĩa interface cho props
interface UploadMultipleImageProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
}

export const UploadMultipleImage = ({
  value,
  onChange,
}: UploadMultipleImageProps) => {
  const endpoint = `https://api.cloudinary.com/v1_1/djllhxlfc/image/upload`;
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState<boolean>(false);
  const [images, setImages] = useState<string[]>([]);
  const computedValue = value ?? images;

  useEffect(() => {
    // If value prop is updated from outside the component, update our local state
    if (value && Array.isArray(value)) {
      setImages(value);
      console.log("Setting images from props:", value);
    }
  }, [value]);

  return (
    <>
      {contextHolder}

      <div className="grid gap-2 grid-cols-3">
        {computedValue?.map((image: string) => (
          <div
            key={image}
            className="rounded overflow-hidden aspect-square relative"
          >
            <CloseCircleFilled
              className="absolute z-50 cursor-pointer right-0 top-0 text-red-500"
              onClick={() => {
                const newImages = images.filter((e: string) => e !== image);

                setImages(newImages);
                onChange?.(newImages);
              }}
            />
            <Image
              src={image}
              className="w-full h-full object-contain aspect-square"
            />
          </div>
        ))}

        <Upload.Dragger
          listType="picture-card"
          showUploadList={false}
          className="aspect-square p-0"
          customRequest={async ({ file }) => {
            setLoading(true);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "rental-car");

            try {
              const { data } = await axios.post(endpoint, formData, {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              });

              const newImages = [...images, data.url];

              setImages(newImages);
              onChange?.(newImages);
            } catch (error) {
              messageApi.error(String(error));
            } finally {
              setLoading(false);
            }
          }}
        >
          <Spin spinning={loading}>
            <CloudUploadOutlined />
          </Spin>
        </Upload.Dragger>
      </div>
    </>
  );
};
