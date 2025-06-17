import { Image, Spin, Upload, message } from "antd";
import { CloudUploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { useState } from "react";

interface UploadImageProps {
  value?: string;
  onChange?: (url: string) => void;
}

const uploadStyle = {
  ".ant-upload-btn": {
    padding: 0,
  },
};

export const UploadImage = ({ value, onChange }: UploadImageProps) => {
  const endpoint = `https://api.cloudinary.com/v1_1/dcakldjvc/image/upload`;
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | undefined>();
  const computedValue = value ?? image;

  return (
    <>
      {contextHolder}
      <Upload.Dragger
        listType="picture-card"
        showUploadList={false}
        className="aspect-square p-0 upload-image-dragger"
        style={uploadStyle}
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

            setImage(data?.url);
            console.log(data?.url);
            if (onChange) {
              onChange(data?.url);
            }
          } catch (error) {
            messageApi.error(String(error));
          } finally {
            setLoading(false);
          }
        }}
      >
        <Spin spinning={loading}>
          <div className="p-2 relative group">
            {computedValue ? (
              <Image
                className="w-full h-full object-cover aspect-square rounded overflow-hidden"
                preview={false}
                src={computedValue}
              />
            ) : (
              <CloudUploadOutlined />
            )}

            <div className="absolute w-full h-full top-0 left-0 bg-white/80 opacity-0 hover:opacity-100 flex justify-center items-center transition-all">
              <CloudUploadOutlined />
            </div>
          </div>
        </Spin>
      </Upload.Dragger>
    </>
  );
};
