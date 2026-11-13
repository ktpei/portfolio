import { site, links, education, work, skills } from "@/content";
import { Stickies } from "./stickies/stickies";

export default function Home() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url,
    jobTitle: site.role,
    email: links.find(({ href }) => href.startsWith("mailto:"))?.display,
    address: { "@type": "PostalAddress", addressLocality: "New York", addressRegion: "NY" },
    alumniOf: { "@type": "CollegeOrUniversity", name: education.school },
    worksFor: work.filter((entry) => entry.current).map(({ org }) => ({ "@type": "Organization", name: org })),
    knowsAbout: skills.flatMap((group) => group.items),
    sameAs: links.filter((link) => link.href.startsWith("http")).map((link) => link.href),
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><Stickies /></>;
}
