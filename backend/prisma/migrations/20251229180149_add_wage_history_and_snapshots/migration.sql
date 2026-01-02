/*
  Warnings:

  - Added the required column `otRateAtTime` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wageAtTime` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "WageHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workerId" INTEGER NOT NULL,
    "wage" REAL NOT NULL,
    "otRate" REAL NOT NULL,
    "effectiveFrom" DATETIME NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WageHistory_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attendance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "otUnits" REAL DEFAULT 0,
    "note" TEXT,
    "wageAtTime" REAL NOT NULL,
    "otRateAtTime" REAL NOT NULL,
    "workerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Attendance_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Attendance" ("createdAt", "date", "id", "note", "otUnits", "status", "updatedAt", "workerId") SELECT "createdAt", "date", "id", "note", "otUnits", "status", "updatedAt", "workerId" FROM "Attendance";
DROP TABLE "Attendance";
ALTER TABLE "new_Attendance" RENAME TO "Attendance";
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");
CREATE UNIQUE INDEX "Attendance_workerId_date_key" ON "Attendance"("workerId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WageHistory_workerId_effectiveFrom_idx" ON "WageHistory"("workerId", "effectiveFrom");
