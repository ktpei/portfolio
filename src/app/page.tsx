import {
  site,
  intro,
  links,
  work,
  projects,
  education,
  skills,
  type Entry,
  type Project,
} from "@/content";

export default function Home() {
  return (
    <>
      <JsonLd />
      <TopBar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 sm:px-8">
        <Hero />

        <Section label="Work">
          <div className="space-y-12">
            {work.map((entry) => (
              <WorkEntry key={entry.org + entry.period} entry={entry} />
            ))}
          </div>
        </Section>

        <Section label="Projects">
          <div className="space-y-5">
            {projects.map((project) => (
              <ProjectCard key={project.name} project={project} />
            ))}
          </div>
        </Section>

        <Section label="Education">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-lg font-medium tracking-tight">
                {education.school}
              </h3>
              <span className="ml-auto shrink-0 font-mono text-xs text-ink-faint tabular-nums">
                {education.period}
              </span>
            </div>
            <p className="mt-1 text-ink-muted">
              {education.degree}
              <span className="text-ink-faint"> · {education.detail}</span>
            </p>
          </div>
        </Section>

        <Section label="Toolkit">
          <dl className="space-y-5">
            {skills.map((group) => (
              <div
                key={group.group}
                className="sm:grid sm:grid-cols-[8.5rem_1fr] sm:gap-6"
              >
                <dt className="font-mono text-xs uppercase tracking-widest text-ink-faint sm:pt-1">
                  {group.group}
                </dt>
                <dd className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1.5 sm:mt-0">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded border border-rule px-1.5 py-0.5 font-mono text-xs text-ink-muted"
                    >
                      {item}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        <Contact />
      </main>

      <Footer />
    </>
  );
}

/* ── Structured data (helps search associate the name with this site) ── */

function JsonLd() {
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
    sameAs: links
      .filter((link) => link.href.startsWith("http"))
      .map((link) => link.href),
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/* ── Chrome ─────────────────────────────────────────────── */

function TopBar() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
        <span className="shrink-0 whitespace-nowrap font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
          {site.name}
        </span>
        <nav className="flex items-center gap-3 font-mono text-xs sm:gap-4">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noreferrer" : undefined}
              className="link-draw text-ink-muted transition-colors hover:text-accent"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="pt-16 pb-20 sm:pt-24 sm:pb-24">
      {site.status ? (
        <p className="mb-7 inline-flex items-start gap-2 rounded-full border border-rule bg-paper-raised px-3 py-1 font-mono text-[0.7rem] uppercase tracking-widest text-ink-muted">
          <span className="relative mt-[0.45em] flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          {site.status}
        </p>
      ) : null}

      <h1 className="font-display text-6xl leading-[0.95] tracking-tight sm:text-7xl">
        {site.name}
      </h1>

      <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-ink-faint">
        {site.role} · {site.location}
      </p>

      <div className="mt-9 max-w-xl space-y-4 text-[1.05rem] leading-relaxed text-ink-muted">
        {intro.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={link.href.startsWith("http") ? "noreferrer" : undefined}
            className="group text-accent transition-opacity hover:opacity-70"
          >
            <span className="link-draw">{link.display}</span>
            <span aria-hidden className="ml-1 inline-block transition-transform group-hover:translate-x-0.5">
              ↗
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-rule py-14 sm:grid sm:grid-cols-[8.5rem_1fr] sm:gap-6 sm:py-16">
      <h2 className="mb-6 font-mono text-xs uppercase tracking-widest text-ink-faint sm:mb-0 sm:pt-1">
        {label}
      </h2>
      <div>{children}</div>
    </section>
  );
}

/* ── Entries ────────────────────────────────────────────── */

function WorkEntry({ entry }: { entry: Entry }) {
  return (
    <article>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-lg font-medium tracking-tight">
          {entry.role}
          <span className="text-ink-faint"> · </span>
          {entry.href ? (
            <a
              href={entry.href}
              target="_blank"
              rel="noreferrer"
              className="link-draw text-accent"
            >
              {entry.org}
            </a>
          ) : (
            <span className="text-accent">{entry.org}</span>
          )}
        </h3>
        <span className="ml-auto flex shrink-0 items-center gap-2 font-mono text-xs text-ink-faint tabular-nums">
          {entry.current ? (
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
          ) : null}
          {entry.period}
        </span>
      </div>

      <p className="mt-1 font-mono text-xs text-ink-faint">{entry.place}</p>

      <ul className="mt-4 space-y-2.5">
        {entry.points.map((point) => (
          <li
            key={point.slice(0, 24)}
            className="relative pl-5 leading-relaxed text-ink-muted"
          >
            <span
              aria-hidden
              className="absolute left-0 top-[0.7em] h-px w-2.5 bg-rule"
            />
            {point}
          </li>
        ))}
      </ul>
    </article>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const Wrapper = project.href ? "a" : "div";

  return (
    <Wrapper
      {...(project.href
        ? { href: project.href, target: "_blank", rel: "noreferrer" }
        : {})}
      className="group block rounded-lg border border-rule bg-paper-raised p-5 transition-colors hover:border-accent/40 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="flex items-baseline gap-1.5 text-lg font-medium tracking-tight">
          {project.name}
          {project.href ? (
            <span
              aria-hidden
              className="font-mono text-xs text-ink-faint transition-all group-hover:translate-x-0.5 group-hover:text-accent"
            >
              ↗
            </span>
          ) : null}
        </h3>
        <span className="ml-auto shrink-0 font-mono text-xs text-ink-faint tabular-nums">
          {project.period}
        </span>
      </div>

      {project.award ? (
        <p className="mt-1.5 font-mono text-xs uppercase tracking-widest text-accent">
          {project.award}
        </p>
      ) : null}

      <p className="mt-3 leading-relaxed text-ink-muted">{project.blurb}</p>

      <ul className="mt-3 space-y-2">
        {project.points.map((point) => (
          <li
            key={point.slice(0, 24)}
            className="relative pl-5 text-sm leading-relaxed text-ink-muted"
          >
            <span
              aria-hidden
              className="absolute left-0 top-[0.7em] h-px w-2.5 bg-rule"
            />
            {point}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 font-mono text-[0.7rem] text-ink-faint">
        <p className="flex flex-wrap gap-x-2 gap-y-1">
          {project.stack.map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </p>
        {project.href ? (
          <span className="ml-auto shrink-0 transition-colors group-hover:text-accent">
            {project.href.replace(/^https:\/\/(www\.)?/, "")}
          </span>
        ) : null}
      </div>
    </Wrapper>
  );
}

function Contact() {
  return (
    <section className="border-t border-rule py-16 sm:py-20">
      <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
        Let&rsquo;s talk.
      </h2>
      <p className="mt-3 max-w-md leading-relaxed text-ink-muted">
        I&rsquo;m always up for a conversation about backend systems, agent
        infrastructure, or anything you&rsquo;re building.
      </p>
      <a
        href={links[0].href}
        className="mt-6 inline-block font-mono text-lg text-accent"
      >
        <span className="link-draw">{links[0].display}</span>
      </a>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono text-xs text-ink-faint sm:px-8">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <a
          href={site.resume}
          className="link-draw transition-colors hover:text-accent"
        >
          Résumé (PDF)
        </a>
      </div>
    </footer>
  );
}
