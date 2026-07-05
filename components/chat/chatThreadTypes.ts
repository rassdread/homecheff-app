export type ChatThreadMessageType =
  | "TEXT"
  | "IMAGE"
  | "FILE"
  | "PRODUCT_SHARE"
  | "SYSTEM"
  | "ORDER_STATUS_UPDATE"
  | "ORDER_PICKUP_INFO"
  | "ORDER_DELIVERY_INFO"
  | "ORDER_ADDRESS_UPDATE"
  | "PROPOSAL"
  | "PROPOSAL_SYSTEM";

export type ChatThreadUser = {
  id: string;
  name?: string | null;
  username?: string | null;
  profileImage?: string | null;
  displayFullName?: boolean | null;
  displayNameOption?: string | null;
};

/** Eén shape voor ChatBox / Pusher / cache — alle velden optioneel waar API ze soms weglaat. */
export type ChatThreadMessage = {
  id: string;
  text: string | null;
  senderId: string;
  createdAt: string;
  readAt?: string | null;
  deliveredAt?: string | null;
  messageType?: ChatThreadMessageType;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  orderNumber?: string | null;
  proposalId?: string | null;
  User: ChatThreadUser;
};

const SYSTEM_TYPES: ChatThreadMessageType[] = [
  "SYSTEM",
  "ORDER_STATUS_UPDATE",
  "ORDER_PICKUP_INFO",
  "ORDER_DELIVERY_INFO",
  "ORDER_ADDRESS_UPDATE",
  "PROPOSAL_SYSTEM",
];

export function isChatSystemOrOrderMessage(
  messageType: ChatThreadMessageType | undefined
): boolean {
  if (!messageType) return false;
  return SYSTEM_TYPES.includes(messageType);
}
