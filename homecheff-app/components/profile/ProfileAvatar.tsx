"use client";
import React from "react";
import Image from "next/image";

type Props = {
  imageUrl?: string | null;
  size?: number; // in px
  className?: string;
};

export default function ProfileAvatar({ imageUrl, size = 160, className = "" }: Props) {
  const src = imageUrl || "/avatar-placeholder.png";
  const dim = `${size}px`;
  return (
    <div
      className={`relative overflow-hidden rounded-full border-2 border-emerald-700/60 shadow-sm ${className}`}
      style={{ width: dim, height: dim }}
    >
      {/* Use next/image in fill mode for crisp cover */}
      <Image
        src={src}
        alt="Profielfoto"
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
    </div>
  );
}
