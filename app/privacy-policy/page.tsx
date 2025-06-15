import { DecorativeHeading } from "@/components/decorative-heading"
import type { Metadata } from "next"
import { constructMetadata } from "@/lib/metadata"

export const metadata: Metadata = constructMetadata({
  title: "Privacy Policy - Open Journal of Law & Policy",
  description: "Privacy policy outlining how the Open Journal of Law & Policy collects and uses personal information.",
  pathname: "/privacy-policy",
})

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16 max-w-4xl">
      <div className="animate-fade-in">
        <DecorativeHeading level={1} className="text-3xl md:text-4xl mb-8">
          Privacy Policy
        </DecorativeHeading>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg font-medium">
            At OJLP, we are committed to protecting the privacy and personal data of our users, contributors, reviewers,
            and readers. This Privacy Policy outlines how we collect, use, store, and disclose information provided
            through this website.
          </p>
          <p>By accessing and using this Website, you consent to the practices described in this Privacy Policy.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>

          <h3 className="text-xl font-medium mt-6 mb-3">A. Information You Provide Directly</h3>
          <p>We may collect personal data when you:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Submit a manuscript or blog post</li>
            <li>Apply as a peer reviewer or editorial member</li>
            <li>Subscribe to newsletters or announcements</li>
            <li>Fill out contact or submission forms</li>
          </ul>

          <p>This may include:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Name</li>
            <li>Email address</li>
            <li>Institutional affiliation</li>
            <li>Contact details</li>
            <li>Biographical or academic information</li>
            <li>Uploaded manuscripts or documents</li>
          </ul>

          <h3 className="text-xl font-medium mt-6 mb-3">B. Information Collected Automatically</h3>
          <p>When you visit our Website, we may collect:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Referring URL</li>
            <li>Device type</li>
            <li>Date/time of access</li>
            <li>Pages visited and time spent</li>
          </ul>

          <p>
            This data is collected through cookies and analytics tools (e.g., Google Analytics) to improve website
            functionality and user experience.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
          <p>OJLP uses your information for the following purposes:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>To manage submissions and peer review processes</li>
            <li>To communicate editorial decisions, updates, and opportunities</li>
            <li>To maintain reviewer/editorial records</li>
            <li>To respond to queries or feedback</li>
            <li>To analyze Website usage and improve performance</li>
            <li>To ensure legal compliance and prevent misuse</li>
          </ul>

          <p>We do not use your data for unsolicited marketing or share it with third parties for commercial gain.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Disclosure of Information</h2>
          <p>We may disclose your personal information only in the following cases:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>With your explicit consent</li>
            <li>To editorial board members or peer reviewers under strict confidentiality</li>
            <li>
              To third-party service providers (e.g., journal hosting platforms, email servers) who assist in journal
              operations — bound by data protection agreements
            </li>
            <li>To comply with legal obligations or respond to lawful government requests</li>
            <li>To investigate violations of journal policies or security breaches</li>
          </ul>

          <p>We do not sell, rent, or trade your personal information.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Security</h2>
          <p>
            We implement reasonable and appropriate technical, administrative, and physical safeguards to protect your
            data from loss, misuse, or unauthorized access.
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Data is stored on secure servers.</li>
            <li>Access is limited to authorized personnel.</li>
            <li>All communications are encrypted via HTTPS.</li>
            <li>Sensitive data (e.g., peer reviewer identities) is kept confidential.</li>
          </ul>

          <p>
            However, no method of electronic transmission or storage is 100% secure, and OJLP cannot guarantee absolute
            security.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Retention</h2>
          <p>We retain user and submission data for as long as necessary to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Fulfill editorial and legal obligations</li>
            <li>Maintain scholarly records</li>
            <li>Preserve journal archives</li>
          </ul>

          <p>Users may request deletion of their personal data where applicable (see Section 8).</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Cookies Policy</h2>
          <p>This Website uses cookies to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Enable core site functionality</li>
            <li>Improve navigation and accessibility</li>
            <li>Analyze aggregate user behavior</li>
          </ul>

          <p>
            By continuing to use the Website, you consent to our use of cookies. You can control or delete cookies
            through your browser settings.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Children's Privacy</h2>
          <p>
            OJLP does not knowingly collect information from individuals under the age of 18. If you believe a minor has
            submitted personal data to our site, please contact us immediately at{" "}
            <a href="mailto:editor@ojlp.in" className="text-blue-600 hover:text-blue-800">
              editor@ojlp.in
            </a>
            .
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">
            8. Your Rights (Applicable under GDPR and Indian IT Rules)
          </h2>
          <p>You may request the following at any time:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access to your personal data</li>
            <li>Correction or update of inaccurate data</li>
            <li>Deletion of your personal data (subject to legal exceptions)</li>
            <li>Restriction or objection to data processing</li>
            <li>Withdrawal of consent (where applicable)</li>
          </ul>

          <p>
            To exercise these rights, email us at{" "}
            <a href="mailto:editor@ojlp.in" className="text-blue-600 hover:text-blue-800">
              editor@ojlp.in
            </a>
            . We will respond within a reasonable timeframe, typically within 30 days.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Third-Party Links</h2>
          <p>
            OJLP may link to external academic or legal websites. We are not responsible for their content or data
            practices. Users are encouraged to review the privacy policies of any third-party sites they visit.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. International Users</h2>
          <p>
            By accessing this Website from outside India, you agree that your information may be processed and stored in
            India or other jurisdictions as needed for the journal's operations. Appropriate safeguards are taken to
            ensure compliance with cross-border data protection norms.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Changes to This Policy</h2>
          <p>
            OJLP may update this Privacy Policy as needed. Updates will be posted on this page with a revised "Effective
            Date." Your continued use of the Website after changes constitutes acceptance of the updated policy.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Contact Us</h2>
          <p>For questions, concerns, or data requests, please contact:</p>
          <p>
            Email:{" "}
            <a href="mailto:editor@ojlp.in" className="text-blue-600 hover:text-blue-800">
              editor@ojlp.in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
