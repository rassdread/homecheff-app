-- PushToken: optioneel device-id voor tokenvervanging per apparaat
ALTER TABLE "PushToken" ADD COLUMN "deviceId" TEXT;

CREATE INDEX "PushToken_userId_deviceId_idx" ON "PushToken" ("userId", "deviceId");
