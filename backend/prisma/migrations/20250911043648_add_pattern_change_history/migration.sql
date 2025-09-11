-- CreateTable
CREATE TABLE "PatternChangeHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractId" INTEGER NOT NULL,
    "changeDate" DATETIME NOT NULL,
    "patterns" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatternChangeHistory_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "CustomerProductContract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
