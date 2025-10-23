/*
  Warnings:

  - You are about to drop the column `isActive` on the `ExpenseType` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExpenseType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);
INSERT INTO "new_ExpenseType" ("id", "name") SELECT "id", "name" FROM "ExpenseType";
DROP TABLE "ExpenseType";
ALTER TABLE "new_ExpenseType" RENAME TO "ExpenseType";
CREATE UNIQUE INDEX "ExpenseType_name_key" ON "ExpenseType"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
