import { useState } from "react";

interface TrashBinProps {
  completedCount: number;
  onOpenDrawer: () => void;
}

export function TrashBin({ completedCount, onOpenDrawer }: TrashBinProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onOpenDrawer}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed bottom-8 right-8 w-20 h-20 bg-gray-700 rounded-full shadow-2xl 
        flex flex-col items-center justify-center text-white transition-transform
        ${isHovered ? "scale-110" : "scale-100"}`}
      title="查看已完成的待办"
    >
      <div className="text-3xl">🗑️</div>
      {completedCount > 0 && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full 
          flex items-center justify-center text-xs font-bold">
          {completedCount}
        </div>
      )}
    </button>
  );
}
