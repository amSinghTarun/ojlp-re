/*
  Warnings:

  - You are about to drop the column `date` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `doi` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `draft` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `excerpt` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `images` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `published` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `achievements` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `affiliation` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `detailedBio` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `education` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `expertise` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `instagram` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `linkedin` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `orcid` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `publications` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `twitter` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `contact` on the `CallForPapers` table. All the data in the column will be lost.
  - You are about to drop the column `eligibility` on the `CallForPapers` table. All the data in the column will be lost.
  - You are about to drop the column `guidelines` on the `CallForPapers` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `CallForPapers` table. All the data in the column will be lost.
  - You are about to drop the column `achievements` on the `EditorialBoardMember` table. All the data in the column will be lost.
  - You are about to drop the column `affiliation` on the `EditorialBoardMember` table. All the data in the column will be lost.
  - You are about to drop the column `detailedBio` on the `EditorialBoardMember` table. All the data in the column will be lost.
  - You are about to drop the column `education` on the `EditorialBoardMember` table. All the data in the column will be lost.
  - You are about to drop the column `instagram` on the `EditorialBoardMember` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `EditorialBoardMember` table. All the data in the column will be lost.
  - You are about to drop the column `publications` on the `EditorialBoardMember` table. All the data in the column will be lost.
  - You are about to drop the column `twitter` on the `EditorialBoardMember` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `EditorialBoardMember` table. All the data in the column will be lost.
  - You are about to drop the column `coverImage` on the `JournalIssue` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `JournalIssue` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `JournalIssue` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `read` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CategoryArticle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `publisher` to the `CallForPapers` table without a default value. This is not possible if the table is not empty.
  - Made the column `bio` on table `EditorialBoardMember` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'general';

-- DropForeignKey
ALTER TABLE "Author" DROP CONSTRAINT "Author_userId_fkey";

-- DropForeignKey
ALTER TABLE "CategoryArticle" DROP CONSTRAINT "CategoryArticle_articleId_fkey";

-- DropForeignKey
ALTER TABLE "CategoryArticle" DROP CONSTRAINT "CategoryArticle_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropIndex
DROP INDEX "Article_doi_key";

-- DropIndex
DROP INDEX "Author_userId_key";

-- AlterTable
ALTER TABLE "Article" DROP COLUMN "date",
DROP COLUMN "doi",
DROP COLUMN "draft",
DROP COLUMN "excerpt",
DROP COLUMN "images",
DROP COLUMN "published",
ADD COLUMN     "abstract" TEXT,
ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "carousel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "downloadCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Author" DROP COLUMN "achievements",
DROP COLUMN "affiliation",
DROP COLUMN "detailedBio",
DROP COLUMN "education",
DROP COLUMN "expertise",
DROP COLUMN "image",
DROP COLUMN "instagram",
DROP COLUMN "linkedin",
DROP COLUMN "location",
DROP COLUMN "orcid",
DROP COLUMN "publications",
DROP COLUMN "twitter",
DROP COLUMN "userId",
DROP COLUMN "website";

-- AlterTable
ALTER TABLE "CallForPapers" DROP COLUMN "contact",
DROP COLUMN "eligibility",
DROP COLUMN "guidelines",
DROP COLUMN "image",
ADD COLUMN     "publisher" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EditorialBoardMember" DROP COLUMN "achievements",
DROP COLUMN "affiliation",
DROP COLUMN "detailedBio",
DROP COLUMN "education",
DROP COLUMN "instagram",
DROP COLUMN "location",
DROP COLUMN "publications",
DROP COLUMN "twitter",
DROP COLUMN "website",
ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "bio" SET NOT NULL;

-- AlterTable
ALTER TABLE "JournalIssue" DROP COLUMN "coverImage",
DROP COLUMN "description",
DROP COLUMN "title",
ADD COLUMN     "theme" TEXT;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "date",
DROP COLUMN "image",
DROP COLUMN "link",
DROP COLUMN "read",
ADD COLUMN     "linkDisplay" TEXT,
ADD COLUMN     "linkUrl" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerified",
DROP COLUMN "image",
ALTER COLUMN "password" SET NOT NULL;

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "CategoryArticle";

-- DropTable
DROP TABLE "Session";
