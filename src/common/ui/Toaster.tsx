"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl font-inter",
          description: "group-[.toast]:text-gray-500",
          actionButton:
            "group-[.toast]:bg-gradient-to-r group-[.toast]:from-[#2B7FFF] group-[.toast]:to-[#00BBA7] group-[.toast]:text-white font-bold rounded-lg",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600 rounded-lg",
          success: "group-[.toaster]:text-green-600 group-[.toaster]:border-green-200",
          error: "group-[.toaster]:text-red-600 group-[.toaster]:border-red-200",
          warning: "group-[.toaster]:text-yellow-600 group-[.toaster]:border-yellow-200",
          info: "group-[.toaster]:text-blue-600 group-[.toaster]:border-blue-200",
          icon: "group-data-[type=error]:text-red-600 group-data-[type=success]:text-green-600 group-data-[type=warning]:text-yellow-600 group-data-[type=info]:text-[#2B7FFF]",
          loader: "group-[.toast]:text-[#2B7FFF]", // Sonner spinner uses currentColor so we can just set text color, gradient might not work on svg stroke, so solid blue is safer.
        },
      }}
      expand={false}
      richColors
      {...props}
    />
  );
};
