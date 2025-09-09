-- CreateTable
CREATE TABLE "ContractPause" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractId" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContractPause_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "CustomerProductContract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
