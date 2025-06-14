import React from "react";

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="text-red-500 text-center py-4">
      {message || "An error occurred"}
    </div>
  );
};

export default ErrorMessage;
