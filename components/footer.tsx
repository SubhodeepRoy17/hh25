import { Instagram, Linkedin, Github, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-black pb-16 pt-6">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-800 bg-gradient-to-b from-white/5 to-transparent p-6 md:p-10">
          <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
            {/* Brand and blurb */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </div>
                <span className="text-lg font-semibold">Smart Surplus</span>
              </div>
              <p className="text-sm text-gray-300">
                Smart Surplus connects donors, drivers, and nonprofits to turn excess food into meals—fast, transparent,
                and measurable.
              </p>
              <div className="flex items-center gap-4 text-gray-300">
                <a aria-label="Twitter" href="#" className="hover:text-white">
                  <Twitter className="h-5 w-5" />
                </a>
                <a aria-label="Instagram" href="#" className="hover:text-white">
                  <Instagram className="h-5 w-5" />
                </a>
                <a aria-label="LinkedIn" href="#" className="hover:text-white">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a aria-label="GitHub" href="#" className="hover:text-white">
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Columns */}
            <FooterColumn
              title="Product"
              links={[
                { label: "Features", href: "#" },
                { label: "Pricing", href: "#" },
                { label: "Integrations", href: "#" },
                { label: "Changelog", href: "#" },
              ]}
            />
            <FooterColumn
              title="Resources"
              links={[
                { label: "Documentation", href: "#" },
                { label: "Tutorials", href: "#" },
                { label: "Blog", href: "#" },
                { label: "Support", href: "#" },
              ]}
            />
            <FooterColumn
              title="Company"
              links={[
                { label: "About", href: "#" },
                { label: "Careers", href: "#" },
                { label: "Contact", href: "#" },
                { label: "Partners", href: "#" },
              ]}
            />
          </div>

          <div className="mt-8 border-t border-gray-800 pt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Smart Surplus. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white">
                Cookies Settings
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold text-gray-200">{title}</h4>
      <ul className="space-y-2 text-sm text-gray-400">
        {links.map((l) => (
          <li key={l.label}>
            <a className="hover:text-white" href={l.href}>
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
