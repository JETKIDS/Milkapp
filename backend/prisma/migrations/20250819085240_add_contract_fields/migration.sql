-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomerProductContract" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL DEFAULT 0,
    "patternType" TEXT NOT NULL DEFAULT '1',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomerProductContract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CustomerProductContract_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CustomerProductContract" ("createdAt", "customerId", "endDate", "id", "isActive", "productId", "startDate", "updatedAt") SELECT "createdAt", "customerId", "endDate", "id", "isActive", "productId", "startDate", "updatedAt" FROM "CustomerProductContract";
DROP TABLE "CustomerProductContract";
ALTER TABLE "new_CustomerProductContract" RENAME TO "CustomerProductContract";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
