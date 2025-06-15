import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us | Open Journal of Law & Policy",
  description: "Learn about the Open Journal of Law & Policy, our mission, and our team.",
}

export default function AboutPage() {
  return (
    <div>
      <h1>About Us</h1>
      <p>Learn about the Open Journal of Law & Policy, our mission, and our team.</p>
    </div>
  )
}
