import { DecorativeHeading } from "@/components/decorative-heading"
import type { Metadata } from "next"
import { constructMetadata } from "@/lib/metadata"

export const metadata: Metadata = constructMetadata({
  title: "Terms of Service - Open Journal of Law & Policy",
  description: "Terms and conditions governing the use of the Open Journal of Law & Policy website and services.",
  pathname: "/terms-of-service",
})

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16 max-w-4xl">
      <div className="animate-fade-in">
        <DecorativeHeading level={1} className="text-3xl md:text-4xl mb-8">
          Terms and Conditions
        </DecorativeHeading>
        <div className="prose dark:prose-invert max-w-none">
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            These terms and conditions govern your use of this website. By using the Website, you accept these terms in
            full. If you disagree with any part of these terms and conditions, please do not use this Website.
          </p>
          <p>
            OJLP reserves the right to revise these terms at any time. Any changes will be posted here and will be
            effective upon publication. Continued use of the Website after such changes constitutes your acceptance.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. License to Use Website</h2>
          <p>
            Unless otherwise stated, OJLP and/or its licensors own the intellectual property rights to the Website and
            its published content. Subject to the license below, all rights are reserved.
          </p>
          <p>You may:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>View, download, and print content for personal, non-commercial use.</li>
            <li>
              Reproduce and redistribute journal content that is made available under the Creative Commons Attribution
              4.0 International License (CC BY 4.0), provided that full credit is given to the original authors and
              OJLP, along with a link to the source.
            </li>
          </ul>
          <p>You must not:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Claim authorship or misattribute the work.</li>
            <li>Sell, rent, or sublicense any material.</li>
            <li>Republish any journal content without appropriate citation and attribution.</li>
            <li>Modify, edit, or adapt content in a misleading or unlawful manner.</li>
            <li>Use the Website in a way that infringes OJLP's intellectual property rights.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Use the Website for any fraudulent, illegal, or harmful activity.</li>
            <li>Interfere with or disrupt the availability or security of the Website.</li>
            <li>Transmit malicious code, viruses, or malware.</li>
            <li>Use automated data collection tools (e.g., scraping, bots) without prior written consent.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. User Content</h2>
          <p>
            "User Content" refers to any material submitted to the Website, including blog posts, manuscripts, comments,
            or media.
          </p>
          <p>
            By submitting User Content, you grant OJLP a worldwide, non-exclusive, royalty-free, irrevocable license to
            use, reproduce, publish, and distribute that content across all formats and media, subject to the terms of
            publication agreed during submission.
          </p>
          <p>You represent that:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>The content is your original work.</li>
            <li>It does not violate any law or third-party rights.</li>
            <li>It has not been previously published unless disclosed.</li>
          </ul>
          <p>
            OJLP reserves the right to remove or edit any submitted content that breaches these terms or is otherwise
            inappropriate.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. No Warranties</h2>
          <p>
            This Website and all content are provided "as is" without any warranties, express or implied. OJLP does not
            guarantee:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Continuous or error-free access to the Website.</li>
            <li>Accuracy, completeness, or reliability of content.</li>
          </ul>
          <p>
            The material on this Website is intended for academic and informational purposes and should not be construed
            as legal advice.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
          <p>
            OJLP is not liable for any direct, indirect, or consequential damages arising from your use of the Website,
            including:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Data loss or corruption</li>
            <li>Technical failures</li>
            <li>Reliance on published content</li>
          </ul>
          <p>You agree that these limitations are reasonable given the open-access nature of the Website.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Indemnity</h2>
          <p>
            You agree to indemnify and hold harmless OJLP, its editors, contributors, affiliates, and service providers
            from any claims, damages, losses, or expenses (including legal fees) arising from your use of the Website,
            User Content submissions, or breach of these terms.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. External Links</h2>
          <p>
            OJLP may link to third-party websites for reference or citation. We do not control or endorse the content of
            external sites and disclaim responsibility for their availability or accuracy.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Governing Law & Jurisdiction</h2>
          <p>
            These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction
            of the courts located in [Insert City, India — e.g., New Delhi or Raipur].
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Refund & Cancellation Policy</h2>
          <p className="font-semibold">No Refunds for Withdrawn Submissions:</p>
          <p>
            OJLP does not provide refunds if an author withdraws a submitted manuscript after consideration has begun or
            chooses not to revise and resubmit following peer review.
          </p>
          <p className="font-semibold mt-4">General Policy:</p>
          <p>
            Refunds or cancellations are not issued under normal circumstances. Exceptions may be made in rare,
            unavoidable situations at the discretion of the editorial board.
          </p>
          <p className="font-semibold mt-4">Duplicate Payments:</p>
          <p>
            In the event of accidental duplicate payment for the same paper or service, the excess amount will be
            refunded upon verification. Authors must notify us at editor@ojlp.in within 14 days of the transaction.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact Information</h2>
          <p>For any questions regarding these Terms and Conditions, please contact:</p>
          <p>
            Email:{" "}
            <a href="mailto:editor@ojlp.in" className="text-blue-600 hover:underline">
              editor@ojlp.in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
