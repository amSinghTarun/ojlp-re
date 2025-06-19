"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { NotificationType, Priority } from "@prisma/client"
import { format } from "date-fns"

// Enhanced schema with detailed error messages
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
  guidelines: z.string()
    .min(1, "Guidelines are required")
    .min(50, "Guidelines must be at least 50 characters")
    .max(5000, "Guidelines must be less than 5000 characters"),
  image: z.string().optional(),
  fee: z.string().optional(),
  topics: z.array(z.string()).default([]),
  eligibility: z.string().optional(),
  contact: z.string().optional(),
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

// Helper function to check permissions with detailed error messages
async function checkPermissions() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error("Authentication required. Please log in to continue.")
    }

    const permission = hasPermission(user, PERMISSIONS.MANAGE_CALL_FOR_PAPERS)
    if (!permission) {
      throw new Error("Insufficient permissions. You need 'manage_call_for_papers' permission to perform this action. Please contact an administrator.")
    }

    console.log(`✅ Permission check passed for user: ${user.email}`)
    return user
  } catch (error) {
    console.error("❌ Permission check failed:", error)
    throw error
  }
}

export async function getCallsForPapers() {
  try {
    console.log("📋 Fetching calls for papers...")
    await checkPermissions()
    
    const calls = await prisma.callForPapers.findMany({
      orderBy: [
        { deadline: "asc" },
        { createdAt: "desc" }
      ],
    })

    console.log(`✅ Successfully fetched ${calls.length} calls for papers`)
    return { calls }
  } catch (error: any) {
    console.error("❌ Failed to fetch calls for papers:", error)
    
    if (error.message?.includes('permission') || error.message?.includes('Authentication')) {
      return createErrorResponse(error.message)
    }
    
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
    await checkPermissions()
    
    if (!id || typeof id !== 'string') {
      throw new Error("Invalid call for papers ID provided.")
    }
    
    const call = await prisma.callForPapers.findUnique({
      where: { id },
    })

    if (!call) {
      return createErrorResponse("Call for papers not found. It may have been deleted or the ID is incorrect.")
    }

    console.log(`✅ Successfully fetched call for papers: ${call.title}`)
    return { call }
  } catch (error: any) {
    console.error("❌ Failed to fetch call for papers:", error)
    
    if (error.message?.includes('permission') || error.message?.includes('Authentication')) {
      return createErrorResponse(error.message)
    }
    
    return createErrorResponse("Failed to fetch call for papers details. Please try again.", error.message)
  }
}

export async function createCallForPapers(data: CallForPapersFormData) {
  try {
    console.log("📝 Creating call for papers...")
    console.log("📋 Input data:", data)
    
    const user = await checkPermissions()
    
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
          guidelines: validatedData.guidelines,
          image: validatedData.image || null,
          fee: validatedData.fee || null,
          topics: validatedData.topics,
          eligibility: validatedData.eligibility || null,
          contact: validatedData.contact || null,
        },
      })

      console.log(`✅ Call for papers created with ID: ${call.id}`)

      // Create notification with the created call for papers data
      const notificationContent = `${call.description}

📅 Submission Deadline: ${format(call.deadline, "MMMM d, yyyy")}
📖 Volume ${call.volume}, Issue ${call.issue} (${call.year})
${call.topics && call.topics.length > 0 
  ? `Topics include: ${call.topics.slice(0, 3).join(", ")}${call.topics.length > 3 ? " and more" : ""}.`
  : ""
}
${call.fee ? `Submission fee: ${call.fee}.` : "No submission fee required."}

Don't miss this opportunity to contribute to our journal. Review the submission guidelines and submit your research today!`

      const notification = await tx.notification.create({
        data: {
          title: call.title,
          content: notificationContent,
          type: NotificationType.call_for_papers,
          priority: Priority.high,
          date: new Date(),
          link: `/call-for-papers/${call.id}`,
          image: call.image || null,
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

    console.log(`🎉 Successfully created call for papers "${result.call.title}" with auto-generated notification`)

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
    
    if (error.message?.includes('permission') || error.message?.includes('Authentication')) {
      return createErrorResponse(error.message)
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
    
    const user = await checkPermissions()
    
    if (!id || typeof id !== 'string') {
      return createErrorResponse("Invalid call for papers ID provided.")
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

    // Check if the call for papers exists
    const existing = await prisma.callForPapers.findUnique({
      where: { id },
    })

    if (!existing) {
      return createErrorResponse("Call for papers not found. It may have been deleted or the ID is incorrect.")
    }

    console.log(`✅ Found existing call for papers: ${existing.title}`)

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
        guidelines: validatedData.guidelines,
        image: validatedData.image || null,
        fee: validatedData.fee || null,
        topics: validatedData.topics,
        eligibility: validatedData.eligibility || null,
        contact: validatedData.contact || null,
      },
    })

    console.log(`✅ Call for papers updated: ${call.title}`)

    // Update associated notification if it exists
    try {
      const associatedNotification = await prisma.notification.findFirst({
        where: {
          type: NotificationType.call_for_papers,
          link: `/call-for-papers/${id}`,
        },
      })

      if (associatedNotification) {
        const notificationContent = `${call.description}

📅 Submission Deadline: ${format(call.deadline, "MMMM d, yyyy")}
📖 Volume ${call.volume}, Issue ${call.issue} (${call.year})
${call.topics && call.topics.length > 0 
  ? `Topics include: ${call.topics.slice(0, 3).join(", ")}${call.topics.length > 3 ? " and more" : ""}.`
  : ""
}
${call.fee ? `Submission fee: ${call.fee}.` : "No submission fee required."}

Don't miss this opportunity to contribute to our journal. Review the submission guidelines and submit your research today!`

        await prisma.notification.update({
          where: { id: associatedNotification.id },
          data: {
            title: call.title,
            content: notificationContent,
            image: call.image || null,
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
    
    if (error.message?.includes('permission') || error.message?.includes('Authentication')) {
      return createErrorResponse(error.message)
    }
    
    return createErrorResponse("Failed to update call for papers. Please try again.", error.message)
  }
}

export async function deleteCallForPapers(id: string) {
  try {
    console.log(`🗑️ Deleting call for papers: ${id}`)
    
    const user = await checkPermissions()
    
    if (!id || typeof id !== 'string') {
      return createErrorResponse("Invalid call for papers ID provided.")
    }
    
    // Check if the call for papers exists
    const existing = await prisma.callForPapers.findUnique({
      where: { id },
    })

    if (!existing) {
      return createErrorResponse("Call for papers not found. It may have already been deleted.")
    }

    console.log(`✅ Found call for papers to delete: ${existing.title}`)

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
          link: `/call-for-papers/${id}`,
        },
      })
    })

    revalidatePath("/admin/call-for-papers")
    revalidatePath("/admin/notifications")
    revalidatePath("/call-for-papers")
    revalidatePath("/notifications")

    console.log(`✅ Deleted call for papers "${existing.title}" and associated notification`)

    return { success: true }
  } catch (error: any) {
    console.error("❌ Failed to delete call for papers:", error)
    
    if (error.code === 'P2025') {
      return createErrorResponse("Call for papers not found. It may have already been deleted.")
    }
    
    if (error.code === 'P1001') {
      return createErrorResponse("Database connection failed. Please check your internet connection and try again.")
    }
    
    if (error.message?.includes('permission') || error.message?.includes('Authentication')) {
      return createErrorResponse(error.message)
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