"use client";

interface ChatPageWrapperProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export default function ChatPageWrapper({ children, onClick }: ChatPageWrapperProps) {
  return (
    <div
      className="fixed inset-0 z-[90] bg-background flex flex-col"
      onClick={onClick}
    >
      {children}
    </div>
  );
}
