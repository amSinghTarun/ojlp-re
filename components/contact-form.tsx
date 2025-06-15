"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export function ContactForm() {
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    inquiryType: "",
    message: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, inquiryType: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState("submitting")

    // Simulate form submission
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setFormState("success")
      // Reset form after success
      setFormData({
        name: "",
        email: "",
        inquiryType: "",
        message: "",
      })
    } catch (error) {
      setFormState("error")
    }
  }

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm border">
      <h2 className="text-xl font-serif font-semibold mb-4">Send a Message</h2>

      {formState === "success" && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md flex items-start">
          <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>Thank you for your message! We'll get back to you as soon as possible.</p>
        </div>
      )}

      {formState === "error" && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>There was an error sending your message. Please try again later.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Your name" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your.email@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="inquiryType">Inquiry Type</Label>
          <Select value={formData.inquiryType} onValueChange={handleSelectChange}>
            <SelectTrigger id="inquiryType">
              <SelectValue placeholder="Select inquiry type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="submission">Submission Query</SelectItem>
              <SelectItem value="review">Review Opportunity</SelectItem>
              <SelectItem value="media">Media Inquiry</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Your message"
            rows={5}
            required
          />
        </div>

        <div className="text-sm text-muted-foreground">Messages will be sent to journal@ojlp.in</div>

        <Button type="submit" className="w-full bg-[#7f2937] hover:bg-[#6a232e]" disabled={formState === "submitting"}>
          {formState === "submitting" ? "Sending..." : "Send Message"}
        </Button>
      </form>
    </div>
  )
}
