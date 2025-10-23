/*
  Warnings:

  - You are about to drop the column `type` on the `Expense` table. All the data in the column will be lost.
  - Added the required column `typeId` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Made the column `workerId` on table `Expense` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "ExpenseType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Expense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workerId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "note" TEXT,
    "typeId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ExpenseType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expense_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Expense" ("amount", "createdAt", "date", "id", "note", "updatedAt", "workerId") SELECT "amount", "createdAt", "date", "id", "note", "updatedAt", "workerId" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";
CREATE INDEX "Expense_workerId_date_idx" ON "Expense"("workerId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseType_name_key" ON "ExpenseType"("name");
