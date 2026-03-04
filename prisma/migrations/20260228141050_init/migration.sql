-- CreateTable
CREATE TABLE "users" (
    "id_user" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAccess" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id_user")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
