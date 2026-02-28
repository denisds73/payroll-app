-- AlterTable
ALTER TABLE "Salary" ADD COLUMN "signature" TEXT;

-- CreateTable
CREATE TABLE "SalaryPayment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "salaryId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proof" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalaryPayment_salaryId_fkey" FOREIGN KEY ("salaryId") REFERENCES "Salary" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Advance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workerId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "reason" TEXT,
    "signature" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salaryId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Advance_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Advance_salaryId_fkey" FOREIGN KEY ("salaryId") REFERENCES "Salary" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Advance" ("amount", "createdAt", "date", "id", "reason", "updatedAt", "workerId") SELECT "amount", "createdAt", "date", "id", "reason", "updatedAt", "workerId" FROM "Advance";
DROP TABLE "Advance";
ALTER TABLE "new_Advance" RENAME TO "Advance";
CREATE INDEX "Advance_workerId_date_idx" ON "Advance"("workerId", "date");
CREATE INDEX "Advance_salaryId_idx" ON "Advance"("salaryId");
CREATE TABLE "new_Worker" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "wage" REAL NOT NULL,
    "otRate" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "balance" REAL NOT NULL DEFAULT 0,
    "openingBalance" REAL NOT NULL DEFAULT 0,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "inactiveFrom" DATETIME
);
INSERT INTO "new_Worker" ("balance", "createdAt", "id", "inactiveFrom", "isActive", "joinedAt", "name", "otRate", "phone", "updatedAt", "wage") SELECT "balance", "createdAt", "id", "inactiveFrom", "isActive", "joinedAt", "name", "otRate", "phone", "updatedAt", "wage" FROM "Worker";
DROP TABLE "Worker";
ALTER TABLE "new_Worker" RENAME TO "Worker";
CREATE INDEX "Worker_inactiveFrom_idx" ON "Worker"("inactiveFrom");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");
