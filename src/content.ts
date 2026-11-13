export const site = {
  // Registered domain. Drives the canonical tag, sitemap, robots.txt, and the
  // footer of the OG preview card — change here and everything follows.
  url: "https://kevinpei.dev",
  name: "Kevin Pei",
  role: "Software Engineer",
  location: "New York, NY",
  status: "Open to Summer 2027 internships",
};

export const intro = [
  "I build backend systems and the infrastructure that agents run on.",
  "Computer science at NYU. Currently shipping at Korr Insurtech and leading server development at NYU's High Speed Research Lab. Outside of work, I build award-winning agent tooling.",
];

export const links = [
  { label: "Email", href: "mailto:kevinxpei@gmail.com", display: "kevinxpei@gmail.com" },
  { label: "GitHub", href: "https://github.com/ktpei", display: "github.com/ktpei" },
  { label: "LinkedIn", href: "https://linkedin.com/in/kevin-pei", display: "linkedin.com/in/kevin-pei" },
];

export type Entry = {
  role: string;
  org: string;
  href?: string;
  place?: string;
  period: string;
  current?: boolean;
  points: string[];
};

export const work: Entry[] = [
  {
    role: "Software Engineer (Contract)",
    org: "ProvenanceXL",
    href: "https://www.provenancexl.com/",
    period: "Sep 2026 — Present",
    current: true,
    points: [],
  },
  {
    role: "Software Engineer Intern",
    org: "Korr Insurtech",
    href: "https://korr.co",
    place: "New York, NY",
    period: "May 2026 — Present",
    current: true,
    points: [
      "Cut core document workflow load time 65% with parallel server-side queries and ElastiCache.",
      "Consolidated 60+ HTTP Lambda functions into a single Express Lambda behind API Gateway — cold-start surfaces from 60 to 1, provisioned memory down 93%, monthly infrastructure cost down 29%.",
      "Migrated 100,000+ insurance policies off a legacy administration platform, writing reconciliation logic that hit 99.9% field-level accuracy against source.",
      "Shipped 5 insurance-operation workflows end to end across REST APIs and OpenSearch.",
    ],
  },
  {
    role: "Server Development Lead",
    org: "NYU High Speed Research Lab",
    place: "New York, NY",
    period: "Dec 2025 — Present",
    current: true,
    points: [
      "Extend Corelink's JS and Python open-source libraries — a data-agnostic transport framework for real-time applications.",
      "Reduced streaming jitter 20% and added support for 4+ protocols, enabling browser-native streaming.",
      "Built a credential-provisioning REST API with TTL leases and cleanup, replacing manual credential workflows.",
    ],
  },
  {
    role: "Software Engineer Intern",
    org: "INF.ai",
    place: "Shanghai, China",
    period: "Jun 2025 — Aug 2025",
    points: [
      "Scaled a securities-exam prep platform to 500+ concurrent users by optimizing query and request handling.",
      "Implemented role-based access across test modules, admin dashboards, and instructor performance analytics.",
      "Built timed-exam state management with Valtio, enforcing exam progress and sequential navigation.",
    ],
  },
];

export type Project = {
  name: string;
  award?: string;
  blurb: string;
  points: string[];
  stack: string[];
  period: string;
  href?: string;
};

export const projects: Project[] = [
  {
    name: "PersonaLab",
    award: "1st place — NYU Buildathon",
    period: "Feb 2026",
    blurb:
      "An automated UX-testing platform that deploys browser agents to simulate diverse user personas across product workflows.",
    points: [
      "Asynchronous BullMQ + Redis pipeline supporting 12+ concurrent browser simulations.",
      "Agentic loop with retry logic, state recovery, and stall detection for reliable behavior across multi-step e-commerce flows.",
    ],
    stack: ["TypeScript", "Next.js", "BullMQ", "PostgreSQL", "Docker"],
    href: "https://github.com/ktpei/persona-lab",
  },
  {
    name: "AgentOS",
    award: "1st place — Claude Hackathon, Columbia",
    period: "Apr 2026",
    blurb:
      "A Fiverr-style marketplace for configuring and deploying specialized OpenClaw agents.",
    points: [
      "FastAPI and Docker orchestration layer that provisions isolated, role-configured agents with persistent memory and scoped OAuth integrations.",
      "Private Docker bridge network for task dispatch between the platform and worker containers.",
    ],
    stack: ["Python", "FastAPI", "Docker", "Next.js", "Supabase", "OAuth"],
    href: "https://github.com/ktpei/AgentOS",
  },
  {
    name: "Compco",
    award: "Co-founder",
    period: "Apr 2023 — Aug 2024",
    blurb:
      "A Looking-For-Group platform for community events across Shanghai, reaching 200+ monthly active users.",
    points: [
      "Built and deployed backend services, authentication, and account management on Alibaba Cloud.",
    ],
    stack: ["TypeScript", "React", "Node.js", "Figma", "AliCloud"],
  },
];

export const education = {
  school: "New York University",
  degree: "B.S. Computer Science, Data Science minor",
  detail: "GPA 3.83 / 4.0",
  period: "Expected May 2028",
};

export const skills: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["Python", "TypeScript", "JavaScript", "SQL"] },
  { group: "Frameworks", items: ["React", "React Native", "Next.js", "Node.js", "FastAPI"] },
  {
    group: "Cloud & Infra",
    items: ["AWS", "GCP", "PostgreSQL", "DynamoDB", "Redis", "OpenSearch", "ElastiCache", "S3", "SQS", "Docker"],
  },
  { group: "Tools", items: ["Git", "Claude Code", "Cursor", "Supabase", "Figma"] },
];
