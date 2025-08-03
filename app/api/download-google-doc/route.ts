// app/api/download-google-doc/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { downloadGoogleDocAsPDF } from '@/lib/controllers/articles'

export async function POST(request: NextRequest) {
  try {
    const { contentLink, filename } = await request.json()
    
    if (!contentLink) {
      return NextResponse.json(
        { error: 'Content link is required' }, 
        { status: 400 }
      )
    }

    console.log(`📥 API: Downloading Google Doc PDF from: ${contentLink}`)

    // Use the controller function to download the PDF
    const result = await downloadGoogleDocAsPDF(contentLink, filename)
    
    if (!result.success) {
      console.error(`❌ API: Download failed: ${result.error}`)
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      )
    }

    if (!result.buffer) {
      return NextResponse.json(
        { error: 'No PDF data received' }, 
        { status: 500 }
      )
    }

    console.log(`✅ API: Successfully downloaded PDF: ${result.filename} (${result.buffer.length} bytes)`)

    // Return the PDF as a downloadable file
    return new NextResponse(result.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Length': result.buffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('💥 API: Error in download route:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to download PDF' 
      }, 
      { status: 500 }
    )
  }
}