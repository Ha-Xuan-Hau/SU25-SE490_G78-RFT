import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useNotifications } from "@/hooks/useNotifications";
import { Icon } from "@iconify/react";
import moment from "moment";

const SystemNotificationModal: React.FC = () => {
  const { selectedModalNotification, closeModal } = useNotifications();

  // Helper function để convert array time thành moment object
  const parseDateTime = (dateArray: number[] | string) => {
    if (Array.isArray(dateArray)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateArray;
      return moment({ year, month: month - 1, day, hour, minute, second });
    }
    return moment(dateArray);
  };

  const getModalIcon = (type: string) => {
    const iconMap = {
      SYSTEM_ANNOUNCEMENT: "heroicons:megaphone-20-solid",
      MAINTENANCE_NOTICE: "heroicons:wrench-screwdriver-20-solid",
      REPORT: "heroicons:flag-20-solid",
    };
    return (
      iconMap[type as keyof typeof iconMap] ||
      "heroicons:information-circle-20-solid"
    );
  };

  const getModalColor = (type: string) => {
    const colorMap = {
      SYSTEM_ANNOUNCEMENT: "text-orange-600",
      MAINTENANCE_NOTICE: "text-gray-600",
      REPORT: "text-orange-600",
    };
    return colorMap[type as keyof typeof colorMap] || "text-blue-600";
  };

  const getModalTitle = (type: string) => {
    const titleMap = {
      SYSTEM_ANNOUNCEMENT: "Thông báo hệ thống",
      MAINTENANCE_NOTICE: "Thông báo bảo trì",
      REPORT: "Thông báo báo cáo",
    };
    return titleMap[type as keyof typeof titleMap] || "Thông báo";
  };

  if (!selectedModalNotification) return null;

  return (
    <Dialog.Root
      open={!!selectedModalNotification}
      onOpenChange={(open) => !open && closeModal()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div
                className={`${getModalColor(selectedModalNotification.type)}`}
              >
                <Icon
                  icon={getModalIcon(selectedModalNotification.type)}
                  className="w-6 h-6"
                />
              </div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                {getModalTitle(selectedModalNotification.type)}
              </Dialog.Title>
            </div>
            <Dialog.Close className="text-gray-400 hover:text-gray-600 transition-colors">
              <Icon icon="heroicons:x-mark-20-solid" className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-800 leading-relaxed">
                {selectedModalNotification.message}
              </p>
            </div>

            <div className="text-xs text-gray-500 text-center">
              <Icon
                icon="heroicons:clock-20-solid"
                className="w-4 h-4 inline mr-1"
              />
              {parseDateTime(selectedModalNotification.createdAt).format(
                "DD/MM/YYYY HH:mm"
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t bg-gray-50">
            <Dialog.Close asChild>
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
                Đã hiểu
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SystemNotificationModal;
