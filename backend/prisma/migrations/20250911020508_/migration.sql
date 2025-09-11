/*
  Warnings:

  - You are about to drop the column `endDate` on the `DeliveryPattern` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `DeliveryPattern` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeliveryPattern" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliveryPattern_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "CustomerProductContract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DeliveryPattern" ("contractId", "createdAt", "dayOfWeek", "id", "isActive", "quantity", "updatedAt") SELECT "contractId", "createdAt", "dayOfWeek", "id", "isActive", "quantity", "updatedAt" FROM "DeliveryPattern";
DROP TABLE "DeliveryPattern";
ALTER TABLE "new_DeliveryPattern" RENAME TO "DeliveryPattern";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
