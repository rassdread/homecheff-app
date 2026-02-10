/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."DishStatus" AS ENUM ('PRIVATE', 'PUBLISHED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "username" TEXT;

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

    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DishPhoto" (
    "id" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "idx" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DishPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dish_userId_idx" ON "public"."Dish"("userId");

-- CreateIndex
CREATE INDEX "DishPhoto_dishId_idx" ON "public"."DishPhoto"("dishId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- AddForeignKey
ALTER TABLE "public"."Dish" ADD CONSTRAINT "Dish_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DishPhoto" ADD CONSTRAINT "DishPhoto_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "public"."Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;
