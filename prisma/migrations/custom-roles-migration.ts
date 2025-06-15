import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting migration to custom roles...")

  // Create default roles
  const roles = [
    {
      name: "Super Admin",
      description: "Has full access to all features and settings",
      isSystem: true,
    },
    {
      name: "Admin",
      description: "Has access to most features and settings",
      isSystem: true,
    },
    {
      name: "Editor",
      description: "Can manage content but not users or settings",
      isSystem: true,
    },
    {
      name: "Author",
      description: "Can create and manage their own content",
      isSystem: true,
    },
    {
      name: "Viewer",
      description: "Has read-only access to the admin panel",
      isSystem: true,
    },
  ]

  // Create the roles
  const createdRoles = {}
  for (const role of roles) {
    const createdRole = await prisma.role.create({
      data: role,
    })
    createdRoles[role.name.replace(" ", "_").toUpperCase()] = createdRole.id
    console.log(`Created role: ${role.name}`)
  }

  // Update existing users to use the new role IDs
  const users = await prisma.user.findMany()
  for (const user of users) {
    let roleId
    switch (user.role) {
      case "SUPER_ADMIN":
        roleId = createdRoles.SUPER_ADMIN
        break
      case "ADMIN":
        roleId = createdRoles.ADMIN
        break
      case "EDITOR":
        roleId = createdRoles.EDITOR
        break
      case "AUTHOR":
        roleId = createdRoles.AUTHOR
        break
      case "VIEWER":
      default:
        roleId = createdRoles.VIEWER
        break
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { roleId },
    })
    console.log(`Updated user ${user.name} to use role ID: ${roleId}`)
  }

  console.log("Migration completed successfully!")
}

main()
  .catch((e) => {
    console.error("Migration failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
