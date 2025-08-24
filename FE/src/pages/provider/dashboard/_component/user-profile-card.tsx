interface TodoWork {
  totalOrders: number; // tổng đơn hôm nay
  toDeliverCount: number; // số đơn phải giao hôm nay
  toReceiveCount: number; // số đơn nhận lại hôm nay
  cancelledCount: number; // số đơn hủy hôm nay
}

interface UserProfileCardProps {
  todoWork?: TodoWork;
}

export default function UserProfileCard({ todoWork }: UserProfileCardProps) {
  const totalOrders = todoWork?.totalOrders || 0;
  const toDeliverCount = todoWork?.toDeliverCount || 0;
  const toReceiveCount = todoWork?.toReceiveCount || 0;
  const cancelledCount = todoWork?.cancelledCount || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1 - Tổng đơn hôm nay */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col">
          <span className="text-md font-semibold text-gray-900 dark:text-white">
            Tổng đơn hôm nay
          </span>
          <h4 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {totalOrders}
          </h4>
        </div>
      </div>

      {/* Card 2 - Đơn phải giao */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col">
          <span className="text-md font-semibold text-gray-900 dark:text-white">
            Đơn phải giao hôm nay
          </span>
          <h4 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {toDeliverCount}
          </h4>
        </div>
      </div>

      {/* Card 3 - Đơn nhận lại */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col">
          <span className="text-md font-semibold text-gray-900 dark:text-white">
            Đơn nhận lại hôm nay
          </span>
          <h4 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {toReceiveCount}
          </h4>
        </div>
      </div>

      {/* Card 4 - Đơn hủy */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col">
          <span className="text-md font-semibold text-gray-900 dark:text-white">
            Đơn hủy hôm nay
          </span>
          <h4 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {cancelledCount}
          </h4>
        </div>
      </div>
    </div>
  );
}
