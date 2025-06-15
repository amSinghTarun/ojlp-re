import type { Metadata } from "next"
import { DecorativeHeading } from "@/components/decorative-heading"
import { Mail, Phone, MapPin, Linkedin, Twitter, Facebook, Briefcase } from "lucide-react"
import { ContactForm } from "@/components/contact-form"

export const metadata: Metadata = {
  title: "Contact Us | Open Journal of Law & Policy",
  description:
    "Get in touch with the Open Journal of Law & Policy team for submissions, reviews, media inquiries, or career opportunities.",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <DecorativeHeading level={1}>Contact Us</DecorativeHeading>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            We welcome your inquiries and feedback. Please use the form below or contact us directly.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h2 className="text-xl font-serif font-semibold mb-4">Get in Touch</h2>
              <p className="mb-6 text-muted-foreground">
                We welcome your inquiries and feedback. Please use the form to reach out to us, and we'll respond as
                soon as possible.
              </p>

              <div className="space-y-6 mb-8">
                <div className="bg-card rounded-lg p-4 shadow-sm border">
                  <h3 className="font-medium mb-2">Submission Queries</h3>
                  <p className="text-sm text-muted-foreground">
                    Questions about submitting your paper, formatting requirements, or submission status.
                  </p>
                </div>

                <div className="bg-card rounded-lg p-4 shadow-sm border">
                  <h3 className="font-medium mb-2">Review Opportunities</h3>
                  <p className="text-sm text-muted-foreground">
                    Interested in becoming a reviewer or have questions about the review process.
                  </p>
                </div>

                <div className="bg-card rounded-lg p-4 shadow-sm border">
                  <h3 className="font-medium mb-2">Media Inquiries</h3>
                  <p className="text-sm text-muted-foreground">
                    Press requests, interview opportunities, or content republication permissions.
                  </p>
                </div>

                <div className="bg-card rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center mb-2">
                    <Briefcase className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-medium">Interested in Working with Us?</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    We're a collaborative team of legal scholars, researchers, and writers passionate about advancing
                    legal discourse. We value intellectual curiosity, rigorous analysis, and diverse perspectives.
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium">What We're Looking For:</span> Strong research skills, excellent
                    writing abilities, and a passion for legal scholarship.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">How to Apply:</span> Send your resume to{" "}
                    <a href="mailto:careers@ojlp.in" className="text-primary hover:underline">
                      careers@ojlp.in
                    </a>{" "}
                    with subject "Application: [Your Name] - [Position]"
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Mail className="w-5 h-5 text-primary mr-2 mt-0.5" />
                    <span>
                      <a href="mailto:journal@ojlp.in" className="hover:text-primary transition">
                        journal@ojlp.in
                      </a>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Phone className="w-5 h-5 text-primary mr-2 mt-0.5" />
                    <span>+91 123 456 7890</span>
                  </li>
                  <li className="flex items-start">
                    <MapPin className="w-5 h-5 text-primary mr-2 mt-0.5" />
                    <span>Faculty of Law, University Campus, New Delhi, India</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Follow Us</h3>
                <div className="flex space-x-4">
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-100 hover:bg-primary hover:text-white p-2 rounded-full transition-colors duration-200"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-100 hover:bg-primary hover:text-white p-2 rounded-full transition-colors duration-200"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-100 hover:bg-primary hover:text-white p-2 rounded-full transition-colors duration-200"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>

            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
