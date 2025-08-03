import type { Metadata } from "next"
import { DecorativeHeading } from "@/components/decorative-heading"

export const metadata: Metadata = {
  title: "About Us | Open Journal of Law & Policy",
  description: "Learn about the Open Journal of Law & Policy, our mission, and our team.",
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="px-4 py-8 mb-20 md:px-6">
          <div className="max-w-5xl mx-auto text-center">
            
            <div className="space-y-8 text-left mt-4">
              <div className="space-y-6">
                <div>
                  <h2 className=" text-3xl sm:text-5xl font-bold text-stone-800 text-center">Mission & Scope</h2>
                  <div className="text-base text-stone-700 space-y-4 pl-2 mt-6">
                    <p>
                      The <em>Open Journal of Law & Policy (OJLP)</em> is a peer-reviewed, open-access academic journal committed to fostering rigorous scholarship in law, governance, and public policy. Our mission is to create a platform that bridges doctrinal legal analysis with interdisciplinary inquiry, promoting conversations across legal theory, political science, economics, sociology, technology studies, and beyond.
                    </p>
                    <p>
                      OJLP welcomes contributions that interrogate foundational legal principles, engage with pressing policy dilemmas, and offer novel frameworks for understanding the evolving role of law in contemporary societies. We are especially interested in research that adopts critical, comparative, or empirically grounded approaches. The journal is global in outlook, yet acutely sensitive to regional contexts, with a particular interest in legal developments in the Global South.
                    </p>
                    <p>
                      By providing unrestricted access to all published work, OJLP aims to democratize legal knowledge and make scholarly discourse accessible to practitioners, students, and policy makers alike.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="sm:text-3xl text-2xl font-semibold text-stone-800">Editorial Philosophy</h3>
                  <p className="text-base text-stone-700 pl-2">
                    OJLP is guided by a strong commitment to editorial integrity, academic excellence, and intellectual diversity. Our editorial process is grounded in the following principles:
                  </p>
                  <ul className="text-base text-stone-700 space-y-2 pl-2">
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
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-4xl font-semibold text-stone-800 text-center">Ethical Policy & Anti-Plagiarism Measures</h2>
                  <div className="text-base text-stone-700 pl-2 mt-4">
                    OJLP upholds the highest standards of academic ethics and publication integrity. Our editorial board adheres to the <strong>Committee on Publication Ethics (COPE)</strong> guidelines and expects the same from contributors.
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-3xl font-semibold text-stone-700">Key Ethical Policies:</h3>
                  <ul className="text-base text-stone-700 space-y-2 pl-2">
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
                  <p className="text-base text-stone-700 mt-4 pl-2">
                    OJLP is committed to building a transparent and trustworthy scholarly community. We welcome suggestions and feedback from our readers and contributors to continuously uphold and enhance these standards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}