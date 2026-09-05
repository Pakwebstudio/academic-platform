import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <span className="text-white font-bold text-xs">A</span>
              </div>
              <span className="text-lg font-bold text-gradient">Acadexa</span>
            </div>
            <p className="text-sm text-slate-500 max-w-xs">
              A professional academic research platform connecting researchers, professors, and students worldwide.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Platform</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/researchers" className="hover:text-slate-700">Researchers</Link></li>
              <li><Link href="/papers" className="hover:text-slate-700">Papers</Link></li>
              <li><Link href="/universities" className="hover:text-slate-700">Universities</Link></li>
              <li><Link href="/register" className="hover:text-slate-700">Join</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Resources</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/papers" className="hover:text-slate-700">Discover Research</Link></li>
              <li><Link href="/researchers" className="hover:text-slate-700">Find Researchers</Link></li>
              <li><Link href="/register" className="hover:text-slate-700">Publish Papers</Link></li>
              <li><Link href="/register" className="hover:text-slate-700">Collaborate</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/terms" className="hover:text-slate-700">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-slate-700">Privacy Policy</Link></li>
              <li><Link href="/copyright" className="hover:text-slate-700">Copyright Policy</Link></li>
              <li><Link href="/contact" className="hover:text-slate-700">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400">&copy; 2026 Acadexa. All rights reserved.</p>
          <p className="text-xs text-slate-400">Academic Research & Professional Platform</p>
        </div>
      </div>
    </footer>
  );
}
