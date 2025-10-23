/*
  Warnings:

  - You are about to drop the column `previousDue` on the `Salary` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Salary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workerId" INTEGER NOT NULL,
    "cycleStart" DATETIME NOT NULL,
    "cycleEnd" DATETIME NOT NULL,
    "basePay" REAL NOT NULL DEFAULT 0,
    "otPay" REAL NOT NULL DEFAULT 0,
    "grossPay" REAL NOT NULL DEFAULT 0,
    "totalAdvance" REAL NOT NULL DEFAULT 0,
    "totalExpense" REAL NOT NULL DEFAULT 0,
    "netPay" REAL NOT NULL DEFAULT 0,
    "totalPaid" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentProof" TEXT,
    "issuedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Salary_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Salary" ("basePay", "createdAt", "cycleEnd", "cycleStart", "grossPay", "id", "issuedAt", "netPay", "otPay", "paymentProof", "status", "totalAdvance", "totalExpense", "totalPaid", "updatedAt", "workerId") SELECT "basePay", "createdAt", "cycleEnd", "cycleStart", "grossPay", "id", "issuedAt", "netPay", "otPay", "paymentProof", "status", "totalAdvance", "totalExpense", "totalPaid", "updatedAt", "workerId" FROM "Salary";
DROP TABLE "Salary";
ALTER TABLE "new_Salary" RENAME TO "Salary";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
