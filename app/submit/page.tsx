import { CheckCircle, ExternalLink } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function SubmitPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="px-4 py-8 mb-14 md:px-6">
          <div className="max-w-5xl mx-auto text-center mt-4">
          <div className="mb-10 space-y-2">
              <h1 className="text-3xl md:text-5xl text-stone-800 font-semibold">Submit Your Work</h1>
              <p className="text-stone-600 text-base font-normal">
                OJLP welcomes submissions for both peer-reviewed journal articles and editorially reviewed blog posts.
                <br />
                Please review the relevant guidelines below before submitting your work.
              </p>
            </div>
            <div className="space-y-16 text-left">
              <div className="space-y-6">
                <div>
                  <h2 className="text-4xl text-center font-semibold text-stone-800 ">Journal Article Submissions</h2>
                  <div className="text-base text-center text-stone-700 ">
                    We invite original, unpublished research articles that make a substantial contribution to the fields of
                    law, public policy, and interdisciplinary legal studies.
                  </div>
                </div>

                <div className="space-y-2 pl-2">
                  <h3 className="sm:text-3xl text-2xl font-semibold text-stone-800">Submission Requirements</h3>
                  <ul className="text-base text-stone-700 space-y-1 pl-2">
                    <li><strong>Word Limit:</strong> 5,000 to 10,000 words (including footnotes)</li>
                    <li>
                      <strong>Citation Style:</strong> OSCOLA (Oxford Standard for the Citation of Legal Authorities)
                    </li>
                    <li><strong>Format:</strong> Microsoft Word (.doc/.docx)</li>
                    <li><strong>Anonymity:</strong> The main manuscript should not contain any identifying information to facilitate double-blind peer review. A separate title page with a short author introduction should be uploaded.</li>
                  </ul>
                </div>

                <div className="space-y-2 pl-2">
                  <h3 className="text-3xl font-semibold text-stone-800">Peer-Review Process</h3>
                  <div className="text-base text-stone-700 pl-2">
                    All journal submissions undergo a double-blind peer review conducted by at least two subject experts.
                    The process typically takes 4–6 weeks. Authors will receive detailed feedback, and decisions will be
                    communicated as:
                  </div>
                  <ul className="text-sm text-stone-800 font-medium space-y-1 pl-4">
                    <li>Accepted</li>
                    <li>Accepted with Minor Revisions</li>
                    <li>Revise and Resubmit</li>
                    <li>Reject</li>
                  </ul>
                </div>

                <div className="space-y-2 pl-2">
                  <h3 className="text-3xl font-semibold text-stone-700">Publication Fees (APCs)</h3>
                  <p className="text-base text-stone-700 pl-2">
                    OJLP follows a modest and transparent Article Processing Charge (APC) model to sustain open-access
                    publishing:
                  </p>
                  <ul className="text-base text-stone-700 space-y-1 pl-2">
                    <li><strong>APC:</strong> ₹1500 / $25 (after acceptance)</li>
                    <li><strong>Waiver Policy:</strong> Full or partial waivers are available upon request for students, early-career researchers, and scholars from low-income or underrepresented regions.</li>
                  </ul>
                  <p className="text-base text-stone-700 mt-2 pl-2">No fee is charged for submission or peer review.</p>
                </div>

                <div className="space-y-2 pl-2">
                  <h3 className="text-3xl font-semibold text-stone-700">Licensing and Rights</h3>
                  <p className="text-base text-stone-700 pl-2">
                    OJLP operates under a Creative Commons Attribution 4.0 International License (CC BY 4.0). Authors retain
                    copyright and grant OJLP the right to publish and distribute the work.
                  </p>
                </div>
              </div>

              <div className="space-y-6 pl-2">
                <div>
                  <h2 className="text-4xl text-center font-semibold text-stone-800 ">Blog Submissions</h2>
                  <div className="text-base text-center text-stone-700">
                    OJLP's blog is a space for shorter, timely, and accessible commentary on legal and policy developments.
                  </div>
                </div>

                <ul className="text-base text-stone-700 space-y-1 pl-2">
                  <h1 className="font-semibold text-3xl">We Welcome</h1>
                  <li className="pl-2">Case notes</li>
                  <li className="pl-2">Policy critiques</li>
                  <li className="pl-2">Legal tech & innovation posts</li>
                  <li className="pl-2">Op-eds grounded in legal reasoning</li>
                </ul>

                <div className="space-y-2 pl-2">
                  <h3 className="text-3xl font-semibold text-stone-700">Submission Requirements</h3>
                  <ul className="text-base text-stone-700 space-y-1 pl-2 ">
                    <li><strong>Word Limit:</strong> 800 to 3000 words</li>
                    <li><strong>Tone:</strong> Analytical yet accessible; jargon-free writing encouraged</li>
                    <li><strong>Citation Style:</strong> Internal hyperlinks where appropriate</li>
                    <li><strong>Format:</strong> Word Document (.docx) with author bio (50–100 words)</li>
                  </ul>
                </div>

                <div className="space-y-2 pl-2">
                  <h3 className="text-3xl font-semibold text-stone-700">Editorial Process</h3>
                  <div className="text-base text-stone-700 pl-2">
                    Blog submissions are reviewed by the Blog Editors on a rolling basis. Authors will typically receive a
                    response within 7–10 days. We reserve the right to edit for clarity, grammar, and style.
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-10">
                <h2 className="text-4xl text-center font-semibold text-stone-800 ">How to Submit</h2>
                <div className="grid md:grid-cols-2 pt-2 gap-12 sm:gap-4">
                  <Card className="">
                  <CardHeader className="pb-3 p-1 content-center items-center text-center ">
                    <h1 className="flex gap-2 text-3xl">
                      Journal Article Submission
                    </h1>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-6 p-1">
                    <div>
                      <h3 className="text-2xl font-semibold mb-2">Email Submission</h3>
                      <p className="text-base text-stone-600 mb-2">
                        Manuscripts should be submitted via email with the appropriate subject line format.
                      </p>
                      <div className="flex items-center justify-center p-2 bg-amber-50 rounded-md mb-2">
                        <span className="font-medium text-base">editor@ojlp.in</span>
                      </div>
                      <div className="space-y-1 mt-5">
                        <span className="text-base text-stone-600">Please include in your email:</span>
                        <ul className="text-base space-y-1">
                          <li className="flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>Subject: [Submission of Manuscript - &lt;Manuscript_Title&gt;]</span>
                          </li>
                          <li className="flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>Main manuscript (anonymized)</span>
                          </li>
                          <li className="flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>Separate title page with author information</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-2xl font-semibold mb-2">Google Form Submission</h3>
                      <p className="text-base text-stone-600 mb-2">
                        Submit your article through our Google Form for easier tracking.
                      </p>
                      <div className="space-y-1 mb-8">
                        <span className="text-base text-stone-600">The form will ask you to provide:</span>
                        <ul className="text-base space-y-1">
                          <li className="flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>Author information (name, affiliation, contact details)</span>
                          </li>
                          <li className="flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>Manuscript title and abstract</span>
                          </li>
                          <li className="flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>File uploads for your anonymized manuscript and title page</span>
                          </li>
                        </ul>
                      </div>
                      <Button size="lg" className="w-full rounded-sm" asChild>
                        <Link
                          href="https://forms.google.com/journal-submission"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Open Journal Submission Form
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="">
                  <CardHeader className="pb-3 p-1 content-center items-center text-center">
                    <h1 className="flex items-center gap-2 text-3xl">
                      Blog Submission
                    </h1>
                  </CardHeader>
                  <CardContent className="p-1 space-y-6">
                    <div>
                      <h3 className="text-2xl font-semibold mb-2">Email Submission</h3>
                      <p className="text-base text-stone-600 mb-2">
                        Blog posts should be submitted via email with the appropriate subject line format.
                      </p>
                      <div className="flex items-center justify-center p-2 bg-amber-50 rounded-md mb-2">
                        <span className="font-medium text-base ">editor@ojlp.in</span>
                      </div>
                      <div className="space-y-1 mt-5">
                        <span className="text-base text-stone-600">Please include in your email:</span>
                        <ul className="text-base space-y-1">
                          <li className="flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>Subject: [Submission of Blog - &lt;Blog_Title&gt;]</span>
                          </li>
                          <li className="flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>Blog post in Word format</span>
                          </li>
                          <li className="flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>Author bio (50-100 words)</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-2xl font-semibold mb-2">Google Form Submission</h3>
                      <p className="text-base text-stone-600 mb-2">
                        Submit your blog through our Google Form for easier tracking.
                      </p>
                      <div className="space-y-1 mb-8">
                        <span className="text-base text-stone-500">The form will ask you to provide:</span>
                        <ul className="text-base space-y-1">
                          <li className="flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>Author information and bio</span>
                          </li>
                          <li className="flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>Blog title and category</span>
                          </li>
                          <li className="flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>File upload for your blog post</span>
                          </li>
                        </ul>
                      </div>
                      <Button size="lg" className="w-full rounded-sm" asChild>
                        <Link
                          href="https://forms.google.com/blog-submission"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Open Blog Submission Form
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                </div>
            </div>
            </div> 
          </div>
        </div>
      </main>
    </div>
  )
}