-- AlterTable
ALTER TABLE "Worker" ADD COLUMN "inactiveFrom" DATETIME;

-- CreateIndex
CREATE INDEX "Worker_inactiveFrom_idx" ON "Worker"("inactiveFrom");
