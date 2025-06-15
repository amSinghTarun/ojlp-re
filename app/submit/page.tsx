import Link from "next/link"
import { Scale, Mail, FileText, CheckCircle, ExternalLink } from "lucide-react"

import { Navigation } from "@/components/navigation"
import { Separator } from "@/components/ui/separator"
import { DecorativeHeading } from "@/components/decorative-heading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SubmitPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container px-4 py-12 md:px-6">
          <div className="mb-8">
            <DecorativeHeading level={1}>Submit Your Work</DecorativeHeading>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto">
              OJLP welcomes submissions for both peer-reviewed journal articles and editorially reviewed blog posts.
              Please review the relevant guidelines below before submitting your work.
            </p>
          </div>

          <div className="grid gap-12">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="font-serif">Journal Article Submissions</h2>
              <p>
                We invite original, unpublished research articles that make a substantial contribution to the fields of
                law, public policy, and interdisciplinary legal studies.
              </p>

              <h3 className="font-serif">Submission Requirements</h3>
              <ul>
                <li>
                  <strong>Word Limit:</strong> 5,000 to 10,000 words (including footnotes)
                </li>
                <li>
                  <strong>Citation Style:</strong> OSCOLA (Oxford Standard for the Citation of Legal Authorities)
                  <br />
                  <span className="text-sm text-muted-foreground">
                    (Alternatively, submissions with any internationally recognized citation style may be accepted with
                    proper formatting)
                  </span>
                </li>
                <li>
                  <strong>Format:</strong> Microsoft Word (.doc/.docx)
                </li>
                <li>
                  <strong>Anonymity:</strong> The main manuscript should not contain any identifying information to
                  facilitate double-blind peer review. A separate title page with a short author introduction should be
                  uploaded.
                </li>
              </ul>

              <h3 className="font-serif">Peer-Review Process</h3>
              <p>
                All journal submissions undergo a double-blind peer review conducted by at least two subject experts.
                The process typically takes 4–6 weeks. Authors will receive detailed feedback, and decisions will be
                communicated as:
              </p>
              <ul>
                <li>Accepted</li>
                <li>Accepted with Minor Revisions</li>
                <li>Revise and Resubmit</li>
                <li>Reject</li>
              </ul>

              <h3 className="font-serif">Publication Fees (APCs)</h3>
              <p>
                OJLP follows a modest and transparent Article Processing Charge (APC) model to sustain open-access
                publishing:
              </p>
              <ul>
                <li>
                  <strong>APC:</strong> ₹1500 / $25 (after acceptance)
                </li>
                <li>
                  <strong>Waiver Policy:</strong> Full or partial waivers are available upon request for students,
                  early-career researchers, and scholars from low-income or underrepresented regions.
                </li>
              </ul>
              <p>No fee is charged for submission or peer review.</p>

              <h3 className="font-serif">Licensing and Rights</h3>
              <p>
                OJLP operates under a Creative Commons Attribution 4.0 International License (CC BY 4.0). Authors retain
                copyright and grant OJLP the right to publish and distribute the work.
              </p>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="font-serif">Blog Submissions</h2>
              <p>
                OJLP's blog is a space for shorter, timely, and accessible commentary on legal and policy developments.
                We welcome:
              </p>
              <ul>
                <li>Case notes</li>
                <li>Policy critiques</li>
                <li>Legal tech & innovation posts</li>
                <li>Op-eds grounded in legal reasoning</li>
              </ul>

              <h3 className="font-serif">Submission Requirements</h3>
              <ul>
                <li>
                  <strong>Word Limit:</strong> 800 to 3000 words
                </li>
                <li>
                  <strong>Tone:</strong> Analytical yet accessible; jargon-free writing encouraged
                </li>
                <li>
                  <strong>Citation Style:</strong> Internal hyperlinks where appropriate
                </li>
                <li>
                  <strong>Format:</strong> Word Document (.docx) with author bio (50–100 words)
                </li>
              </ul>

              <h3 className="font-serif">Editorial Process</h3>
              <p>
                Blog submissions are reviewed by the Blog Editors on a rolling basis. Authors will typically receive a
                response within 7–10 days. We reserve the right to edit for clarity, grammar, and style.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight font-serif mb-6 text-center">How to Submit</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
                  <CardHeader className="bg-primary/5 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Journal Article Submission
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Email Submission</h3>
                      <p className="mb-3">
                        Manuscripts should be submitted via email with the appropriate subject line format.
                      </p>
                      <div className="flex items-center justify-center p-4 bg-muted rounded-md mb-3">
                        <p className="font-medium text-lg">editor@ojlp.in</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Please include in your email:</p>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>Subject: [Submission of Manuscript - &lt;Manuscript_Title&gt;]</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>Main manuscript (anonymized)</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>Separate title page with author information</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-3">Google Form Submission</h3>
                      <p className="mb-3">
                        Submit your journal article through our Google Form. This method allows for easier tracking and
                        management of your submission.
                      </p>
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-muted-foreground">The form will ask you to provide:</p>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>Author information (name, affiliation, contact details)</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>Manuscript title and abstract</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>File uploads for your anonymized manuscript and title page</span>
                          </li>
                        </ul>
                      </div>
                      <div className="flex justify-center">
                        <Button className="w-full" asChild>
                          <Link
                            href="https://forms.google.com/journal-submission"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Journal Submission Form
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
                  <CardHeader className="bg-primary/5 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Blog Submission
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Email Submission</h3>
                      <p className="mb-3">
                        Blog posts should be submitted via email with the appropriate subject line format.
                      </p>
                      <div className="flex items-center justify-center p-4 bg-muted rounded-md mb-3">
                        <p className="font-medium text-lg">editor@ojlp.in</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Please include in your email:</p>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>Subject: [Submission of Blog - &lt;Blog_Title&gt;]</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>Blog post in Word format</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>Author bio (50-100 words)</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-3">Google Form Submission</h3>
                      <p className="mb-3">
                        Submit your blog post through our Google Form. This method allows for easier tracking and
                        management of your submission.
                      </p>
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-muted-foreground">The form will ask you to provide:</p>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>Author information and bio</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>Blog title and category</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>File upload for your blog post</span>
                          </li>
                        </ul>
                      </div>
                      <div className="flex justify-center">
                        <Button className="w-full" asChild>
                          <Link
                            href="https://forms.google.com/blog-submission"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Blog Submission Form
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-xl font-bold font-serif mb-4">Questions?</h3>
              <p className="mb-4">
                For questions regarding submissions, please contact our editorial team at{" "}
                <span className="font-medium">editorial@ojlp.in</span>.
              </p>
              <p className="text-sm text-muted-foreground">
                We aim to respond to all inquiries within 2-3 business days.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
