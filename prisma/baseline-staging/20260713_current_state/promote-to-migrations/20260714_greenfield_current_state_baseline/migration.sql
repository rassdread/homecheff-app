-- HomeCheff Phase 9 — current-state greenfield baseline (STAGING — NOT ACTIVE MIGRATION CHAIN)
-- Generated: 2026-07-13 via: npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma
-- DO NOT apply to shared Neon. Use scripts/run-disposable-greenfield-test.ts on disposable DB only.
-- Baseline version: 20260713_current_state

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AttributionType" AS ENUM ('USER_SIGNUP', 'BUSINESS_SIGNUP');

-- CreateEnum
CREATE TYPE "public"."AttributionSource" AS ENUM ('REF_LINK', 'PROMO_CODE', 'MANUAL', 'ANDROID_BETA_DOWNLOAD');

-- CreateEnum
CREATE TYPE "public"."PromoCodeStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "public"."CommissionLedgerEventType" AS ENUM ('INVOICE_PAID', 'ORDER_PAID', 'REFUND', 'CHARGEBACK', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."CommissionLedgerStatus" AS ENUM ('PENDING', 'AVAILABLE', 'PAID', 'REVERSED');

-- CreateEnum
CREATE TYPE "public"."AffiliatePayoutStatus" AS ENUM ('CREATED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."AffiliateStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."PendingAcceptedValueStatus" AS ENUM ('PENDING', 'APPROVED', 'MERGED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ListingIntent" AS ENUM ('OFFER', 'REQUEST');

-- CreateEnum
CREATE TYPE "public"."MarketplaceCategory" AS ENUM ('CREATE', 'GROW', 'DESIGN', 'ARTISTIC_SERVICE', 'PRACTICAL_SERVICE', 'KNOWLEDGE');

-- CreateEnum
CREATE TYPE "public"."PriceModel" AS ENUM ('FIXED', 'ON_REQUEST', 'FROM_PRICE', 'HOURLY', 'DAILY', 'VOLUNTARY');

-- CreateEnum
CREATE TYPE "public"."BarterOpenness" AS ENUM ('MONEY', 'MONEY_AND_BARTER', 'BARTER_ONLY');

-- CreateEnum
CREATE TYPE "public"."HcpRewardStatus" AS ENUM ('ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."HcpCarouselSlideType" AS ENUM ('RANKING', 'PROMO', 'SPOTLIGHT', 'SPONSORED', 'INFO');

-- CreateEnum
CREATE TYPE "public"."HcpCarouselPlacement" AS ENUM ('HOME', 'RANKINGS', 'BOTH');

-- CreateEnum
CREATE TYPE "public"."HcpCarouselTargetType" AS ENUM ('GLOBAL', 'COUNTRY', 'RADIUS');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."ConversationContextType" AS ENUM ('PRODUCT', 'ORDER', 'DELIVERY', 'SERVICE', 'TASK', 'REQUEST', 'BARTER', 'GENERAL', 'PARTNER');

-- CreateEnum
CREATE TYPE "public"."ConversationStatus" AS ENUM ('ACTIVE', 'AWAITING_RESPONSE', 'RESOLVED', 'CLOSED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN', 'BUYER', 'SELLER', 'DELIVERY', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "public"."MessagePrivacy" AS ENUM ('NOBODY', 'FANS_ONLY', 'EVERYONE');

-- CreateEnum
CREATE TYPE "public"."FanRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."DeliveryMode" AS ENUM ('PICKUP', 'DELIVERY', 'SHIPPING', 'BOTH');

-- CreateEnum
CREATE TYPE "public"."TransportationMode" AS ENUM ('BIKE', 'EBIKE', 'SCOOTER', 'CAR');

-- CreateEnum
CREATE TYPE "public"."ListingCategory" AS ENUM ('HOMECHEFF', 'HOMEGROWN', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'REMOVED', 'MODERATED');

-- CreateEnum
CREATE TYPE "public"."ProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ProposalFulfillmentType" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "public"."ProposalCategory" AS ENUM ('PRODUCT', 'SERVICE', 'TASK', 'REQUEST');

-- CreateEnum
CREATE TYPE "public"."SettlementMode" AS ENUM ('MONEY', 'MONEY_AND_VALUE', 'VALUE_ONLY', 'FREE', 'VOLUNTARY');

-- CreateEnum
CREATE TYPE "public"."CommunityOrderStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."CommunityOrderFulfillmentMode" AS ENUM ('PICKUP', 'DELIVERY', 'DIGITAL', 'ON_SITE_PROVIDER', 'ON_SITE_CLIENT');

-- CreateEnum
CREATE TYPE "public"."DeliveryRequestStatus" AS ENUM ('OPEN', 'CLAIMED', 'ASSIGNED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."CourierWeekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "public"."CourierVehicleType" AS ENUM ('CAR', 'BIKE', 'SCOOTER', 'WALK');

-- CreateEnum
CREATE TYPE "public"."CourierAssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'PRODUCT_SHARE', 'SYSTEM', 'ORDER_STATUS_UPDATE', 'ORDER_PICKUP_INFO', 'ORDER_DELIVERY_INFO', 'ORDER_ADDRESS_UPDATE', 'PROPOSAL', 'PROPOSAL_SYSTEM');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('NEW_LISTING_NEARBY', 'RESERVATION_UPDATE', 'MESSAGE_RECEIVED', 'ADMIN_NOTICE', 'NEW_CONVERSATION', 'MESSAGE_REACTION', 'FAN_REQUEST', 'PROP_RECEIVED', 'FOLLOW_RECEIVED', 'FAVORITE_RECEIVED', 'REVIEW_RECEIVED', 'ORDER_RECEIVED', 'ORDER_UPDATE', 'PROPOSAL_RECEIVED', 'PROPOSAL_ACCEPTED', 'PROPOSAL_REJECTED', 'PROPOSAL_COUNTERED', 'PROPOSAL_ALTERNATIVE_VALUE', 'PROPOSAL_MIXED_ACCEPTED', 'COMMUNITY_ORDER_CREATED', 'DELIVERY_REQUEST_CREATED', 'DELIVERY_REQUEST_ASSIGNED', 'DELIVERY_REQUEST_ACCEPTED', 'DELIVERY_REQUEST_COMPLETED');

-- CreateEnum
CREATE TYPE "public"."ProductCategory" AS ENUM ('CHEFF', 'GROWN', 'DESIGNER');

-- CreateEnum
CREATE TYPE "public"."ProductOrderMethod" AS ENUM ('HOMECHEFF_PAYMENT', 'CONTACT');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "public"."StockReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('CREATED', 'AUTHORIZED', 'CAPTURED', 'CANCELLED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."Unit" AS ENUM ('PORTION', 'STUK', 'HUNDRED_G', 'KG', 'BOSJE', 'SET', 'METER', 'CM', 'M2');

-- CreateEnum
CREATE TYPE "public"."DishStatus" AS ENUM ('PRIVATE', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "public"."DownloadPermission" AS ENUM ('EVERYONE', 'FANS_ONLY', 'FAN_OF_ONLY', 'ASK_PERMISSION', 'NOBODY');

-- CreateEnum
CREATE TYPE "public"."PrintPermission" AS ENUM ('EVERYONE', 'FANS_ONLY', 'FAN_OF_ONLY', 'ASK_PERMISSION', 'NOBODY');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('BUYER', 'SELLER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."WorkspaceContentType" AS ENUM ('RECIPE', 'GROWING_PROCESS', 'DESIGN_ITEM');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bio" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "place" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "name" TEXT,
    "passwordHash" TEXT,
    "profileImage" TEXT,
    "username" TEXT,
    "interests" TEXT[],
    "accountHolderName" TEXT,
    "bankName" TEXT,
    "buyerRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "displayFullName" BOOLEAN NOT NULL DEFAULT true,
    "gender" TEXT,
    "iban" TEXT,
    "marketingAccepted" BOOLEAN NOT NULL DEFAULT false,
    "marketingAcceptedAt" TIMESTAMP(3),
    "privacyPolicyAccepted" BOOLEAN NOT NULL DEFAULT false,
    "privacyPolicyAcceptedAt" TIMESTAMP(3),
    "sellerRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stripeConnectAccountId" TEXT,
    "stripeConnectOnboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "taxResponsibilityAccepted" BOOLEAN NOT NULL DEFAULT false,
    "taxResponsibilityAcceptedAt" TIMESTAMP(3),
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" TIMESTAMP(3),
    "allowProfileViews" BOOLEAN NOT NULL DEFAULT true,
    "fanRequestEnabled" BOOLEAN NOT NULL DEFAULT true,
    "messagePrivacy" "public"."MessagePrivacy" NOT NULL DEFAULT 'EVERYONE',
    "showActivityStatus" BOOLEAN NOT NULL DEFAULT true,
    "showFansList" BOOLEAN NOT NULL DEFAULT true,
    "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true,
    "showProfileToEveryone" BOOLEAN NOT NULL DEFAULT true,
    "quote" TEXT,
    "displayNameOption" TEXT NOT NULL DEFAULT 'full',
    "encryptionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "hasEncryptionKey" BOOLEAN NOT NULL DEFAULT false,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'NL',
    "state" TEXT,
    "timezone" TEXT DEFAULT 'Europe/Amsterdam',
    "messageGuidelinesAccepted" BOOLEAN NOT NULL DEFAULT false,
    "messageGuidelinesAcceptedAt" TIMESTAMP(3),
    "socialOnboardingCompleted" BOOLEAN NOT NULL DEFAULT true,
    "phoneNumber" TEXT,
    "publicPhoneEnabled" BOOLEAN NOT NULL DEFAULT false,
    "publicPhoneNumber" TEXT,
    "publicWhatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "publicWhatsappNumber" TEXT,
    "publicInstagramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "instagramUrl" TEXT,
    "publicFacebookEnabled" BOOLEAN NOT NULL DEFAULT false,
    "facebookUrl" TEXT,
    "publicTikTokEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tiktokUrl" TEXT,
    "publicWebsiteEnabled" BOOLEAN NOT NULL DEFAULT false,
    "websiteUrl" TEXT,
    "publicTelegramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "telegramUrl" TEXT,
    "downloadPermission" "public"."DownloadPermission" NOT NULL DEFAULT 'EVERYONE',
    "printPermission" "public"."PrintPermission" NOT NULL DEFAULT 'EVERYONE',
    "lastLocationUpdate" TIMESTAMP(3),
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "emailVerificationExpires" TIMESTAMP(3),
    "emailVerificationToken" TEXT,
    "adminRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emailVerificationCode" TEXT,
    "preferredLanguage" TEXT DEFAULT 'nl',
    "hideHomeHero" BOOLEAN NOT NULL DEFAULT false,
    "hideHowItWorks" BOOLEAN NOT NULL DEFAULT false,
    "hcpWelcomeSeenAt" TIMESTAMP(3),
    "betaTesterJoinedAt" TIMESTAMP(3),
    "androidBetaOnboardingCompletedAt" TIMESTAMP(3),
    "dateOfBirth" TIMESTAMP(3),
    "accountDeletedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "suspendedById" TEXT,
    "suspendReason" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Business" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kvkNumber" TEXT,
    "vatNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'NL',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workplacePhotos" TEXT[],

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Affiliate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentAffiliateId" TEXT,
    "status" "public"."AffiliateStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeConnectAccountId" TEXT,
    "stripeConnectOnboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "customUserCommissionPct" DOUBLE PRECISION,
    "customBusinessCommissionPct" DOUBLE PRECISION,
    "customParentUserCommissionPct" DOUBLE PRECISION,
    "customParentBusinessCommissionPct" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReferralLink" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attribution" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."AttributionType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "source" "public"."AttributionSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PromoCode" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT,
    "sellerId" TEXT,
    "code" TEXT NOT NULL,
    "appliesTo" TEXT NOT NULL DEFAULT 'SUBSCRIPTION_ONLY',
    "discountSharePct" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "maxRedemptions" INTEGER,
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."PromoCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BusinessSubscription" (
    "id" TEXT NOT NULL,
    "businessUserId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "planId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "status" TEXT NOT NULL,
    "promoCodeId" TEXT,
    "attributionId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommissionLedger" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" "public"."CommissionLedgerEventType" NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "status" "public"."CommissionLedgerStatus" NOT NULL DEFAULT 'PENDING',
    "availableAt" TIMESTAMP(3),
    "meta" JSONB,
    "businessSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AffiliatePayout" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "status" "public"."AffiliatePayoutStatus" NOT NULL DEFAULT 'CREATED',
    "stripeTransferId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliatePayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubAffiliateInvite" (
    "id" TEXT NOT NULL,
    "parentAffiliateId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "inviteToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubAffiliateInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "category" "public"."ProductCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "unit" "public"."Unit" NOT NULL,
    "delivery" "public"."DeliveryMode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayNameType" TEXT NOT NULL DEFAULT 'fullname',
    "maxStock" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "availabilityDate" TIMESTAMP(3),
    "isFutureProduct" BOOLEAN NOT NULL DEFAULT false,
    "subcategory" TEXT,
    "pickupAddress" TEXT,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "sellerCanDeliver" BOOLEAN NOT NULL DEFAULT false,
    "deliveryRadiusKm" DOUBLE PRECISION,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "orderMethod" "public"."ProductOrderMethod" NOT NULL DEFAULT 'HOMECHEFF_PAYMENT',
    "listingIntent" "public"."ListingIntent" NOT NULL DEFAULT 'OFFER',
    "marketplaceCategory" "public"."MarketplaceCategory",
    "priceModel" "public"."PriceModel" NOT NULL DEFAULT 'FIXED',
    "acceptHomeCheffPayment" BOOLEAN NOT NULL DEFAULT true,
    "acceptDirectContact" BOOLEAN NOT NULL DEFAULT false,
    "fulfillmentOptions" JSONB,
    "barterOpenness" "public"."BarterOpenness",
    "placeName" TEXT,
    "useProfileLocation" BOOLEAN NOT NULL DEFAULT true,
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "acceptedSpecializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lengthCm" DOUBLE PRECISION,
    "widthCm" DOUBLE PRECISION,
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PendingAcceptedValueProposal" (
    "id" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "public"."MarketplaceCategory" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'nl',
    "listingCount" INTEGER NOT NULL DEFAULT 0,
    "userCount" INTEGER NOT NULL DEFAULT 0,
    "firstUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."PendingAcceptedValueStatus" NOT NULL DEFAULT 'PENDING',
    "approvedTaxonomyId" TEXT,

    CONSTRAINT "PendingAcceptedValueProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PendingAcceptedValueProposalUser" (
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingAcceptedValueProposalUser_pkey" PRIMARY KEY ("proposalId","userId")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminAction" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "reportId" TEXT,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "listingId" TEXT,
    "action" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reservationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastMessageAt" TIMESTAMP(3),
    "productId" TEXT,
    "title" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT,
    "contextType" "public"."ConversationContextType" NOT NULL DEFAULT 'GENERAL',
    "contextId" TEXT,
    "status" "public"."ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3),
    "isTyping" BOOLEAN NOT NULL DEFAULT false,
    "lastTypingAt" TIMESTAMP(3),
    "isHidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConversationKey" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "encryptionKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountCents" INTEGER,
    "discountPercent" INTEGER,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Favorite" (
    "userId" TEXT NOT NULL,
    "listingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "dishId" TEXT,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Image" (
    "id" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Listing" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "category" "public"."ListingCategory" NOT NULL,
    "status" "public"."ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "place" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "availabilityDate" TIMESTAMP(3),
    "isFutureProduct" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ListingMedia" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ListingTag" (
    "listingId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ListingTag_pkey" PRIMARY KEY ("listingId","tagId")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "attachmentName" TEXT,
    "attachmentType" TEXT,
    "attachmentUrl" TEXT,
    "deletedAt" TIMESTAMP(3),
    "editedAt" TIMESTAMP(3),
    "messageType" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "orderNumber" TEXT,
    "encryptedText" TEXT,
    "encryptionKey" TEXT,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "proposalId" TEXT,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Proposal" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "productId" TEXT,
    "listingId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER,
    "amountCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "requestedDate" TIMESTAMP(3),
    "requestedTimeWindow" TEXT,
    "fulfillmentType" "public"."ProposalFulfillmentType",
    "category" "public"."ProposalCategory" NOT NULL DEFAULT 'PRODUCT',
    "settlementMode" "public"."SettlementMode" NOT NULL DEFAULT 'MONEY',
    "acceptedValueTaxonomyIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requestedValueTaxonomyIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "proposalSummary" JSONB,
    "status" "public"."ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "parentProposalId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Agreement" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "acceptedById" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agreementSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommunityOrder" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "public"."CommunityOrderStatus" NOT NULL DEFAULT 'OPEN',
    "fulfillmentMode" "public"."CommunityOrderFulfillmentMode",
    "deliveryRequested" BOOLEAN NOT NULL DEFAULT false,
    "deliveryAssigned" BOOLEAN NOT NULL DEFAULT false,
    "checkoutOrderId" TEXT,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DealReview" (
    "id" TEXT NOT NULL,
    "communityOrderId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeliveryRequest" (
    "id" TEXT NOT NULL,
    "communityOrderId" TEXT NOT NULL,
    "status" "public"."DeliveryRequestStatus" NOT NULL DEFAULT 'OPEN',
    "pickupAddress" TEXT,
    "deliveryAddress" TEXT,
    "pickupDate" TIMESTAMP(3),
    "pickupTimeWindow" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "deliveryTimeWindow" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourierAvailability" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekday" "public"."CourierWeekday" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "radiusKm" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "preferredAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vehicleType" "public"."CourierVehicleType" NOT NULL DEFAULT 'BIKE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourierAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourierAssignment" (
    "id" TEXT NOT NULL,
    "deliveryRequestId" TEXT NOT NULL,
    "courierId" TEXT NOT NULL,
    "status" "public"."CourierAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourierAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT,
    "deliveryOrderId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentEscrow" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "payoutTrigger" TEXT NOT NULL,
    "currentStatus" TEXT NOT NULL DEFAULT 'held',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidOutAt" TIMESTAMP(3),

    CONSTRAINT "PaymentEscrow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShippingLabel" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "ectaroShipLabelId" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priceCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "printedAt" TIMESTAMP(3),

    CONSTRAINT "ShippingLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payout" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "toUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerRef" TEXT,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Refund" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerRef" TEXT,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "reporterId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "reason" TEXT NOT NULL,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reservation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "public"."ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductReview" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "orderId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderItemId" TEXT,
    "reviewSubmittedAt" TIMESTAMP(3),
    "reviewToken" TEXT,
    "reviewTokenExpires" TIMESTAMP(3),

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SellerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "bio" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "btw" TEXT,
    "companyName" TEXT,
    "kvk" TEXT,
    "subscriptionId" TEXT,
    "subscriptionValidUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryMode" TEXT NOT NULL DEFAULT 'FIXED',
    "deliveryRadius" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "deliveryRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "feeBps" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "platformFeeBps" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'CREATED',
    "provider" TEXT,
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderNumber" TEXT,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" INTEGER NOT NULL,
    "deliveryAddress" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "deliveryMode" "public"."DeliveryMode" NOT NULL DEFAULT 'PICKUP',
    "notes" TEXT,
    "pickupAddress" TEXT,
    "pickupDate" TIMESTAMP(3),
    "platformFeeCollected" BOOLEAN NOT NULL DEFAULT false,
    "stripeSessionId" TEXT,
    "shippingCostCents" INTEGER,
    "shippingLabelCostCents" INTEGER,
    "shippingLabelId" TEXT,
    "shippingTrackingNumber" TEXT,
    "shippingCarrier" TEXT,
    "shippingMethod" TEXT,
    "shippingStatus" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "paymentHeld" BOOLEAN NOT NULL DEFAULT false,
    "payoutScheduled" BOOLEAN NOT NULL DEFAULT false,
    "payoutTrigger" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockReservation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."StockReservationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FanRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" "public"."FanRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FanRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Dish" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "status" "public"."DishStatus" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "priceCents" INTEGER,
    "deliveryMode" "public"."DeliveryMode",
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "place" TEXT,
    "maxStock" INTEGER,
    "stock" INTEGER DEFAULT 0,
    "category" TEXT,
    "subcategory" TEXT,
    "difficulty" TEXT,
    "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "instructions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prepTime" INTEGER,
    "servings" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "growthDuration" INTEGER,
    "harvestDate" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "plantDate" TEXT,
    "plantDistance" TEXT,
    "plantType" TEXT,
    "soilType" TEXT,
    "sunlight" TEXT,
    "waterNeeds" TEXT,
    "dimensions" TEXT,
    "materials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "downloadPermission" "public"."DownloadPermission" NOT NULL DEFAULT 'EVERYONE',
    "printPermission" "public"."PrintPermission" NOT NULL DEFAULT 'EVERYONE',

    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DishPhoto" (
    "id" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "idx" INTEGER NOT NULL DEFAULT 0,
    "isMain" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DishPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DishVideo" (
    "id" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "duration" INTEGER,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DishVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductVideo" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "duration" INTEGER,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecipeStepPhoto" (
    "id" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "idx" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,

    CONSTRAINT "RecipeStepPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GardenGrowthPhoto" (
    "id" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "phaseNumber" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "idx" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,

    CONSTRAINT "GardenGrowthPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReviewImage" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReviewImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DishReview" (
    "id" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "orderId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DishReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DishReviewImage" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DishReviewImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReviewResponse" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeliveryProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "bio" TEXT,
    "transportation" "public"."TransportationMode"[],
    "maxDistance" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "preferredRadius" DOUBLE PRECISION,
    "homeLat" DOUBLE PRECISION,
    "homeLng" DOUBLE PRECISION,
    "homeAddress" TEXT,
    "availableDays" TEXT[],
    "availableTimeSlots" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "totalDeliveries" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentAddress" TEXT,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "deliveryMode" TEXT NOT NULL DEFAULT 'FIXED',
    "deliveryRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastLocationUpdate" TIMESTAMP(3),
    "batteryLevel" INTEGER,
    "gpsTrackingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastGpsUpdate" TIMESTAMP(3),
    "locationAccuracy" DOUBLE PRECISION,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastOnlineAt" TIMESTAMP(3),
    "lastOfflineAt" TIMESTAMP(3),
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedAt" TIMESTAMP(3),
    "blockedById" TEXT,
    "blockReason" TEXT,

    CONSTRAINT "DeliveryProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeliveryAvailability" (
    "id" TEXT NOT NULL,
    "deliveryProfileId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "morningSlot" BOOLEAN NOT NULL DEFAULT false,
    "afternoonSlot" BOOLEAN NOT NULL DEFAULT false,
    "eveningSlot" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customSlots" JSONB,

    CONSTRAINT "DeliveryAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeliveryNotificationSettings" (
    "id" TEXT NOT NULL,
    "deliveryProfileId" TEXT NOT NULL,
    "enablePushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "enableEmailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "enableSmsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "autoGoOnline" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "shiftReminders" JSONB NOT NULL DEFAULT '[60, 30, 5]',

    CONSTRAINT "DeliveryNotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShiftNotification" (
    "id" TEXT NOT NULL,
    "deliveryProfileId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "notifyAt" TIMESTAMP(3) NOT NULL,
    "minutesBefore" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "channel" TEXT NOT NULL DEFAULT 'PUSH',
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "error" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PushToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "deviceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNewMessages" BOOLEAN NOT NULL DEFAULT true,
    "emailNewOrders" BOOLEAN NOT NULL DEFAULT true,
    "emailOrderUpdates" BOOLEAN NOT NULL DEFAULT true,
    "emailDeliveryUpdates" BOOLEAN NOT NULL DEFAULT true,
    "emailMarketing" BOOLEAN NOT NULL DEFAULT false,
    "emailWeeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "emailSecurityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "pushNewMessages" BOOLEAN NOT NULL DEFAULT true,
    "pushNewOrders" BOOLEAN NOT NULL DEFAULT true,
    "pushOrderUpdates" BOOLEAN NOT NULL DEFAULT true,
    "pushDeliveryUpdates" BOOLEAN NOT NULL DEFAULT true,
    "pushNearbyProducts" BOOLEAN NOT NULL DEFAULT false,
    "pushSecurityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "smsOrderUpdates" BOOLEAN NOT NULL DEFAULT false,
    "smsDeliveryUpdates" BOOLEAN NOT NULL DEFAULT false,
    "smsSecurityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "chatSoundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "chatNotificationPreview" BOOLEAN NOT NULL DEFAULT true,
    "chatGroupMentionsOnly" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT DEFAULT '22:00',
    "quietHoursEnd" TEXT DEFAULT '08:00',
    "pushHcpRewards" BOOLEAN NOT NULL DEFAULT true,
    "pushPromotionalUpdates" BOOLEAN NOT NULL DEFAULT false,
    "betaFeaturesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BetaDownloadEvent" (
    "id" TEXT NOT NULL,
    "refCode" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetaDownloadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DynamicSeller" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "locationAccuracy" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "deliveryRadius" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "availableTimeSlots" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "specialInstructions" TEXT,
    "estimatedDeliveryTime" INTEGER NOT NULL DEFAULT 30,
    "lastLocationUpdate" TIMESTAMP(3),
    "lastGpsUpdate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicSeller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeliveryOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "deliveryProfileId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "deliveryFee" DOUBLE PRECISION NOT NULL,
    "estimatedTime" INTEGER,
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deliveryFeeCollected" BOOLEAN NOT NULL DEFAULT false,
    "deliveryAddress" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "deliveryTime" TEXT,
    "productId" TEXT,

    CONSTRAINT "DeliveryOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HomeCheffCollection" (
    "id" TEXT NOT NULL,
    "platformFees" INTEGER NOT NULL,
    "deliveryFeeCuts" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "processedOrdersCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeCheffCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VehiclePhoto" (
    "id" TEXT NOT NULL,
    "deliveryProfileId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehiclePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeliveryReview" (
    "id" TEXT NOT NULL,
    "deliveryProfileId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "orderId" TEXT,
    "courierAssignmentId" TEXT,
    "deliveryRequestId" TEXT,
    "communityOrderId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkplacePhoto" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkplacePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkspaceContent" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "type" "public"."WorkspaceContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkspaceContentPhoto" (
    "id" TEXT NOT NULL,
    "workspaceContentId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceContentPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkspaceContentProp" (
    "id" TEXT NOT NULL,
    "workspaceContentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceContentProp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkspaceContentComment" (
    "id" TEXT NOT NULL,
    "workspaceContentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceContentComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Recipe" (
    "id" TEXT NOT NULL,
    "workspaceContentId" TEXT NOT NULL,
    "servings" INTEGER,
    "prepTime" INTEGER,
    "cookTime" INTEGER,
    "difficulty" TEXT,
    "ingredients" JSONB NOT NULL,
    "instructions" JSONB NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GrowingProcess" (
    "id" TEXT NOT NULL,
    "workspaceContentId" TEXT NOT NULL,
    "plantName" TEXT NOT NULL,
    "plantType" TEXT,
    "variety" TEXT,
    "startDate" TIMESTAMP(3),
    "expectedHarvest" TIMESTAMP(3),
    "growingMethod" TEXT,
    "soilType" TEXT,
    "wateringSchedule" TEXT,
    "currentStage" TEXT,
    "weeklyUpdates" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrowingProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DesignItem" (
    "id" TEXT NOT NULL,
    "workspaceContentId" TEXT NOT NULL,
    "category" TEXT,
    "materials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "techniques" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dimensions" TEXT,
    "inspiration" TEXT,
    "process" JSONB NOT NULL,
    "challenges" TEXT,
    "solutions" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isForSale" BOOLEAN NOT NULL DEFAULT false,
    "priceCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HcpEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HcpEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserHcpStats" (
    "userId" TEXT NOT NULL,
    "totalHcp" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastDailyHcpDate" TEXT,
    "pendingClientRewards" JSONB,
    "weeklyChallengesJson" JSONB,

    CONSTRAINT "UserHcpStats_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."Badge" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserHcpReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "public"."HcpRewardStatus" NOT NULL DEFAULT 'ACTIVE',
    "grantedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserHcpReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HcpCarouselSlide" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "imageUrl" TEXT,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "backgroundStyle" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "slideType" "public"."HcpCarouselSlideType" NOT NULL DEFAULT 'PROMO',
    "placement" "public"."HcpCarouselPlacement" NOT NULL DEFAULT 'BOTH',
    "targetType" "public"."HcpCarouselTargetType" NOT NULL DEFAULT 'GLOBAL',
    "targetCountry" TEXT,
    "targetLat" DOUBLE PRECISION,
    "targetLng" DOUBLE PRECISION,
    "targetRadiusKm" INTEGER,
    "localeFilter" TEXT,
    "countryFilter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HcpCarouselSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EncryptionKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "EncryptionKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showTotalUsersWidget" BOOLEAN NOT NULL DEFAULT true,
    "showActiveUsersWidget" BOOLEAN NOT NULL DEFAULT true,
    "showTotalProductsWidget" BOOLEAN NOT NULL DEFAULT true,
    "showActiveDeliverersWidget" BOOLEAN NOT NULL DEFAULT true,
    "showTotalOrdersWidget" BOOLEAN NOT NULL DEFAULT true,
    "showTotalRevenueWidget" BOOLEAN NOT NULL DEFAULT true,
    "showSystemEventsWidget" BOOLEAN NOT NULL DEFAULT true,
    "showRecentUsersWidget" BOOLEAN NOT NULL DEFAULT true,
    "showRecentProductsWidget" BOOLEAN NOT NULL DEFAULT true,
    "showUsersTab" BOOLEAN NOT NULL DEFAULT true,
    "showMessagesTab" BOOLEAN NOT NULL DEFAULT true,
    "showSellersTab" BOOLEAN NOT NULL DEFAULT true,
    "showProductsTab" BOOLEAN NOT NULL DEFAULT true,
    "showDeliveryTab" BOOLEAN NOT NULL DEFAULT true,
    "showLiveLocationsTab" BOOLEAN NOT NULL DEFAULT true,
    "showAnalyticsTab" BOOLEAN NOT NULL DEFAULT true,
    "showModerationTab" BOOLEAN NOT NULL DEFAULT true,
    "showNotificationsTab" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminPermissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "canViewRevenue" BOOLEAN NOT NULL DEFAULT true,
    "canViewUserDetails" BOOLEAN NOT NULL DEFAULT true,
    "canViewUserEmails" BOOLEAN NOT NULL DEFAULT true,
    "canViewProductDetails" BOOLEAN NOT NULL DEFAULT true,
    "canViewOrderDetails" BOOLEAN NOT NULL DEFAULT true,
    "canViewDeliveryDetails" BOOLEAN NOT NULL DEFAULT true,
    "canViewAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "canViewSystemMetrics" BOOLEAN NOT NULL DEFAULT true,
    "canViewAuditLogs" BOOLEAN NOT NULL DEFAULT true,
    "canViewPaymentInfo" BOOLEAN NOT NULL DEFAULT true,
    "canViewPrivateMessages" BOOLEAN NOT NULL DEFAULT true,
    "canViewOrdersTab" BOOLEAN,
    "canViewFinancialTab" BOOLEAN,
    "canViewDisputesTab" BOOLEAN,
    "canViewSettingsTab" BOOLEAN,
    "canViewAuditTab" BOOLEAN,
    "canViewUsersTab" BOOLEAN,
    "canViewMessagesTab" BOOLEAN,
    "canViewSellersTab" BOOLEAN,
    "canViewProductsTab" BOOLEAN,
    "canViewDeliveryTab" BOOLEAN,
    "canViewLiveLocationsTab" BOOLEAN,
    "canViewAnalyticsTab" BOOLEAN,
    "canViewVariabelenTab" BOOLEAN,
    "canViewModerationTab" BOOLEAN,
    "canViewNotificationsTab" BOOLEAN,
    "canDeleteUsers" BOOLEAN NOT NULL DEFAULT true,
    "canEditUsers" BOOLEAN NOT NULL DEFAULT true,
    "canDeleteProducts" BOOLEAN NOT NULL DEFAULT true,
    "canEditProducts" BOOLEAN NOT NULL DEFAULT true,
    "canModerateContent" BOOLEAN NOT NULL DEFAULT true,
    "canSendNotifications" BOOLEAN NOT NULL DEFAULT true,
    "canManageAdminPermissions" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_accountDeletedAt_idx" ON "public"."User"("accountDeletedAt");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "public"."User"("name");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE INDEX "User_city_idx" ON "public"."User"("city");

-- CreateIndex
CREATE INDEX "User_country_idx" ON "public"."User"("country");

-- CreateIndex
CREATE UNIQUE INDEX "Business_userId_key" ON "public"."Business"("userId");

-- CreateIndex
CREATE INDEX "Business_userId_idx" ON "public"."Business"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_userId_key" ON "public"."Affiliate"("userId");

-- CreateIndex
CREATE INDEX "Affiliate_userId_idx" ON "public"."Affiliate"("userId");

-- CreateIndex
CREATE INDEX "Affiliate_parentAffiliateId_idx" ON "public"."Affiliate"("parentAffiliateId");

-- CreateIndex
CREATE INDEX "Affiliate_status_idx" ON "public"."Affiliate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralLink_code_key" ON "public"."ReferralLink"("code");

-- CreateIndex
CREATE INDEX "ReferralLink_affiliateId_idx" ON "public"."ReferralLink"("affiliateId");

-- CreateIndex
CREATE INDEX "ReferralLink_code_idx" ON "public"."ReferralLink"("code");

-- CreateIndex
CREATE INDEX "Attribution_affiliateId_idx" ON "public"."Attribution"("affiliateId");

-- CreateIndex
CREATE INDEX "Attribution_userId_idx" ON "public"."Attribution"("userId");

-- CreateIndex
CREATE INDEX "Attribution_startsAt_endsAt_idx" ON "public"."Attribution"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Attribution_type_idx" ON "public"."Attribution"("type");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "public"."PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_affiliateId_idx" ON "public"."PromoCode"("affiliateId");

-- CreateIndex
CREATE INDEX "PromoCode_sellerId_idx" ON "public"."PromoCode"("sellerId");

-- CreateIndex
CREATE INDEX "PromoCode_code_idx" ON "public"."PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_status_idx" ON "public"."PromoCode"("status");

-- CreateIndex
CREATE INDEX "PromoCode_startsAt_endsAt_idx" ON "public"."PromoCode"("startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessSubscription_businessUserId_key" ON "public"."BusinessSubscription"("businessUserId");

-- CreateIndex
CREATE INDEX "BusinessSubscription_businessUserId_idx" ON "public"."BusinessSubscription"("businessUserId");

-- CreateIndex
CREATE INDEX "BusinessSubscription_stripeSubscriptionId_idx" ON "public"."BusinessSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "BusinessSubscription_startsAt_endsAt_idx" ON "public"."BusinessSubscription"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "BusinessSubscription_attributionId_idx" ON "public"."BusinessSubscription"("attributionId");

-- CreateIndex
CREATE INDEX "BusinessSubscription_promoCodeId_idx" ON "public"."BusinessSubscription"("promoCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionLedger_eventId_key" ON "public"."CommissionLedger"("eventId");

-- CreateIndex
CREATE INDEX "CommissionLedger_affiliateId_idx" ON "public"."CommissionLedger"("affiliateId");

-- CreateIndex
CREATE INDEX "CommissionLedger_eventId_idx" ON "public"."CommissionLedger"("eventId");

-- CreateIndex
CREATE INDEX "CommissionLedger_status_idx" ON "public"."CommissionLedger"("status");

-- CreateIndex
CREATE INDEX "CommissionLedger_availableAt_idx" ON "public"."CommissionLedger"("availableAt");

-- CreateIndex
CREATE INDEX "CommissionLedger_eventType_idx" ON "public"."CommissionLedger"("eventType");

-- CreateIndex
CREATE INDEX "AffiliatePayout_affiliateId_idx" ON "public"."AffiliatePayout"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliatePayout_status_idx" ON "public"."AffiliatePayout"("status");

-- CreateIndex
CREATE INDEX "AffiliatePayout_periodStart_periodEnd_idx" ON "public"."AffiliatePayout"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "SubAffiliateInvite_inviteToken_key" ON "public"."SubAffiliateInvite"("inviteToken");

-- CreateIndex
CREATE INDEX "SubAffiliateInvite_parentAffiliateId_idx" ON "public"."SubAffiliateInvite"("parentAffiliateId");

-- CreateIndex
CREATE INDEX "SubAffiliateInvite_inviteToken_idx" ON "public"."SubAffiliateInvite"("inviteToken");

-- CreateIndex
CREATE INDEX "SubAffiliateInvite_email_idx" ON "public"."SubAffiliateInvite"("email");

-- CreateIndex
CREATE INDEX "SubAffiliateInvite_status_idx" ON "public"."SubAffiliateInvite"("status");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "public"."Product"("category");

-- CreateIndex
CREATE INDEX "Product_sellerId_idx" ON "public"."Product"("sellerId");

-- CreateIndex
CREATE INDEX "Product_availabilityDate_isFutureProduct_idx" ON "public"."Product"("availabilityDate", "isFutureProduct");

-- CreateIndex
CREATE INDEX "Product_isActive_createdAt_idx" ON "public"."Product"("isActive", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Product_category_isActive_idx" ON "public"."Product"("category", "isActive");

-- CreateIndex
CREATE INDEX "Product_subcategory_idx" ON "public"."Product"("subcategory");

-- CreateIndex
CREATE INDEX "Product_delivery_idx" ON "public"."Product"("delivery");

-- CreateIndex
CREATE INDEX "Product_priceCents_idx" ON "public"."Product"("priceCents");

-- CreateIndex
CREATE INDEX "idx_product_category" ON "public"."Product"("category");

-- CreateIndex
CREATE INDEX "idx_product_seller" ON "public"."Product"("sellerId");

-- CreateIndex
CREATE INDEX "Product_listingIntent_idx" ON "public"."Product"("listingIntent");

-- CreateIndex
CREATE INDEX "Product_marketplaceCategory_idx" ON "public"."Product"("marketplaceCategory");

-- CreateIndex
CREATE INDEX "Product_priceModel_idx" ON "public"."Product"("priceModel");

-- CreateIndex
CREATE INDEX "Product_specializations_idx" ON "public"."Product" USING GIN ("specializations");

-- CreateIndex
CREATE INDEX "Product_acceptedSpecializations_idx" ON "public"."Product" USING GIN ("acceptedSpecializations");

-- CreateIndex
CREATE UNIQUE INDEX "PendingAcceptedValueProposal_canonicalKey_key" ON "public"."PendingAcceptedValueProposal"("canonicalKey");

-- CreateIndex
CREATE INDEX "PendingAcceptedValueProposal_status_idx" ON "public"."PendingAcceptedValueProposal"("status");

-- CreateIndex
CREATE INDEX "PendingAcceptedValueProposal_listingCount_idx" ON "public"."PendingAcceptedValueProposal"("listingCount" DESC);

-- CreateIndex
CREATE INDEX "PendingAcceptedValueProposal_category_idx" ON "public"."PendingAcceptedValueProposal"("category");

-- CreateIndex
CREATE INDEX "PendingAcceptedValueProposal_language_idx" ON "public"."PendingAcceptedValueProposal"("language");

-- CreateIndex
CREATE INDEX "PendingAcceptedValueProposalUser_userId_idx" ON "public"."PendingAcceptedValueProposalUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_reservationId_key" ON "public"."Conversation"("reservationId");

-- CreateIndex
CREATE INDEX "Conversation_productId_idx" ON "public"."Conversation"("productId");

-- CreateIndex
CREATE INDEX "Conversation_orderId_idx" ON "public"."Conversation"("orderId");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "public"."Conversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "idx_conversation_last_message" ON "public"."Conversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_contextType_contextId_idx" ON "public"."Conversation"("contextType", "contextId");

-- CreateIndex
CREATE INDEX "Conversation_status_idx" ON "public"."Conversation"("status");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "public"."ConversationParticipant"("userId");

-- CreateIndex
CREATE INDEX "idx_conversation_participant_user" ON "public"."ConversationParticipant"("userId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_lastSeen_idx" ON "public"."ConversationParticipant"("lastSeen");

-- CreateIndex
CREATE INDEX "ConversationParticipant_isHidden_idx" ON "public"."ConversationParticipant"("isHidden");

-- CreateIndex
CREATE INDEX "idx_conversation_participant_hidden" ON "public"."ConversationParticipant"("isHidden");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "public"."ConversationParticipant"("conversationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationKey_conversationId_key" ON "public"."ConversationKey"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "public"."Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "public"."DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_idx" ON "public"."DeviceToken"("userId");

-- CreateIndex
CREATE INDEX "Favorite_listingId_idx" ON "public"."Favorite"("listingId");

-- CreateIndex
CREATE INDEX "Favorite_productId_idx" ON "public"."Favorite"("productId");

-- CreateIndex
CREATE INDEX "Favorite_dishId_idx" ON "public"."Favorite"("dishId");

-- CreateIndex
CREATE INDEX "idx_favorite_product" ON "public"."Favorite"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_listingId_key" ON "public"."Favorite"("userId", "listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_productId_key" ON "public"."Favorite"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_dishId_key" ON "public"."Favorite"("userId", "dishId");

-- CreateIndex
CREATE INDEX "Image_productId_sortOrder_idx" ON "public"."Image"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "Listing_lat_lng_idx" ON "public"."Listing"("lat", "lng");

-- CreateIndex
CREATE INDEX "Listing_status_category_createdAt_idx" ON "public"."Listing"("status", "category", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_availabilityDate_isFutureProduct_idx" ON "public"."Listing"("availabilityDate", "isFutureProduct");

-- CreateIndex
CREATE INDEX "ListingMedia_listingId_order_idx" ON "public"."ListingMedia"("listingId", "order");

-- CreateIndex
CREATE INDEX "ListingTag_tagId_idx" ON "public"."ListingTag"("tagId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "public"."Message"("conversationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Message_proposalId_idx" ON "public"."Message"("proposalId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "public"."Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_orderNumber_idx" ON "public"."Message"("orderNumber");

-- CreateIndex
CREATE INDEX "Message_isEncrypted_idx" ON "public"."Message"("isEncrypted");

-- CreateIndex
CREATE INDEX "Message_readAt_idx" ON "public"."Message"("readAt");

-- CreateIndex
CREATE INDEX "Message_deliveredAt_idx" ON "public"."Message"("deliveredAt");

-- CreateIndex
CREATE INDEX "Message_deletedAt_idx" ON "public"."Message"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_message_sender" ON "public"."Message"("senderId");

-- CreateIndex
CREATE INDEX "Proposal_conversationId_status_createdAt_idx" ON "public"."Proposal"("conversationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Proposal_sellerId_status_idx" ON "public"."Proposal"("sellerId", "status");

-- CreateIndex
CREATE INDEX "Proposal_buyerId_status_idx" ON "public"."Proposal"("buyerId", "status");

-- CreateIndex
CREATE INDEX "Proposal_parentProposalId_idx" ON "public"."Proposal"("parentProposalId");

-- CreateIndex
CREATE INDEX "Proposal_acceptedValueTaxonomyIds_idx" ON "public"."Proposal" USING GIN ("acceptedValueTaxonomyIds");

-- CreateIndex
CREATE INDEX "Proposal_requestedValueTaxonomyIds_idx" ON "public"."Proposal" USING GIN ("requestedValueTaxonomyIds");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_proposalId_key" ON "public"."Agreement"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityOrder_agreementId_key" ON "public"."CommunityOrder"("agreementId");

-- CreateIndex
CREATE INDEX "CommunityOrder_conversationId_idx" ON "public"."CommunityOrder"("conversationId");

-- CreateIndex
CREATE INDEX "CommunityOrder_proposalId_idx" ON "public"."CommunityOrder"("proposalId");

-- CreateIndex
CREATE INDEX "CommunityOrder_buyerId_status_idx" ON "public"."CommunityOrder"("buyerId", "status");

-- CreateIndex
CREATE INDEX "CommunityOrder_sellerId_status_idx" ON "public"."CommunityOrder"("sellerId", "status");

-- CreateIndex
CREATE INDEX "CommunityOrder_checkoutOrderId_idx" ON "public"."CommunityOrder"("checkoutOrderId");

-- CreateIndex
CREATE INDEX "DealReview_revieweeId_idx" ON "public"."DealReview"("revieweeId");

-- CreateIndex
CREATE INDEX "DealReview_communityOrderId_idx" ON "public"."DealReview"("communityOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "DealReview_communityOrderId_reviewerId_key" ON "public"."DealReview"("communityOrderId", "reviewerId");

-- CreateIndex
CREATE INDEX "DeliveryRequest_communityOrderId_idx" ON "public"."DeliveryRequest"("communityOrderId");

-- CreateIndex
CREATE INDEX "DeliveryRequest_status_idx" ON "public"."DeliveryRequest"("status");

-- CreateIndex
CREATE INDEX "CourierAvailability_userId_isActive_idx" ON "public"."CourierAvailability"("userId", "isActive");

-- CreateIndex
CREATE INDEX "CourierAvailability_weekday_idx" ON "public"."CourierAvailability"("weekday");

-- CreateIndex
CREATE INDEX "CourierAssignment_deliveryRequestId_status_idx" ON "public"."CourierAssignment"("deliveryRequestId", "status");

-- CreateIndex
CREATE INDEX "CourierAssignment_courierId_status_idx" ON "public"."CourierAssignment"("courierId", "status");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "public"."Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_orderId_idx" ON "public"."Notification"("orderId");

-- CreateIndex
CREATE INDEX "Notification_deliveryOrderId_idx" ON "public"."Notification"("deliveryOrderId");

-- CreateIndex
CREATE INDEX "PaymentEscrow_orderId_idx" ON "public"."PaymentEscrow"("orderId");

-- CreateIndex
CREATE INDEX "PaymentEscrow_sellerId_idx" ON "public"."PaymentEscrow"("sellerId");

-- CreateIndex
CREATE INDEX "PaymentEscrow_currentStatus_idx" ON "public"."PaymentEscrow"("currentStatus");

-- CreateIndex
CREATE INDEX "ShippingLabel_orderId_idx" ON "public"."ShippingLabel"("orderId");

-- CreateIndex
CREATE INDEX "ShippingLabel_ectaroShipLabelId_idx" ON "public"."ShippingLabel"("ectaroShipLabelId");

-- CreateIndex
CREATE INDEX "ShippingLabel_trackingNumber_idx" ON "public"."ShippingLabel"("trackingNumber");

-- CreateIndex
CREATE INDEX "Reservation_buyerId_status_createdAt_idx" ON "public"."Reservation"("buyerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Reservation_sellerId_status_createdAt_idx" ON "public"."Reservation"("sellerId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_orderItemId_key" ON "public"."ProductReview"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_reviewToken_key" ON "public"."ProductReview"("reviewToken");

-- CreateIndex
CREATE INDEX "ProductReview_productId_idx" ON "public"."ProductReview"("productId");

-- CreateIndex
CREATE INDEX "ProductReview_buyerId_idx" ON "public"."ProductReview"("buyerId");

-- CreateIndex
CREATE INDEX "ProductReview_rating_idx" ON "public"."ProductReview"("rating");

-- CreateIndex
CREATE INDEX "ProductReview_orderId_idx" ON "public"."ProductReview"("orderId");

-- CreateIndex
CREATE INDEX "ProductReview_orderItemId_idx" ON "public"."ProductReview"("orderItemId");

-- CreateIndex
CREATE INDEX "ProductReview_reviewToken_idx" ON "public"."ProductReview"("reviewToken");

-- CreateIndex
CREATE INDEX "idx_review_buyer" ON "public"."ProductReview"("buyerId");

-- CreateIndex
CREATE INDEX "idx_review_product" ON "public"."ProductReview"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_productId_buyerId_key" ON "public"."ProductReview"("productId", "buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_userId_key" ON "public"."SellerProfile"("userId");

-- CreateIndex
CREATE INDEX "SellerProfile_userId_idx" ON "public"."SellerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "public"."Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_reservationId_key" ON "public"."Transaction"("reservationId");

-- CreateIndex
CREATE INDEX "Transaction_buyerId_status_createdAt_idx" ON "public"."Transaction"("buyerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_sellerId_status_createdAt_idx" ON "public"."Transaction"("sellerId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "StockReservation_stripeSessionId_key" ON "public"."StockReservation"("stripeSessionId");

-- CreateIndex
CREATE INDEX "StockReservation_productId_status_expiresAt_idx" ON "public"."StockReservation"("productId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "StockReservation_stripeSessionId_idx" ON "public"."StockReservation"("stripeSessionId");

-- CreateIndex
CREATE INDEX "StockReservation_expiresAt_idx" ON "public"."StockReservation"("expiresAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "public"."OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "public"."OrderItem"("productId");

-- CreateIndex
CREATE INDEX "Follow_sellerId_idx" ON "public"."Follow"("sellerId");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "public"."Follow"("followerId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_sellerId_key" ON "public"."Follow"("followerId", "sellerId");

-- CreateIndex
CREATE INDEX "FanRequest_targetId_idx" ON "public"."FanRequest"("targetId");

-- CreateIndex
CREATE INDEX "FanRequest_status_idx" ON "public"."FanRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FanRequest_requesterId_targetId_key" ON "public"."FanRequest"("requesterId", "targetId");

-- CreateIndex
CREATE INDEX "Dish_userId_idx" ON "public"."Dish"("userId");

-- CreateIndex
CREATE INDEX "Dish_status_createdAt_idx" ON "public"."Dish"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "DishPhoto_dishId_idx" ON "public"."DishPhoto"("dishId");

-- CreateIndex
CREATE INDEX "DishVideo_dishId_idx" ON "public"."DishVideo"("dishId");

-- CreateIndex
CREATE UNIQUE INDEX "DishVideo_dishId_key" ON "public"."DishVideo"("dishId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVideo_productId_key" ON "public"."ProductVideo"("productId");

-- CreateIndex
CREATE INDEX "ProductVideo_productId_idx" ON "public"."ProductVideo"("productId");

-- CreateIndex
CREATE INDEX "RecipeStepPhoto_dishId_idx" ON "public"."RecipeStepPhoto"("dishId");

-- CreateIndex
CREATE INDEX "RecipeStepPhoto_dishId_stepNumber_idx" ON "public"."RecipeStepPhoto"("dishId", "stepNumber");

-- CreateIndex
CREATE INDEX "GardenGrowthPhoto_dishId_idx" ON "public"."GardenGrowthPhoto"("dishId");

-- CreateIndex
CREATE INDEX "GardenGrowthPhoto_dishId_phaseNumber_idx" ON "public"."GardenGrowthPhoto"("dishId", "phaseNumber");

-- CreateIndex
CREATE INDEX "ReviewImage_reviewId_idx" ON "public"."ReviewImage"("reviewId");

-- CreateIndex
CREATE INDEX "DishReview_dishId_idx" ON "public"."DishReview"("dishId");

-- CreateIndex
CREATE INDEX "DishReview_reviewerId_idx" ON "public"."DishReview"("reviewerId");

-- CreateIndex
CREATE INDEX "DishReview_rating_idx" ON "public"."DishReview"("rating");

-- CreateIndex
CREATE INDEX "DishReview_orderId_idx" ON "public"."DishReview"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DishReview_dishId_reviewerId_key" ON "public"."DishReview"("dishId", "reviewerId");

-- CreateIndex
CREATE INDEX "DishReviewImage_reviewId_idx" ON "public"."DishReviewImage"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewResponse_reviewId_idx" ON "public"."ReviewResponse"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewResponse_sellerId_idx" ON "public"."ReviewResponse"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryProfile_userId_key" ON "public"."DeliveryProfile"("userId");

-- CreateIndex
CREATE INDEX "DeliveryAvailability_deliveryProfileId_idx" ON "public"."DeliveryAvailability"("deliveryProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryAvailability_deliveryProfileId_dayOfWeek_key" ON "public"."DeliveryAvailability"("deliveryProfileId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryNotificationSettings_deliveryProfileId_key" ON "public"."DeliveryNotificationSettings"("deliveryProfileId");

-- CreateIndex
CREATE INDEX "DeliveryNotificationSettings_deliveryProfileId_idx" ON "public"."DeliveryNotificationSettings"("deliveryProfileId");

-- CreateIndex
CREATE INDEX "ShiftNotification_deliveryProfileId_notifyAt_status_idx" ON "public"."ShiftNotification"("deliveryProfileId", "notifyAt", "status");

-- CreateIndex
CREATE INDEX "ShiftNotification_notifyAt_status_idx" ON "public"."ShiftNotification"("notifyAt", "status");

-- CreateIndex
CREATE INDEX "ShiftNotification_status_idx" ON "public"."ShiftNotification"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_token_key" ON "public"."PushToken"("token");

-- CreateIndex
CREATE INDEX "PushToken_userId_idx" ON "public"."PushToken"("userId");

-- CreateIndex
CREATE INDEX "PushToken_userId_deviceId_idx" ON "public"."PushToken"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "PushToken_token_idx" ON "public"."PushToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreferences_userId_key" ON "public"."NotificationPreferences"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreferences_userId_idx" ON "public"."NotificationPreferences"("userId");

-- CreateIndex
CREATE INDEX "BetaDownloadEvent_createdAt_idx" ON "public"."BetaDownloadEvent"("createdAt");

-- CreateIndex
CREATE INDEX "BetaDownloadEvent_refCode_idx" ON "public"."BetaDownloadEvent"("refCode");

-- CreateIndex
CREATE UNIQUE INDEX "DynamicSeller_userId_key" ON "public"."DynamicSeller"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryOrder_orderId_key" ON "public"."DeliveryOrder"("orderId");

-- CreateIndex
CREATE INDEX "VehiclePhoto_deliveryProfileId_idx" ON "public"."VehiclePhoto"("deliveryProfileId");

-- CreateIndex
CREATE INDEX "DeliveryReview_deliveryProfileId_idx" ON "public"."DeliveryReview"("deliveryProfileId");

-- CreateIndex
CREATE INDEX "DeliveryReview_reviewerId_idx" ON "public"."DeliveryReview"("reviewerId");

-- CreateIndex
CREATE INDEX "DeliveryReview_communityOrderId_idx" ON "public"."DeliveryReview"("communityOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryReview_deliveryProfileId_reviewerId_orderId_key" ON "public"."DeliveryReview"("deliveryProfileId", "reviewerId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryReview_courierAssignmentId_reviewerId_key" ON "public"."DeliveryReview"("courierAssignmentId", "reviewerId");

-- CreateIndex
CREATE INDEX "WorkplacePhoto_sellerProfileId_idx" ON "public"."WorkplacePhoto"("sellerProfileId");

-- CreateIndex
CREATE INDEX "WorkplacePhoto_role_idx" ON "public"."WorkplacePhoto"("role");

-- CreateIndex
CREATE INDEX "WorkspaceContent_sellerProfileId_idx" ON "public"."WorkspaceContent"("sellerProfileId");

-- CreateIndex
CREATE INDEX "WorkspaceContent_type_idx" ON "public"."WorkspaceContent"("type");

-- CreateIndex
CREATE INDEX "WorkspaceContent_isPublic_idx" ON "public"."WorkspaceContent"("isPublic");

-- CreateIndex
CREATE INDEX "WorkspaceContentPhoto_workspaceContentId_idx" ON "public"."WorkspaceContentPhoto"("workspaceContentId");

-- CreateIndex
CREATE INDEX "WorkspaceContentProp_workspaceContentId_idx" ON "public"."WorkspaceContentProp"("workspaceContentId");

-- CreateIndex
CREATE INDEX "WorkspaceContentProp_userId_idx" ON "public"."WorkspaceContentProp"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceContentProp_workspaceContentId_userId_key" ON "public"."WorkspaceContentProp"("workspaceContentId", "userId");

-- CreateIndex
CREATE INDEX "WorkspaceContentComment_workspaceContentId_idx" ON "public"."WorkspaceContentComment"("workspaceContentId");

-- CreateIndex
CREATE INDEX "WorkspaceContentComment_userId_idx" ON "public"."WorkspaceContentComment"("userId");

-- CreateIndex
CREATE INDEX "WorkspaceContentComment_parentId_idx" ON "public"."WorkspaceContentComment"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_workspaceContentId_key" ON "public"."Recipe"("workspaceContentId");

-- CreateIndex
CREATE UNIQUE INDEX "GrowingProcess_workspaceContentId_key" ON "public"."GrowingProcess"("workspaceContentId");

-- CreateIndex
CREATE UNIQUE INDEX "DesignItem_workspaceContentId_key" ON "public"."DesignItem"("workspaceContentId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_entityType_idx" ON "public"."AnalyticsEvent"("eventType", "entityType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_entityId_idx" ON "public"."AnalyticsEvent"("entityId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "public"."AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "public"."AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "idx_analytics_event_created_at" ON "public"."AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "idx_analytics_event_user" ON "public"."AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "HcpEvent_userId_createdAt_idx" ON "public"."HcpEvent"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "HcpEvent_userId_action_sourceType_sourceId_key" ON "public"."HcpEvent"("userId", "action", "sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_slug_key" ON "public"."Badge"("slug");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "public"."UserBadge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "public"."UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "UserHcpReward_userId_idx" ON "public"."UserHcpReward"("userId");

-- CreateIndex
CREATE INDEX "UserHcpReward_status_idx" ON "public"."UserHcpReward"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserHcpReward_userId_slug_key" ON "public"."UserHcpReward"("userId", "slug");

-- CreateIndex
CREATE INDEX "HcpCarouselSlide_isActive_sortOrder_idx" ON "public"."HcpCarouselSlide"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "HcpCarouselSlide_startsAt_endsAt_idx" ON "public"."HcpCarouselSlide"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "HcpCarouselSlide_placement_idx" ON "public"."HcpCarouselSlide"("placement");

-- CreateIndex
CREATE INDEX "EncryptionKey_userId_idx" ON "public"."EncryptionKey"("userId");

-- CreateIndex
CREATE INDEX "EncryptionKey_keyHash_idx" ON "public"."EncryptionKey"("keyHash");

-- CreateIndex
CREATE INDEX "EncryptionKey_isActive_idx" ON "public"."EncryptionKey"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPreferences_userId_key" ON "public"."AdminPreferences"("userId");

-- CreateIndex
CREATE INDEX "AdminPreferences_userId_idx" ON "public"."AdminPreferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermissions_userId_key" ON "public"."AdminPermissions"("userId");

-- CreateIndex
CREATE INDEX "AdminPermissions_userId_idx" ON "public"."AdminPermissions"("userId");

-- AddForeignKey
ALTER TABLE "public"."Business" ADD CONSTRAINT "Business_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Affiliate" ADD CONSTRAINT "Affiliate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Affiliate" ADD CONSTRAINT "Affiliate_parentAffiliateId_fkey" FOREIGN KEY ("parentAffiliateId") REFERENCES "public"."Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralLink" ADD CONSTRAINT "ReferralLink_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attribution" ADD CONSTRAINT "Attribution_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attribution" ADD CONSTRAINT "Attribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromoCode" ADD CONSTRAINT "PromoCode_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromoCode" ADD CONSTRAINT "PromoCode_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BusinessSubscription" ADD CONSTRAINT "BusinessSubscription_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "public"."PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BusinessSubscription" ADD CONSTRAINT "BusinessSubscription_attributionId_fkey" FOREIGN KEY ("attributionId") REFERENCES "public"."Attribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommissionLedger" ADD CONSTRAINT "CommissionLedger_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommissionLedger" ADD CONSTRAINT "CommissionLedger_businessSubscriptionId_fkey" FOREIGN KEY ("businessSubscriptionId") REFERENCES "public"."BusinessSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AffiliatePayout" ADD CONSTRAINT "AffiliatePayout_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubAffiliateInvite" ADD CONSTRAINT "SubAffiliateInvite_parentAffiliateId_fkey" FOREIGN KEY ("parentAffiliateId") REFERENCES "public"."Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."SellerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PendingAcceptedValueProposalUser" ADD CONSTRAINT "PendingAcceptedValueProposalUser_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."PendingAcceptedValueProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminAction" ADD CONSTRAINT "AdminAction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminAction" ADD CONSTRAINT "AdminAction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "public"."Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConversationKey" ADD CONSTRAINT "ConversationKey_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "public"."Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Image" ADD CONSTRAINT "Image_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Listing" ADD CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ListingMedia" ADD CONSTRAINT "ListingMedia_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ListingTag" ADD CONSTRAINT "ListingTag_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ListingTag" ADD CONSTRAINT "ListingTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proposal" ADD CONSTRAINT "Proposal_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proposal" ADD CONSTRAINT "Proposal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proposal" ADD CONSTRAINT "Proposal_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proposal" ADD CONSTRAINT "Proposal_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proposal" ADD CONSTRAINT "Proposal_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proposal" ADD CONSTRAINT "Proposal_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proposal" ADD CONSTRAINT "Proposal_parentProposalId_fkey" FOREIGN KEY ("parentProposalId") REFERENCES "public"."Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Agreement" ADD CONSTRAINT "Agreement_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Agreement" ADD CONSTRAINT "Agreement_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityOrder" ADD CONSTRAINT "CommunityOrder_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "public"."Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityOrder" ADD CONSTRAINT "CommunityOrder_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityOrder" ADD CONSTRAINT "CommunityOrder_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityOrder" ADD CONSTRAINT "CommunityOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityOrder" ADD CONSTRAINT "CommunityOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityOrder" ADD CONSTRAINT "CommunityOrder_checkoutOrderId_fkey" FOREIGN KEY ("checkoutOrderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DealReview" ADD CONSTRAINT "DealReview_communityOrderId_fkey" FOREIGN KEY ("communityOrderId") REFERENCES "public"."CommunityOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DealReview" ADD CONSTRAINT "DealReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DealReview" ADD CONSTRAINT "DealReview_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_communityOrderId_fkey" FOREIGN KEY ("communityOrderId") REFERENCES "public"."CommunityOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourierAvailability" ADD CONSTRAINT "CourierAvailability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourierAssignment" ADD CONSTRAINT "CourierAssignment_deliveryRequestId_fkey" FOREIGN KEY ("deliveryRequestId") REFERENCES "public"."DeliveryRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourierAssignment" ADD CONSTRAINT "CourierAssignment_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentEscrow" ADD CONSTRAINT "PaymentEscrow_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentEscrow" ADD CONSTRAINT "PaymentEscrow_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShippingLabel" ADD CONSTRAINT "ShippingLabel_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payout" ADD CONSTRAINT "Payout_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payout" ADD CONSTRAINT "Payout_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Refund" ADD CONSTRAINT "Refund_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductReview" ADD CONSTRAINT "ProductReview_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductReview" ADD CONSTRAINT "ProductReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductReview" ADD CONSTRAINT "ProductReview_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "public"."OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SellerProfile" ADD CONSTRAINT "SellerProfile_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SellerProfile" ADD CONSTRAINT "SellerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "public"."Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockReservation" ADD CONSTRAINT "StockReservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Follow" ADD CONSTRAINT "Follow_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FanRequest" ADD CONSTRAINT "FanRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FanRequest" ADD CONSTRAINT "FanRequest_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dish" ADD CONSTRAINT "Dish_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DishPhoto" ADD CONSTRAINT "DishPhoto_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "public"."Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DishVideo" ADD CONSTRAINT "DishVideo_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "public"."Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVideo" ADD CONSTRAINT "ProductVideo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecipeStepPhoto" ADD CONSTRAINT "RecipeStepPhoto_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "public"."Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GardenGrowthPhoto" ADD CONSTRAINT "GardenGrowthPhoto_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "public"."Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewImage" ADD CONSTRAINT "ReviewImage_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."ProductReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DishReview" ADD CONSTRAINT "DishReview_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "public"."Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DishReview" ADD CONSTRAINT "DishReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DishReview" ADD CONSTRAINT "DishReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DishReviewImage" ADD CONSTRAINT "DishReviewImage_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."DishReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewResponse" ADD CONSTRAINT "ReviewResponse_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."ProductReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewResponse" ADD CONSTRAINT "ReviewResponse_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryProfile" ADD CONSTRAINT "DeliveryProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryAvailability" ADD CONSTRAINT "DeliveryAvailability_deliveryProfileId_fkey" FOREIGN KEY ("deliveryProfileId") REFERENCES "public"."DeliveryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryNotificationSettings" ADD CONSTRAINT "DeliveryNotificationSettings_deliveryProfileId_fkey" FOREIGN KEY ("deliveryProfileId") REFERENCES "public"."DeliveryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShiftNotification" ADD CONSTRAINT "ShiftNotification_deliveryProfileId_fkey" FOREIGN KEY ("deliveryProfileId") REFERENCES "public"."DeliveryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushToken" ADD CONSTRAINT "PushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DynamicSeller" ADD CONSTRAINT "DynamicSeller_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_deliveryProfileId_fkey" FOREIGN KEY ("deliveryProfileId") REFERENCES "public"."DeliveryProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_deliveryProfileId_fkey" FOREIGN KEY ("deliveryProfileId") REFERENCES "public"."DeliveryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryReview" ADD CONSTRAINT "DeliveryReview_deliveryProfileId_fkey" FOREIGN KEY ("deliveryProfileId") REFERENCES "public"."DeliveryProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryReview" ADD CONSTRAINT "DeliveryReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryReview" ADD CONSTRAINT "DeliveryReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryReview" ADD CONSTRAINT "DeliveryReview_courierAssignmentId_fkey" FOREIGN KEY ("courierAssignmentId") REFERENCES "public"."CourierAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkplacePhoto" ADD CONSTRAINT "WorkplacePhoto_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "public"."SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceContent" ADD CONSTRAINT "WorkspaceContent_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "public"."SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceContentPhoto" ADD CONSTRAINT "WorkspaceContentPhoto_workspaceContentId_fkey" FOREIGN KEY ("workspaceContentId") REFERENCES "public"."WorkspaceContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceContentProp" ADD CONSTRAINT "WorkspaceContentProp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceContentProp" ADD CONSTRAINT "WorkspaceContentProp_workspaceContentId_fkey" FOREIGN KEY ("workspaceContentId") REFERENCES "public"."WorkspaceContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceContentComment" ADD CONSTRAINT "WorkspaceContentComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."WorkspaceContentComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceContentComment" ADD CONSTRAINT "WorkspaceContentComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceContentComment" ADD CONSTRAINT "WorkspaceContentComment_workspaceContentId_fkey" FOREIGN KEY ("workspaceContentId") REFERENCES "public"."WorkspaceContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Recipe" ADD CONSTRAINT "Recipe_workspaceContentId_fkey" FOREIGN KEY ("workspaceContentId") REFERENCES "public"."WorkspaceContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GrowingProcess" ADD CONSTRAINT "GrowingProcess_workspaceContentId_fkey" FOREIGN KEY ("workspaceContentId") REFERENCES "public"."WorkspaceContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DesignItem" ADD CONSTRAINT "DesignItem_workspaceContentId_fkey" FOREIGN KEY ("workspaceContentId") REFERENCES "public"."WorkspaceContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HcpEvent" ADD CONSTRAINT "HcpEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserHcpStats" ADD CONSTRAINT "UserHcpStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserHcpReward" ADD CONSTRAINT "UserHcpReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EncryptionKey" ADD CONSTRAINT "EncryptionKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminPreferences" ADD CONSTRAINT "AdminPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminPermissions" ADD CONSTRAINT "AdminPermissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

