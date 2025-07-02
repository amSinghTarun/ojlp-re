"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { NotificationType, Priority } from "@prisma/client"
import { format } from "date-fns"

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

// Updated schema based on actual Prisma model
const callForPapersSchema = z.object({
  id: z.string().optional(),
  title: z.string()
    .min(1, "Title is required")
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  thematicFocus: z.string()
    .min(1, "Thematic focus is required")
    .min(3, "Thematic focus must be at least 3 characters")
    .max(100, "Thematic focus must be less than 100 characters"),
  description: z.string()
    .min(1, "Description is required")
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be less than 2000 characters"),
  deadline: z.date({ 
    required_error: "Deadline is required",
    invalid_type_error: "Please select a valid date"
  }),
  volume: z.coerce.number()
    .min(1, "Volume must be at least 1")
    .max(999, "Volume must be less than 999")
    .int("Volume must be a whole number"),
  issue: z.coerce.number()
    .min(1, "Issue must be at least 1")
    .max(99, "Issue must be less than 99")
    .int("Issue must be a whole number"),
  year: z.coerce.number()
    .min(1900, "Year must be 1900 or later")
    .max(2100, "Year must be 2100 or earlier")
    .int("Year must be a whole number"),
  fee: z.string().optional().nullable(),
  topics: z.array(z.string()).default([]),
  contentLink: z.string().optional().nullable(),
  publisher: z.string()
    .min(1, "Publisher is required")
    .min(2, "Publisher must be at least 2 characters")
    .max(100, "Publisher must be less than 100 characters"),
})

export type CallForPapersFormData = z.infer<typeof callForPapersSchema>

// Enhanced error handling helper
function createErrorResponse(message: string, details?: any) {
  const timestamp = new Date().toISOString()
  console.error(`❌ [${timestamp}] Call for Papers Error:`, message, details)
  return { error: message, details, timestamp }
}

function createSuccessResponse(call: any, notification?: any) {
  const timestamp = new Date().toISOString()
  console.log(`✅ [${timestamp}] Call for Papers Success:`, call.title)
  return { success: true, call, notification, timestamp }
}

export async function getCallsForPapers() {
  try {
    console.log("📋 Fetching calls for papers...")
    
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return createErrorResponse("Authentication required")
    }

    // Check if user has permission to read call for papers
    const permissionCheck = checkPermission(currentUser, 'callforpapers.READ')
    if (!permissionCheck.allowed) {
      return createErrorResponse(
        permissionCheck.reason || "You don't have permission to view calls for papers"
      )
    }
    
    const calls = await prisma.callForPapers.findMany({
      orderBy: [
        { deadline: "asc" },
        { createdAt: "desc" }
      ],
    })

    console.log(`✅ User ${currentUser.email} fetched ${calls.length} calls for papers`)
    return { calls }
  } catch (error: any) {
    console.error("❌ Failed to fetch calls for papers:", error)
    
    if (error.code === 'P1001') {
      return createErrorResponse("Database connection failed. Please check your internet connection and try again.")
    }
    
    if (error.code?.startsWith('P')) {
      return createErrorResponse("Database error occurred. Please try again or contact support if the problem persists.")
    }
    
    return createErrorResponse("Failed to fetch calls for papers. Please try again.", error.message)
  }
}

export async function getCallForPapers(id: string) {
  try {
    console.log(`📋 Fetching call for papers: ${id}`)
    
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return createErrorResponse("Authentication required")
    }

    // Check if user has permission to read call for papers
    const permissionCheck = checkPermission(currentUser, 'callforpapers.READ')
    if (!permissionCheck.allowed) {
      return createErrorResponse(
        permissionCheck.reason || "You don't have permission to view call for papers details"
      )
    }
    
    if (!id || typeof id !== 'string') {
      return createErrorResponse("Invalid call for papers ID provided.")
    }
    
    const call = await prisma.callForPapers.findUnique({
      where: { id },
    })

    if (!call) {
      return createErrorResponse("Call for papers not found. It may have been deleted or the ID is incorrect.")
    }

    console.log(`✅ User ${currentUser.email} fetched call for papers: ${call.title}`)
    return { call }
  } catch (error: any) {
    console.error("❌ Failed to fetch call for papers:", error)
    return createErrorResponse("Failed to fetch call for papers details. Please try again.", error.message)
  }
}

export async function createCallForPapers(data: CallForPapersFormData) {
  try {
    console.log("📝 Creating call for papers...")
    console.log("📋 Input data:", data)
    
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return createErrorResponse("Authentication required")
    }

    // Check if user has permission to create call for papers
    const permissionCheck = checkPermission(currentUser, 'callforpapers.CREATE')
    if (!permissionCheck.allowed) {
      return createErrorResponse(
        permissionCheck.reason || "You don't have permission to create calls for papers"
      )
    }
    
    // Enhanced validation with detailed error messages
    const validation = callForPapersSchema.safeParse(data)
    if (!validation.success) {
      const errors = validation.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('; ')
      
      console.error("❌ Validation failed:", validation.error.errors)
      return createErrorResponse(`Validation failed: ${errors}`, validation.error.errors)
    }

    const validatedData = validation.data
    console.log("✅ Data validation passed")

    // Check for future deadline
    if (validatedData.deadline <= new Date()) {
      return createErrorResponse("Deadline must be in the future. Please select a date after today.")
    }

    // Check for duplicate volume/issue/year combination with detailed message
    console.log("🔍 Checking for duplicate volume/issue/year...")
    const existing = await prisma.callForPapers.findFirst({
      where: {
        volume: validatedData.volume,
        issue: validatedData.issue,
        year: validatedData.year,
      },
    })

    if (existing) {
      const message = `A call for papers already exists for Volume ${validatedData.volume}, Issue ${validatedData.issue} (${validatedData.year}). Please use different values or edit the existing call.`
      return createErrorResponse(message)
    }

    console.log("✅ No duplicate found, proceeding with creation...")

    // Use a transaction to create both call for papers and notification
    const result = await prisma.$transaction(async (tx) => {
      console.log("🔄 Starting database transaction...")
      
      // Create the call for papers with properly mapped fields
      const call = await tx.callForPapers.create({
        data: {
          title: validatedData.title,
          thematicFocus: validatedData.thematicFocus,
          description: validatedData.description,
          deadline: validatedData.deadline,
          volume: validatedData.volume,
          issue: validatedData.issue,
          year: validatedData.year,
          fee: validatedData.fee || null,
          topics: validatedData.topics,
          contentLink: validatedData.contentLink || null,
          publisher: validatedData.publisher,
        },
      })

      console.log(`✅ Call for papers created with ID: ${call.id}`)

      // Create notification with the created call for papers data
      const notificationContent = `${call.description}

📅 Submission Deadline: ${format(call.deadline, "MMMM d, yyyy")}
📖 Volume ${call.volume}, Issue ${call.issue} (${call.year})
📰 Publisher: ${call.publisher}
${call.topics && call.topics.length > 0 
  ? `🏷️ Topics: ${call.topics.slice(0, 3).join(", ")}${call.topics.length > 3 ? " and more" : ""}`
  : ""
}
${call.fee ? `💰 Submission fee: ${call.fee}` : "🆓 No submission fee required"}
${call.contentLink ? `🔗 More details: ${call.contentLink}` : ""}

Don't miss this opportunity to contribute to our journal!`

      const notification = await tx.notification.create({
        data: {
          title: call.title,
          content: notificationContent,
          type: NotificationType.call_for_papers,
          priority: Priority.high,
          linkDisplay: "View Call for Papers",
          linkUrl: call.contentLink || `/call-for-papers/${call.id}`,
          expiresAt: call.deadline,
        },
      })

      console.log(`✅ Notification created with ID: ${notification.id}`)

      return { call, notification }
    }, {
      timeout: 10000, // 10 second timeout
    })

    // Revalidate relevant paths
    console.log("🔄 Revalidating pages...")
    revalidatePath("/admin/call-for-papers")
    revalidatePath("/admin/notifications")
    revalidatePath("/call-for-papers")
    revalidatePath("/notifications")

    console.log(`🎉 User ${currentUser.email} created call for papers "${result.call.title}" with auto-generated notification`)

    return createSuccessResponse(result.call, result.notification)
  } catch (error: any) {
    console.error("❌ Failed to create call for papers:", error)
    
    // Handle specific database errors
    if (error.code === 'P2002') {
      return createErrorResponse("A record with these details already exists. Please check for duplicates.")
    }
    
    if (error.code === 'P2025') {
      return createErrorResponse("Referenced record not found. Please refresh the page and try again.")
    }
    
    if (error.code === 'P1001') {
      return createErrorResponse("Database connection failed. Please check your internet connection and try again.")
    }
    
    if (error.code?.startsWith('P')) {
      return createErrorResponse("Database error occurred. Please try again or contact support if the problem persists.", error.code)
    }
    
    if (error.message?.includes('timeout')) {
      return createErrorResponse("Operation timed out. The server is taking too long to respond. Please try again.")
    }
    
    return createErrorResponse("Failed to create call for papers. Please try again.", error.message)
  }
}

export async function updateCallForPapers(id: string, data: CallForPapersFormData) {
  try {
    console.log(`📝 Updating call for papers: ${id}`)
    console.log("📋 Input data:", data)
    
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return createErrorResponse("Authentication required")
    }

    if (!id || typeof id !== 'string') {
      return createErrorResponse("Invalid call for papers ID provided.")
    }

    // Get the existing call for papers to check ownership if needed
    const existingCall = await prisma.callForPapers.findUnique({
      where: { id },
    })

    if (!existingCall) {
      return createErrorResponse("Call for papers not found. It may have been deleted or the ID is incorrect.")
    }

    // Check if user has permission to update call for papers
    const permissionCheck = checkPermission(currentUser, 'callforpapers.UPDATE', {
      resourceId: existingCall.id
    })

    if (!permissionCheck.allowed) {
      return createErrorResponse(
        permissionCheck.reason || "You don't have permission to update this call for papers"
      )
    }
    
    // Enhanced validation
    const validation = callForPapersSchema.safeParse(data)
    if (!validation.success) {
      const errors = validation.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('; ')
      
      console.error("❌ Validation failed:", validation.error.errors)
      return createErrorResponse(`Validation failed: ${errors}`, validation.error.errors)
    }

    const validatedData = validation.data
    console.log("✅ Data validation passed")

    console.log(`✅ Found existing call for papers: ${existingCall.title}`)

    // Check for future deadline
    if (validatedData.deadline <= new Date()) {
      return createErrorResponse("Deadline must be in the future. Please select a date after today.")
    }

    // Check for duplicate volume/issue/year combination (excluding current record)
    const duplicate = await prisma.callForPapers.findFirst({
      where: {
        volume: validatedData.volume,
        issue: validatedData.issue,
        year: validatedData.year,
        NOT: { id },
      },
    })

    if (duplicate) {
      const message = `Another call for papers already exists for Volume ${validatedData.volume}, Issue ${validatedData.issue} (${validatedData.year}). Please use different values.`
      return createErrorResponse(message)
    }

    const call = await prisma.callForPapers.update({
      where: { id },
      data: {
        title: validatedData.title,
        thematicFocus: validatedData.thematicFocus,
        description: validatedData.description,
        deadline: validatedData.deadline,
        volume: validatedData.volume,
        issue: validatedData.issue,
        year: validatedData.year,
        fee: validatedData.fee || null,
        topics: validatedData.topics,
        contentLink: validatedData.contentLink || null,
        publisher: validatedData.publisher,
      },
    })

    console.log(`✅ User ${currentUser.email} updated call for papers: ${call.title}`)

    // Update associated notification if it exists
    try {
      const associatedNotification = await prisma.notification.findFirst({
        where: {
          type: NotificationType.call_for_papers,
          linkUrl: {
            contains: id
          },
        },
      })

      if (associatedNotification) {
        const notificationContent = `${call.description}

📅 Submission Deadline: ${format(call.deadline, "MMMM d, yyyy")}
📖 Volume ${call.volume}, Issue ${call.issue} (${call.year})
📰 Publisher: ${call.publisher}
${call.topics && call.topics.length > 0 
  ? `🏷️ Topics: ${call.topics.slice(0, 3).join(", ")}${call.topics.length > 3 ? " and more" : ""}`
  : ""
}
${call.fee ? `💰 Submission fee: ${call.fee}` : "🆓 No submission fee required"}
${call.contentLink ? `🔗 More details: ${call.contentLink}` : ""}

Don't miss this opportunity to contribute to our journal!`

        await prisma.notification.update({
          where: { id: associatedNotification.id },
          data: {
            title: call.title,
            content: notificationContent,
            linkUrl: call.contentLink || `/call-for-papers/${call.id}`,
            expiresAt: call.deadline,
          },
        })
        console.log("✅ Updated associated notification")
      } else {
        console.log("ℹ️ No associated notification found")
      }
    } catch (notificationError) {
      console.error("⚠️ Failed to update associated notification:", notificationError)
      // Continue anyway since the main update succeeded
    }

    revalidatePath("/admin/call-for-papers")
    revalidatePath(`/admin/call-for-papers/${id}/edit`)
    revalidatePath("/admin/notifications")
    revalidatePath("/call-for-papers")
    revalidatePath("/notifications")

    return createSuccessResponse(call)
  } catch (error: any) {
    console.error("❌ Failed to update call for papers:", error)
    
    // Handle specific database errors
    if (error.code === 'P2002') {
      return createErrorResponse("A record with these details already exists. Please check for duplicates.")
    }
    
    if (error.code === 'P2025') {
      return createErrorResponse("Call for papers not found. It may have been deleted. Please refresh the page.")
    }
    
    if (error.code === 'P1001') {
      return createErrorResponse("Database connection failed. Please check your internet connection and try again.")
    }
    
    if (error.code?.startsWith('P')) {
      return createErrorResponse("Database error occurred. Please try again or contact support.", error.code)
    }
    
    return createErrorResponse("Failed to update call for papers. Please try again.", error.message)
  }
}

export async function deleteCallForPapers(id: string) {
  try {
    console.log(`🗑️ Deleting call for papers: ${id}`)
    
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      return createErrorResponse("Authentication required")
    }
    
    if (!id || typeof id !== 'string') {
      return createErrorResponse("Invalid call for papers ID provided.")
    }
    
    // Check if the call for papers exists
    const existingCall = await prisma.callForPapers.findUnique({
      where: { id },
    })

    if (!existingCall) {
      return createErrorResponse("Call for papers not found. It may have already been deleted.")
    }

    // Check if user has permission to delete call for papers
    const permissionCheck = checkPermission(currentUser, 'callforpapers.DELETE')

    if (!permissionCheck.allowed) {
      return createErrorResponse(
        permissionCheck.reason || "You don't have permission to delete this call for papers"
      )
    }

    console.log(`✅ Found call for papers to delete: ${existingCall.title}`)

    // Use transaction to delete both call for papers and associated notification
    await prisma.$transaction(async (tx) => {
      // Delete the call for papers
      await tx.callForPapers.delete({
        where: { id },
      })

      // Delete associated notification if it exists
      await tx.notification.deleteMany({
        where: {
          type: NotificationType.call_for_papers,
          linkUrl: {
            contains: id
          },
        },
      })
    })

    revalidatePath("/admin/call-for-papers")
    revalidatePath("/admin/notifications")
    revalidatePath("/call-for-papers")
    revalidatePath("/notifications")

    console.log(`✅ User ${currentUser.email} deleted call for papers "${existingCall.title}" and associated notification`)

    return { success: true }
  } catch (error: any) {
    console.error("❌ Failed to delete call for papers:", error)
    
    if (error.code === 'P2025') {
      return createErrorResponse("Call for papers not found. It may have already been deleted.")
    }
    
    if (error.code === 'P1001') {
      return createErrorResponse("Database connection failed. Please check your internet connection and try again.")
    }
    
    return createErrorResponse("Failed to delete call for papers. Please try again.", error.message)
  }
}

// Get active calls for papers for public display (no auth required)
export async function getActiveCallsForPapers() {
  try {
    console.log("📋 Fetching active calls for papers (public)...")
    
    const calls = await prisma.callForPapers.findMany({
      where: {
        deadline: {
          gt: new Date(),
        },
      },
      orderBy: {
        deadline: "asc",
      },
    })

    console.log(`✅ Successfully fetched ${calls.length} active calls for papers`)
    return { calls }
  } catch (error: any) {
    console.error("❌ Failed to fetch active calls for papers:", error)
    
    if (error.code === 'P1001') {
      return createErrorResponse("Database connection failed. Please check your internet connection and try again.")
    }
    
    return createErrorResponse("Failed to fetch calls for papers. Please try again later.", error.message)
  }
}

// Simple helper functions for basic CRUD operations (matching your provided template)
export async function getCallsForPapersSimple() {
  return prisma.callForPapers.findMany({
    orderBy: {
      deadline: "asc",
    },
  })
}

export async function getActiveCallsForPapersSimple() {
  const now = new Date()

  return prisma.callForPapers.findMany({
    where: {
      deadline: {
        gt: now,
      },
    },
    orderBy: {
      deadline: "asc",
    },
  })
}

export async function getCallForPapersByIdSimple(id: string) {
  return prisma.callForPapers.findUnique({
    where: { id },
  })
}

export async function createCallForPapersSimple(data: {
  title: string
  thematicFocus: string
  description: string
  deadline: Date | string
  volume: number
  issue: number
  year: number
  fee?: string
  topics?: string[]
  contentLink?: string
  publisher: string
}) {
  return prisma.callForPapers.create({
    data: {
      ...data,
      deadline: typeof data.deadline === 'string' ? new Date(data.deadline) : data.deadline,
      topics: data.topics || [],
    },
  })
}

export async function updateCallForPapersSimple(
  id: string,
  data: {
    title?: string
    thematicFocus?: string
    description?: string
    deadline?: Date | string
    volume?: number
    issue?: number
    year?: number
    fee?: string
    topics?: string[]
    contentLink?: string
    publisher?: string
  },
) {
  return prisma.callForPapers.update({
    where: { id },
    data: {
      ...data,
      deadline: data.deadline ? (typeof data.deadline === 'string' ? new Date(data.deadline) : data.deadline) : undefined,
    },
  })
}

export async function deleteCallForPapersSimple(id: string) {
  return prisma.callForPapers.delete({
    where: { id },
  })
}