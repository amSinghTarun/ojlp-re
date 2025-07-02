"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { BoardMemberType } from "@prisma/client"

// Helper function to get current user with permissions
async function getCurrentUserWithPermissions(): Promise<UserWithPermissions | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    if ('role' in user && user.role) {
      return user as UserWithPermissions
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true }
    })

    return fullUser as UserWithPermissions
  } catch (error) {
    console.error('Error getting user with permissions:', error)
    return null
  }
}

// Updated schema to match the actual Prisma model
const memberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  designation: z.string().min(2, "Designation must be at least 2 characters"),
  memberType: z.nativeEnum(BoardMemberType, {
    required_error: "Member type is required",
  }),
  image: z.string().min(1, "Image is required"),
  order: z.number().optional(),
  bio: z.string().min(1, "Bio is required"),
  email: z.string().email("Invalid email address").optional(),
  expertise: z.array(z.string()).optional(),
  linkedin: z.string().optional(),
  orcid: z.string().optional(),
})

export async function getEditorialBoard() {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to read editorial board members
    const permissionCheck = checkPermission(currentUser, 'editorialboard.READ')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to view editorial board members" 
      }
    }

    const members = await prisma.editorialBoardMember.findMany({
      orderBy: {
        order: "asc",
      },
    })
    
    console.log(`✅ User ${currentUser.email} fetched ${members.length} editorial board members`)
    
    return { success: true, data: members }
  } catch (error) {
    console.error("Failed to fetch editorial board members:", error)
    return { success: false, error: "Failed to fetch editorial board members" }
  }
}

export async function getEditorialBoardMember(id: string) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to read editorial board members
    const permissionCheck = checkPermission(currentUser, 'editorialboard.READ')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to view editorial board member details" 
      }
    }

    const member = await prisma.editorialBoardMember.findUnique({
      where: { id }
    })
    
    if (!member) {
      return { success: false, error: "Member not found" }
    }

    console.log(`✅ User ${currentUser.email} viewed editorial board member: ${member.name}`)
    
    return { success: true, data: member }
  } catch (error) {
    console.error(`Failed to fetch editorial board member ${id}:`, error)
    return { success: false, error: "Failed to fetch editorial board member" }
  }
}

export async function createBoardMember(data: z.infer<typeof memberSchema>) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to create editorial board members
    const permissionCheck = checkPermission(currentUser, 'editorialboard.CREATE')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to create editorial board members" 
      }
    }

    // Validate input data
    const validatedData = memberSchema.parse(data)

    // Check for duplicate email if provided
    if (validatedData.email) {
      const existingMember = await prisma.editorialBoardMember.findFirst({
        where: { 
          email: validatedData.email,
          archived: false
        }
      })

      if (existingMember) {
        return { 
          success: false, 
          error: "A board member with this email already exists" 
        }
      }
    }

    // Check for duplicate name (case-insensitive)
    const existingName = await prisma.editorialBoardMember.findFirst({
      where: { 
        name: {
          equals: validatedData.name,
          mode: 'insensitive'
        },
        archived: false
      }
    })

    if (existingName) {
      return { 
        success: false, 
        error: "A board member with this name already exists" 
      }
    }

    // Get the highest order number and add 1
    const highestOrder = await prisma.editorialBoardMember.findFirst({
      where: {
        memberType: validatedData.memberType,
        archived: false
      },
      orderBy: {
        order: "desc",
      },
      select: {
        order: true,
      },
    })

    const order = validatedData.order || (highestOrder ? highestOrder.order + 1 : 1)

    const member = await prisma.editorialBoardMember.create({
      data: {
        name: validatedData.name,
        designation: validatedData.designation,
        memberType: validatedData.memberType,
        image: validatedData.image,
        order,
        bio: validatedData.bio,
        email: validatedData.email,
        expertise: validatedData.expertise || [],
        linkedin: validatedData.linkedin,
        orcid: validatedData.orcid,
      },
    })
    
    console.log(`✅ User ${currentUser.email} created editorial board member: ${member.name}`)
    
    revalidatePath("/admin/editorial-board")
    revalidatePath("/editorial-board")
    
    return { success: true, data: member }
  } catch (error) {
    console.error("Failed to create editorial board member:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(", ") }
    }
    return { success: false, error: "Failed to create editorial board member" }
  }
}

export async function updateBoardMember(id: string, data: Partial<z.infer<typeof memberSchema>>) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Get the existing board member to check ownership if needed
    const existingMember = await prisma.editorialBoardMember.findUnique({
      where: { id }
    })

    if (!existingMember) {
      return { success: false, error: "Board member not found" }
    }

    // Check if user has permission to update editorial board members
    const permissionCheck = checkPermission(currentUser, 'editorialboard.UPDATE', {
      resourceId: existingMember.id
    })

    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to update this board member" 
      }
    }

    // Validate partial data
    const validatedData = memberSchema.partial().parse(data)

    // Check for duplicate email if email is being updated
    if (validatedData.email && validatedData.email !== existingMember.email) {
      const duplicateEmail = await prisma.editorialBoardMember.findFirst({
        where: { 
          email: validatedData.email,
          archived: false,
          NOT: { id }
        }
      })

      if (duplicateEmail) {
        return { 
          success: false, 
          error: "A board member with this email already exists" 
        }
      }
    }

    // Check for duplicate name if name is being updated
    if (validatedData.name && validatedData.name !== existingMember.name) {
      const duplicateName = await prisma.editorialBoardMember.findFirst({
        where: { 
          name: {
            equals: validatedData.name,
            mode: 'insensitive'
          },
          archived: false,
          NOT: { id }
        }
      })

      if (duplicateName) {
        return { 
          success: false, 
          error: "A board member with this name already exists" 
        }
      }
    }

    const member = await prisma.editorialBoardMember.update({
      where: { id },
      data: validatedData,
    })
    
    console.log(`✅ User ${currentUser.email} updated editorial board member: ${member.name}`)
    
    revalidatePath("/admin/editorial-board")
    revalidatePath("/editorial-board")
    
    return { success: true, data: member }
  } catch (error) {
    console.error(`Failed to update editorial board member ${id}:`, error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(", ") }
    }
    return { success: false, error: "Failed to update editorial board member" }
  }
}

export async function deleteBoardMember(id: string) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Get the existing board member
    const existingMember = await prisma.editorialBoardMember.findUnique({
      where: { id }
    })

    if (!existingMember) {
      return { success: false, error: "Board member not found" }
    }

    // Check if user has permission to delete editorial board members
    const permissionCheck = checkPermission(currentUser, 'editorialboard.DELETE', {
      resourceId: existingMember.id
    })

    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to delete this board member" 
      }
    }

    // Instead of deleting, we archive the member to preserve data integrity
    await prisma.editorialBoardMember.update({
      where: { id },
      data: { archived: true }
    })
    
    console.log(`✅ User ${currentUser.email} archived editorial board member: ${existingMember.name}`)
    
    revalidatePath("/admin/editorial-board")
    revalidatePath("/editorial-board")
    
    return { success: true }
  } catch (error) {
    console.error(`Failed to delete editorial board member ${id}:`, error)
    return { success: false, error: "Failed to delete editorial board member" }
  }
}

export async function reorderBoardMembers(orderedIds: string[]) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to update editorial board members (reordering is an update operation)
    const permissionCheck = checkPermission(currentUser, 'editorialboard.UPDATE')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: permissionCheck.reason || "You don't have permission to reorder board members" 
      }
    }

    // Validate that all provided IDs exist and are not archived
    if (orderedIds.length > 0) {
      const existingMembers = await prisma.editorialBoardMember.findMany({
        where: { 
          id: { in: orderedIds },
          archived: false
        },
        select: { id: true }
      })

      if (existingMembers.length !== orderedIds.length) {
        return { 
          success: false, 
          error: "Some board members not found or are archived" 
        }
      }
    }

    // Update the order of each member based on their position in the array
    const updates = orderedIds.map((id, index) => {
      return prisma.editorialBoardMember.update({
        where: { id },
        data: { order: index + 1 },
      })
    })

    await Promise.all(updates)
    
    console.log(`✅ User ${currentUser.email} reordered ${orderedIds.length} editorial board members`)
    
    revalidatePath("/admin/editorial-board")
    revalidatePath("/editorial-board")
    
    return { success: true }
  } catch (error) {
    console.error("Failed to reorder editorial board members:", error)
    return { success: false, error: "Failed to reorder editorial board members" }
  }
}

// NEW: Function to get editorial board members with permission context
export async function getEditorialBoardWithPermissions() {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to read editorial board members
    const permissionCheck = checkPermission(currentUser, 'editorialboard.READ')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: "You don't have permission to view editorial board members" 
      }
    }

    const members = await prisma.editorialBoardMember.findMany({
      where: {
        archived: false
      },
      orderBy: {
        order: "asc",
      },
    })
    
    // Add permission context to each member
    const membersWithPermissions = members.map(member => ({
      ...member,
      canEdit: checkPermission(currentUser, 'editorialboard.UPDATE', {
        resourceId: member.id
      }).allowed,
      canDelete: checkPermission(currentUser, 'editorialboard.DELETE', {
        resourceId: member.id
      }).allowed,
    }))

    return { 
      success: true, 
      data: membersWithPermissions,
      canCreate: checkPermission(currentUser, 'editorialboard.CREATE').allowed,
      canReorder: checkPermission(currentUser, 'editorialboard.UPDATE').allowed
    }
  } catch (error) {
    console.error("Failed to fetch editorial board with permissions:", error)
    return { success: false, error: "Failed to fetch editorial board members" }
  }
}

// NEW: Function to check editorial board permissions
export async function checkEditorialBoardPermissions(memberId?: string) {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { 
        success: false, 
        error: "Authentication required",
        permissions: { canRead: false, canCreate: false, canUpdate: false, canDelete: false, canReorder: false }
      }
    }

    let permissions = {
      canRead: checkPermission(currentUser, 'editorialboard.READ').allowed,
      canCreate: checkPermission(currentUser, 'editorialboard.CREATE').allowed,
      canUpdate: false,
      canDelete: false,
      canReorder: checkPermission(currentUser, 'editorialboard.UPDATE').allowed,
    }

    // If specific member ID is provided, check update/delete permissions
    if (memberId) {
      const member = await prisma.editorialBoardMember.findUnique({
        where: { id: memberId }
      })

      if (member) {
        permissions.canUpdate = checkPermission(currentUser, 'editorialboard.UPDATE', {
          resourceId: member.id
        }).allowed

        permissions.canDelete = checkPermission(currentUser, 'editorialboard.DELETE', {
          resourceId: member.id
        }).allowed
      }
    }

    return { success: true, permissions }
  } catch (error) {
    console.error("Failed to check editorial board permissions:", error)
    return { 
      success: false, 
      error: "Failed to check permissions",
      permissions: { canRead: false, canCreate: false, canUpdate: false, canDelete: false, canReorder: false }
    }
  }
}

// NEW: Function to get board member types that user can create
export async function getAvailableBoardMemberTypes() {
  try {
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has permission to create editorial board members
    const permissionCheck = checkPermission(currentUser, 'editorialboard.CREATE')
    if (!permissionCheck.allowed) {
      return { 
        success: false, 
        error: "You don't have permission to create board members" 
      }
    }

    // Return all available board member types
    const memberTypes = Object.values(BoardMemberType).map(type => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }))

    return { success: true, data: memberTypes }
  } catch (error) {
    console.error("Failed to get available board member types:", error)
    return { success: false, error: "Failed to get available member types" }
  }
}