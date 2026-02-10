-- CreateTable
CREATE TABLE IF NOT EXISTS "DishVideo" (
    "id" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "duration" INTEGER,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DishVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DishVideo_dishId_key" ON "DishVideo"("dishId");

-- CreateIndex
CREATE INDEX "DishVideo_dishId_idx" ON "DishVideo"("dishId");

-- AddForeignKey
ALTER TABLE "DishVideo" ADD CONSTRAINT "DishVideo_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;




