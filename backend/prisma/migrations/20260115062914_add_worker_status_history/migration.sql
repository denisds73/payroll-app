-- CreateTable
CREATE TABLE "WorkerStatusHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workerId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "effectiveFrom" DATETIME NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkerStatusHistory_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WorkerStatusHistory_workerId_effectiveFrom_idx" ON "WorkerStatusHistory"("workerId", "effectiveFrom");
