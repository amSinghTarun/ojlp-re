import type { Metadata } from "next"
import { DecorativeHeading } from "@/components/decorative-heading"

export const metadata: Metadata = {
  title: "About Us | Open Journal of Law & Policy",
  description: "Learn about the Open Journal of Law & Policy, our mission, and our team.",
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16 max-w-4xl">
      <div className="animate-fade-in">
        <DecorativeHeading level={1} className="text-3xl md:text-4xl mb-8">
          About Us
        </DecorativeHeading>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-lg text-muted-foreground mb-8">
            Learn about the Open Journal of Law & Policy, our mission, and our team.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Mission & Scope</h2>
          <p>
            The <em>Open Journal of Law & Policy (OJLP)</em> is a peer-reviewed, open-access academic journal committed to fostering rigorous scholarship in law, governance, and public policy. Our mission is to create a platform that bridges doctrinal legal analysis with interdisciplinary inquiry, promoting conversations across legal theory, political science, economics, sociology, technology studies, and beyond.
          </p>
          <p>
            OJLP welcomes contributions that interrogate foundational legal principles, engage with pressing policy dilemmas, and offer novel frameworks for understanding the evolving role of law in contemporary societies. We are especially interested in research that adopts critical, comparative, or empirically grounded approaches. The journal is global in outlook, yet acutely sensitive to regional contexts, with a particular interest in legal developments in the Global South.
          </p>
          <p>
            By providing unrestricted access to all published work, OJLP aims to democratize legal knowledge and make scholarly discourse accessible to practitioners, students, and policy makers alike.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Editorial Philosophy</h2>
          <p>
            OJLP is guided by a strong commitment to editorial integrity, academic excellence, and intellectual diversity. Our editorial process is grounded in the following principles:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Rigorous Peer Review:</strong> All scholarly articles undergo a double-blind peer review by qualified experts to ensure quality, originality, and scholarly merit. We value constructive feedback and transparency throughout the review process.
            </li>
            <li>
              <strong>Inclusive Scholarship:</strong> We actively encourage submissions from early-career academics, independent researchers, and scholars from underrepresented backgrounds. OJLP strives to be a platform for both established voices and emerging perspectives.
            </li>
            <li>
              <strong>Interdisciplinary Dialogue:</strong> Recognizing that contemporary legal questions are rarely confined to doctrinal boundaries, we welcome interdisciplinary methods and approaches.
            </li>
            <li>
              <strong>Timeliness and Relevance:</strong> We prioritize articles and commentaries that respond to contemporary legal developments, emerging policy challenges, and transformative socio-legal trends.
            </li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Ethical Policy & Anti-Plagiarism Measures</h2>
          <p>
            OJLP upholds the highest standards of academic ethics and publication integrity. Our editorial board adheres to the <strong>Committee on Publication Ethics (COPE)</strong> guidelines and expects the same from contributors.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Key Ethical Policies:</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>
              <strong>Originality:</strong> Submissions must be the author's original work and must not be under consideration elsewhere. By submitting, authors affirm that the content is free from plagiarism or substantial overlap with previously published work.
            </li>
            <li>
              <strong>Plagiarism Detection:</strong> All submissions are screened using anti-plagiarism software. Manuscripts exhibiting substantial similarity with existing works will be summarily rejected and may result in blacklisting of the author.
            </li>
            <li>
              <strong>Author Responsibility:</strong> Authors must properly attribute all sources, data, and ideas that are not their own. Fabrication or falsification of data constitutes grounds for immediate rejection.
            </li>
            <li>
              <strong>Conflicts of Interest:</strong> Authors, reviewers, and editors are required to disclose any potential conflicts of interest. Editorial decisions are made independently and free of external influence.
            </li>
            <li>
              <strong>Corrections & Retractions:</strong> If an article is found to have serious errors post-publication, OJLP will issue a correction or retraction notice to preserve the integrity of the academic record.
            </li>
          </ul>
          
          <p>
            OJLP is committed to building a transparent and trustworthy scholarly community. We welcome suggestions and feedback from our readers and contributors to continuously uphold and enhance these standards.
          </p>
        </div>
      </div>
    </div>
  )
}