/*
  Warnings:

  - You are about to drop the column `authorId` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the `AuthorArticle` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_authorId_fkey";

-- DropForeignKey
ALTER TABLE "AuthorArticle" DROP CONSTRAINT "AuthorArticle_articleId_fkey";

-- DropForeignKey
ALTER TABLE "AuthorArticle" DROP CONSTRAINT "AuthorArticle_authorId_fkey";

-- AlterTable
ALTER TABLE "Article" DROP COLUMN "authorId";

-- DropTable
DROP TABLE "AuthorArticle";

-- CreateTable
CREATE TABLE "article_authors" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "authorOrder" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_authors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "article_authors_authorId_articleId_key" ON "article_authors"("authorId", "articleId");

-- AddForeignKey
ALTER TABLE "article_authors" ADD CONSTRAINT "article_authors_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_authors" ADD CONSTRAINT "article_authors_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
