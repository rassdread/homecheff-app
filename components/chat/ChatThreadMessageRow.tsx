"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Check,
  CheckCheck,
  Loader2,
  CheckCircle,
  Package,
  MapPin,
  Info,
} from "lucide-react";
import { getDisplayName } from "@/lib/displayName";
import type { ChatThreadMessage, ChatThreadMessageType } from "./chatThreadTypes";
import { isChatSystemOrOrderMessage } from "./chatThreadTypes";

function systemLabel(mt: ChatThreadMessageType): string {
  switch (mt) {
    case "ORDER_STATUS_UPDATE":
      return "Bestelling";
    case "ORDER_PICKUP_INFO":
      return "Afhalen";
    case "ORDER_DELIVERY_INFO":
      return "Bezorging";
    case "ORDER_ADDRESS_UPDATE":
      return "Adres";
    case "SYSTEM":
      return "Systeem";
    default:
      return "Update";
  }
}

function systemStyles(mt: ChatThreadMessageType): string {
  switch (mt) {
    case "ORDER_STATUS_UPDATE":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "ORDER_PICKUP_INFO":
      return "border-sky-200 bg-sky-50 text-sky-900";
    case "ORDER_DELIVERY_INFO":
      return "border-violet-200 bg-violet-50 text-violet-900";
    case "ORDER_ADDRESS_UPDATE":
      return "border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "border-gray-200 bg-gray-50 text-gray-800";
  }
}

function SystemIcon({ mt }: { mt: ChatThreadMessageType }) {
  const cls = "h-3.5 w-3.5 shrink-0 opacity-80";
  if (mt === "ORDER_STATUS_UPDATE")
    return <CheckCircle className={cls} aria-hidden />;
  if (mt === "ORDER_PICKUP_INFO" || mt === "ORDER_DELIVERY_INFO")
    return <Package className={cls} aria-hidden />;
  if (mt === "ORDER_ADDRESS_UPDATE")
    return <MapPin className={cls} aria-hidden />;
  return <Info className={cls} aria-hidden />;
}

type Props = {
  msg: ChatThreadMessage;
  currentUserId: string;
  formatTime: (iso: string) => string;
};

export default function ChatThreadMessageRow({
  msg,
  currentUserId,
  formatTime,
}: Props) {
  const mt: ChatThreadMessageType = msg.messageType ?? "TEXT";
  const isOwn = msg.senderId === currentUserId;

  if (isChatSystemOrOrderMessage(mt)) {
    return (
      <div className="flex justify-center px-1">
        <div
          className={`w-full max-w-md rounded-xl border px-3 py-2 shadow-sm ${systemStyles(mt)}`}
        >
          <div className="flex items-center gap-1.5 border-b border-black/5 pb-1.5 mb-1.5">
            <SystemIcon mt={mt} />
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              {systemLabel(mt)}
            </span>
            {msg.orderNumber ? (
              <span className="ml-auto text-[11px] font-medium opacity-80">
                #{msg.orderNumber}
              </span>
            ) : null}
          </div>
          <p className="text-xs leading-snug whitespace-pre-wrap max-h-36 overflow-y-auto">
            {msg.text ?? ""}
          </p>
          <p className="mt-1.5 text-[10px] opacity-60">{formatTime(msg.createdAt)}</p>
        </div>
      </div>
    );
  }

  if (mt === "IMAGE" && msg.attachmentUrl) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[85%] sm:max-w-[70%] space-y-1">
          <div
            className={`rounded-2xl overflow-hidden border ${
              isOwn ? "border-blue-400 bg-blue-500" : "border-gray-200 bg-white"
            }`}
          >
            <Image
              src={msg.attachmentUrl}
              alt=""
              width={280}
              height={280}
              className="max-h-64 w-auto object-cover"
              unoptimized
            />
          </div>
          {msg.text ? (
            <p
              className={`text-sm px-2 ${isOwn ? "text-blue-100 text-right" : "text-gray-700"}`}
            >
              {msg.text}
            </p>
          ) : null}
          <div
            className={`flex items-center gap-1 px-2 ${isOwn ? "justify-end" : "justify-start"}`}
          >
            <span className="text-[11px] text-gray-400">
              {formatTime(msg.createdAt)}
            </span>
            {isOwn &&
              (msg.id.startsWith("temp-") ? (
                <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
              ) : msg.readAt ? (
                <CheckCheck className="w-3 h-3 text-blue-400" />
              ) : msg.deliveredAt ? (
                <CheckCheck className="w-3 h-3 text-gray-400" />
              ) : (
                <Check className="w-3 h-3 text-gray-400" />
              ))}
          </div>
        </div>
      </div>
    );
  }

  if (mt === "FILE" && msg.attachmentUrl) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[85%] sm:max-w-[70%]">
          <div
            className={`rounded-2xl px-3 py-2 border ${
              isOwn
                ? "bg-blue-500 text-white border-blue-400"
                : "bg-white text-gray-900 border-gray-200"
            }`}
          >
            <Link
              href={msg.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm underline ${isOwn ? "text-white" : "text-emerald-700"}`}
            >
              {msg.attachmentName || "Bestand"}
            </Link>
          </div>
          <div
            className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? "justify-end" : "justify-start"}`}
          >
            <span className="text-[11px] text-gray-400">
              {formatTime(msg.createdAt)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* TEXT + PRODUCT_SHARE + default */
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[85%] sm:max-w-[70%]">
        <div
          className={`px-3.5 py-2 rounded-2xl break-words shadow-sm ${
            isOwn
              ? "bg-blue-500 text-white rounded-br-md"
              : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
          }`}
        >
          {msg.orderNumber && mt === "TEXT" ? (
            <p
              className={`text-[11px] font-medium mb-1 ${
                isOwn ? "text-blue-100" : "text-emerald-700"
              }`}
            >
              #{msg.orderNumber}
            </p>
          ) : null}
          <p className="text-sm whitespace-pre-wrap leading-snug">{msg.text ?? ""}</p>
        </div>
        <div
          className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? "justify-end" : "justify-start"}`}
        >
          <span className="text-[11px] text-gray-400">{formatTime(msg.createdAt)}</span>
          {isOwn &&
            (msg.id.startsWith("temp-") ? (
              <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
            ) : msg.readAt ? (
              <CheckCheck className="w-3 h-3 text-blue-400" />
            ) : msg.deliveredAt ? (
              <CheckCheck className="w-3 h-3 text-gray-400" />
            ) : (
              <Check className="w-3 h-3 text-gray-400" />
            ))}
        </div>
      </div>
    </div>
  );
}
