import { site, links, education, work, skills } from "@/content";
import { Stickies } from "./stickies/stickies";

export default function Home() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url,
    jobTitle: site.role,
    email: "kevinxpei@gmail.com",
    address: { "@type": "PostalAddress", addressLocality: "New York", addressRegion: "NY" },
    alumniOf: { "@type": "CollegeOrUniversity", name: education.school },
    worksFor: { "@type": "Organization", name: work[0].org },
    knowsAbout: skills.flatMap((group) => group.items),
    sameAs: links.filter((link) => link.href.startsWith("http")).map((link) => link.href),
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><Stickies /></>;
}
