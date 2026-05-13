"use client";

import React, { useState } from 'react';

type ProfileAvatarProps = {
  imageUrl?: string;
  initial: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
};

export function ProfileAvatar({
  imageUrl,
  initial,
  alt,
  className = 'h-9 w-9',
  fallbackClassName = 'bg-blue-500 hover:bg-blue-600',
}: ProfileAvatarProps) {
  const [failedImageUrl, setFailedImageUrl] = useState('');
  const canShowImage = Boolean(imageUrl) && failedImageUrl !== imageUrl;

  if (canShowImage) {
    return (
      <span className={`${className} block overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-100`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setFailedImageUrl(imageUrl ?? '')}
        />
      </span>
    );
  }

  return (
    <span
      className={`${className} flex items-center justify-center rounded-full text-[14px] font-bold text-white transition-colors ${fallbackClassName}`}
    >
      {initial}
    </span>
  );
}
