import type { Article, Author } from "./types"
import { authors } from "./authors"

// Helper function to get author objects by slugs
function getAuthorsBySlug(authorSlugs: string[]): Author[] {
  if (!Array.isArray(authorSlugs)) return []

  return authorSlugs
    .filter((slug) => typeof slug === "string" && slug.length > 0)
    .map((slug) => {
      const author = authors.find((author) => author.slug === slug)
      return (
        author || {
          slug: slug,
          name: "Unknown Author",
          email: "unknown@example.com",
        }
      )
    })
}

// Static data for articles
export const articles: Article[] = [
  {
    slug: "supreme-court-landmark-decision",
    title: "Supreme Court's Landmark Decision on Digital Privacy Rights",
    // Multiple authors
    authors: getAuthorsBySlug(["prof-sarah-johnson", "dr-michael-chen"]),
    // Keep for backward compatibility
    author: "Prof. Sarah Johnson",
    authorSlug: "prof-sarah-johnson",
    date: "April 15, 2024",
    readTime: 8,
    image: "/placeholder.svg?height=600&width=800",
    type: "journal",
    doi: "10.1234/lij.2024.0401",
    keywords: ["Fourth Amendment", "Digital Privacy", "Supreme Court", "Constitutional Law"],
    excerpt:
      "An analysis of the recent Supreme Court ruling that significantly expands digital privacy protections under the Fourth Amendment.",
    content:
      "The Supreme Court's recent 7-2 decision in United States v. Thompson marks a watershed moment in Fourth Amendment jurisprudence, establishing new boundaries for government surveillance in the digital age.\n\nWriting for the majority, Chief Justice Roberts emphasized that 'the Fourth Amendment was not frozen in time at the founding era' and must adapt to technological changes that have fundamentally altered how Americans store and share personal information.\n\nThe ruling establishes a new test for determining when government access to digital records constitutes a search requiring a warrant. Under this framework, officials must obtain a warrant before accessing data that reveals 'intimate details of a person's life' regardless of whether that information is held by third parties.\n\nThis decision effectively overturns aspects of the 'third-party doctrine' established in Smith v. Maryland (1979), which held that individuals have no reasonable expectation of privacy in information voluntarily disclosed to third parties.\n\nLegal scholars have described the ruling as 'revolutionary' and 'the most significant Fourth Amendment decision in decades.' Professor Alan Dershowitz of Harvard Law School noted that 'this opinion recognizes that digital is different' and that traditional legal frameworks must evolve to address modern privacy concerns.\n\nThe immediate impact of the decision will be felt in ongoing investigations that rely on warrantless access to digital records. Law enforcement agencies will need to revise their procedures and obtain warrants in a wider range of circumstances.\n\nThe ruling also has implications for legislative efforts to regulate data privacy. Congress may need to revisit pending bills to ensure they align with the Court's expanded view of constitutional privacy protections.",
  },
  {
    slug: "constitutional-interpretation-debate",
    title: "The Ongoing Debate: Living Constitution vs. Originalism",
    // Multiple authors
    authors: getAuthorsBySlug(["dr-michael-chen", "prof-james-wilson"]),
    author: "Dr. Michael Chen",
    authorSlug: "dr-michael-chen",
    date: "March 28, 2024",
    readTime: 12,
    image: "/placeholder.svg?height=600&width=800",
    type: "journal",
    doi: "10.1234/lij.2024.0328",
    keywords: ["Constitutional Interpretation", "Originalism", "Living Constitution", "Judicial Philosophy"],
    excerpt:
      "Examining the philosophical divide between 'living constitutionalism' and 'originalism' in contemporary legal thought.",
    content:
      "The debate between 'living constitutionalism' and 'originalism' continues to shape American jurisprudence, with profound implications for how courts interpret the Constitution in addressing modern challenges.\n\nOriginalism, championed by the late Justice Antonin Scalia and current Justices Clarence Thomas and Neil Gorsuch, holds that the Constitution should be interpreted according to its original public meaning at the time of ratification. Adherents argue this approach constrains judicial discretion and preserves democratic governance by requiring constitutional changes to occur through the amendment process rather than judicial interpretation.\n\nIn contrast, proponents of living constitutionalism, including the late Justice Ruth Bader Ginsburg and current Justice Sonia Sotomayor, contend that the Constitution must be interpreted in light of evolving societal norms and conditions. They argue that the Framers intentionally used broad language to create a document that could adapt to changing circumstances without requiring formal amendment.\n\nRecent Supreme Court decisions reflect this ongoing tension. In Bostock v. Clayton County (2020), Justice Gorsuch, despite his originalist philosophy, authored a majority opinion extending Title VII protections to LGBTQ+ employees based on a textualist reading of 'discrimination because of sex.' This decision prompted debate about the relationship between originalism and textualism.\n\nMeanwhile, in cases involving the Second Amendment, such as New York State Rifle & Pistol Association v. Bruen (2022), the Court has embraced a more explicitly originalist approach, examining historical traditions of firearms regulation to determine the constitutionality of modern gun control measures.\n\nLegal scholars continue to refine these interpretive theories. Some have proposed intermediate approaches, such as 'original methods originalism,' which looks to the interpretive methods used at the founding, or 'common-good constitutionalism,' which emphasizes the Constitution's role in promoting the common welfare.\n\nAs the Court confronts novel constitutional questions arising from technological change, economic globalization, and evolving social norms, the debate between these interpretive philosophies will remain central to American constitutional law.",
  },
  // Update the remaining articles similarly...
  {
    slug: "federalism-modern-challenges",
    title: "Federalism in the Face of Modern Challenges",
    authors: getAuthorsBySlug(["prof-james-wilson", "lisa-montgomery"]),
    author: "Prof. James Wilson",
    authorSlug: "prof-james-wilson",
    date: "March 10, 2024",
    readTime: 10,
    image: "/placeholder.svg?height=600&width=800",
    type: "journal",
    doi: "10.1234/lij.2024.0310",
    keywords: ["Federalism", "State Rights", "Federal Power", "Climate Policy", "Healthcare", "COVID-19"],
    excerpt:
      "How the traditional balance of state and federal power is being tested by contemporary issues like climate change and healthcare.",
    content:
      "The American system of federalism—the division of power between national and state governments—faces unprecedented challenges in the 21st century as policymakers grapple with issues that transcend traditional jurisdictional boundaries.\n\nClimate change presents perhaps the most significant test of federalism's capacity to address collective action problems. While the federal government has authority to regulate interstate commerce and negotiate international agreements, effective climate policy requires coordination across all levels of government. States like California and New York have implemented ambitious climate initiatives in the absence of comprehensive federal action, creating a patchwork of regulations that businesses must navigate.\n\nThe COVID-19 pandemic similarly exposed tensions in federal-state relations. The federal government's limited public health infrastructure required reliance on state and local health departments for implementation of testing, contact tracing, and vaccination programs. Conflicting federal guidance and state policies created confusion and hampered coordinated response efforts.\n\nHealthcare reform continues to illustrate federalism's complexities. The Affordable Care Act's Medicaid expansion, designed as a federal-state partnership, became optional for states following the Supreme Court's decision in NFIB v. Sebelius (2012). This ruling preserved state autonomy but created disparities in healthcare access based on state residence.\n\nTechnological innovation also challenges traditional federalist boundaries. Internet regulation, cryptocurrency oversight, and data privacy protection all raise questions about the appropriate level of government for regulatory authority. The European Union's General Data Protection Regulation has influenced state-level privacy laws in California and Virginia, demonstrating how global standards can shape domestic policy at the state level.\n\nScholars have proposed various adaptations to address these challenges, including 'polyphonic federalism,' which emphasizes dialogue and coordination across levels of government, and 'democratic experimentalism,' which views states as laboratories for policy innovation. Others advocate for clearer federal preemption in areas requiring national uniformity.\n\nAs Justice Louis Brandeis noted in 1932, federalism allows states to serve as 'laboratories of democracy.' Today's complex challenges may require new experiments in governance that preserve federalism's benefits while addressing problems that transcend traditional boundaries.",
  },
  {
    slug: "judicial-independence-threats",
    title: "Judicial Independence Under Threat",
    authors: getAuthorsBySlug(["lisa-montgomery", "dr-rebecca-torres"]),
    author: "Lisa Montgomery",
    authorSlug: "lisa-montgomery",
    date: "February 22, 2024",
    readTime: 7,
    image: "/placeholder.svg?height=600&width=800",
    type: "blog",
    keywords: ["Judicial Independence", "Court Packing", "Judicial Ethics", "Separation of Powers"],
    excerpt:
      "Examining growing concerns about political influence on the judiciary and proposals to safeguard judicial independence.",
    content:
      "Judicial independence, a cornerstone of constitutional democracy, faces mounting challenges in the United States and globally as courts become increasingly entangled in partisan political disputes.\n\nRecent polling indicates declining public confidence in the Supreme Court's impartiality, with approval ratings reaching historic lows following controversial decisions on abortion, voting rights, and executive power. This perception crisis threatens the judiciary's legitimacy and its ability to function as an independent check on the political branches.\n\nCalls for structural reforms have intensified, including proposals to expand the Supreme Court, implement term limits for justices, strengthen recusal standards, and establish binding ethics rules. Proponents argue these measures would enhance legitimacy and reduce politicization, while critics contend they could undermine judicial independence and stability.\n\nAt the state level, judicial independence faces different threats. Thirty-eight states hold some form of judicial elections, exposing judges to political pressure and campaign finance concerns. Studies show correlations between campaign contributions and judicial decision-making in business and criminal cases, raising due process questions highlighted in Caperton v. A.T. Massey Coal Co. (2009).\n\nInternationally, judicial independence has deteriorated in countries including Poland, Hungary, and Turkey, where governments have removed judges, packed courts, and restricted judicial authority. These developments offer cautionary examples of how quickly judicial independence can erode when political actors target courts.\n\nHistorically, the U.S. judiciary has weathered political storms, including President Franklin Roosevelt's court-packing plan and congressional jurisdiction-stripping attempts. However, current challenges occur against a backdrop of heightened polarization and declining institutional trust.\n\nLegal scholars emphasize that judicial independence requires both structural protections and cultural norms. As Professor Richard Fallon of Harvard Law School notes, 'Judicial independence ultimately depends on a shared commitment to constitutional values that transcends partisan differences.'\n\nPreserving judicial independence while ensuring accountability and legitimacy remains a central challenge for American constitutional democracy in the twenty-first century.",
  },
  {
    slug: "first-amendment-digital-age",
    title: "First Amendment in the Digital Age",
    authors: getAuthorsBySlug(["dr-rebecca-torres", "prof-elena-rodriguez"]),
    author: "Dr. Rebecca Torres",
    authorSlug: "dr-rebecca-torres",
    date: "February 5, 2024",
    readTime: 9,
    image: "/placeholder.svg?height=600&width=800",
    type: "blog",
    keywords: ["First Amendment", "Free Speech", "Social Media", "Content Moderation", "Section 230"],
    excerpt:
      "How traditional First Amendment doctrines are being applied to new digital contexts, from social media regulation to AI-generated speech.",
    content:
      "First Amendment jurisprudence faces unprecedented challenges as digital technologies transform how speech is created, disseminated, and regulated in ways the Framers could never have anticipated.\n\nSocial media platforms now function as the modern public square, yet as private entities, they are not directly bound by the First Amendment. This creates a regulatory paradox: government efforts to require content moderation may constitute compelled speech, while mandating content neutrality could prevent platforms from removing harmful material.\n\nThe Supreme Court is beginning to address these tensions. In NetChoice v. Paxton, the Court is considering whether Texas and Florida laws restricting platforms' content moderation practices violate the First Amendment. The outcome will significantly shape the relationship between government regulation, platform governance, and free expression online.\n\nArtificial intelligence presents novel First Amendment questions. As AI systems generate increasingly sophisticated content, courts must determine whether such output constitutes protected speech and, if so, who holds the speech rights—the AI developer, the user, or perhaps the AI itself. The Court's commercial speech doctrine, which affords lesser protection to commercial advertising, may provide a framework for addressing AI-generated content.\n\nEncryption technology raises additional constitutional questions. Government attempts to mandate backdoor access to encrypted communications pit national security interests against free speech and privacy concerns. Some scholars argue that encryption code itself constitutes protected speech under Bernstein v. Department of Justice (1999).\n\nDeep fakes and synthetic media challenge traditional assumptions about false speech. While the First Amendment generally protects false statements under United States v. Alvarez (2012), the potential harm from sophisticated digital forgeries may justify narrowly tailored regulations when used to defame, defraud, or interfere with elections.\n\nProfessor Jack Balkin of Yale Law School has proposed a 'constitutional triangle' framework that balances traditional free speech protections with digital-age concerns about access and trustworthiness. This approach recognizes that meaningful free expression in the digital era requires not just freedom from government censorship but also access to communication channels and protection from manipulation and harassment.\n\nAs Justice Anthony Kennedy observed in Packingham v. North Carolina (2017), the Court must proceed with 'extreme caution' when applying First Amendment principles to the internet, recognizing both its unprecedented capacity for expression and its potential for harm.",
  },
  {
    slug: "constitutional-rights-non-citizens",
    title: "Constitutional Rights of Non-Citizens",
    authors: getAuthorsBySlug(["prof-elena-rodriguez", "prof-sarah-johnson"]),
    author: "Prof. Elena Rodriguez",
    authorSlug: "prof-elena-rodriguez",
    date: "January 18, 2024",
    readTime: 11,
    image: "/placeholder.svg?height=600&width=800",
    type: "blog",
    keywords: ["Immigration Law", "Constitutional Rights", "Due Process", "Equal Protection", "Plenary Power"],
    excerpt:
      "A comprehensive analysis of which constitutional protections extend to non-citizens within and outside U.S. borders.",
    content:
      "The constitutional rights of non-citizens remain one of the most complex and contested areas of American constitutional law, with significant implications for immigration policy, national security, and international relations.\n\nContrary to popular belief, the Constitution extends many protections to non-citizens within U.S. territory. The Supreme Court established in Yick Wo v. Hopkins (1886) that the Fourteenth Amendment's equal protection clause applies to 'all persons' regardless of citizenship status. Similarly, in Wong Wing v. United States (1896), the Court held that non-citizens are entitled to Fifth and Sixth Amendment protections in criminal proceedings.\n\nHowever, the Court has recognized certain constitutional distinctions between citizens and non-citizens. In Mathews v. Diaz (1976), the Court upheld Congress's authority to limit certain federal benefits to citizens and long-term legal residents. The Court has also afforded Congress and the executive branch significant deference in immigration matters under the 'plenary power doctrine,' though this deference has limits, as demonstrated in Department of Homeland Security v. Regents (2020), which invalidated the Trump administration's rescission of the DACA program on procedural grounds.\n\nThe geographic reach of constitutional protections for non-citizens presents particularly challenging questions. In United States v. Verdugo-Urquidez (1990), the Court held that the Fourth Amendment does not apply to searches of non-citizens' property in foreign territories. However, in Boumediene v. Bush (2008), the Court extended habeas corpus rights to non-citizen detainees at Guantanamo Bay, emphasizing factors including the nature of the site and the practical obstacles to recognizing the right.\n\nThe treatment of asylum seekers and migrants at the border raises ongoing constitutional questions. In Department of Homeland Security v. Thuraissigiam (2020), the Court limited habeas corpus protections for asylum seekers in expedited removal proceedings, while leaving open broader questions about due process rights during initial entry.\n\nRecent immigration enforcement practices have prompted litigation over the detention conditions of non-citizens. Courts have generally recognized that the Due Process Clause prohibits punitive conditions for civil immigration detainees and requires adequate medical care, though the standard for determining what constitutes 'adequate' remains contested.\n\nThe rights of undocumented immigrants living within the United States present particular complexities. In Plyler v. Doe (1982), the Court held that states cannot deny undocumented children access to public education, recognizing the importance of education and the unfairness of penalizing children for their parents' actions. However, in other contexts, courts have permitted distinctions based on immigration status.\n\nAs Professor Hiroshi Motomura of UCLA School of Law observes, 'Constitutional rights for non-citizens reflect a tension between territorial presence as a basis for rights and membership in the political community as a prerequisite for full constitutional protection.' This tension continues to shape judicial decisions and policy debates in an era of global migration and transnational security concerns.",
  },
]

// Functions to get articles (now using static data)
export function getArticles(limit?: number) {
  const filteredArticles = articles.filter((article) => article.type === "journal")
  return limit ? filteredArticles.slice(0, limit) : filteredArticles
}

export function getArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug) || null
}

export function getBlogs(limit?: number) {
  const blogs = articles.filter((article) => article.type === "blog")
  return limit ? blogs.slice(0, limit) : blogs
}

export function getBlogBySlug(slug: string) {
  return articles.find((article) => article.slug === slug && article.type === "blog") || null
}

export function getFeaturedArticles(limit = 4) {
  // For static data, just return the first few articles as "featured"
  return articles.slice(0, limit)
}

export function getArticlesByCategory(category: string, limit?: number) {
  // Since we don't have categories in our static data, this is a simplified version
  const filteredArticles = articles.filter((article) => {
    // Simulate category matching based on content or title
    return (
      article.title.toLowerCase().includes(category.toLowerCase()) ||
      article.content.toLowerCase().includes(category.toLowerCase())
    )
  })

  return limit ? filteredArticles.slice(0, limit) : filteredArticles
}

export function getCategories() {
  // Return some static categories
  return [
    { id: "1", name: "Constitutional Law", slug: "constitutional-law" },
    { id: "2", name: "First Amendment", slug: "first-amendment" },
    { id: "3", name: "Judicial Politics", slug: "judicial-politics" },
    { id: "4", name: "Legal Theory", slug: "legal-theory" },
    { id: "5", name: "Civil Rights", slug: "civil-rights" },
  ]
}

// Static blogs data for fallback
export const blogs = articles.filter((article) => article.type === "blog")

// Static categories data for fallback
export const categories = [
  { id: "1", name: "Constitutional Law", slug: "constitutional-law" },
  { id: "2", name: "First Amendment", slug: "first-amendment" },
  { id: "3", name: "Judicial Politics", slug: "judicial-politics" },
  { id: "4", name: "Legal Theory", slug: "legal-theory" },
  { id: "5", name: "Civil Rights", slug: "civil-rights" },
]
