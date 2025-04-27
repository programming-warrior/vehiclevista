import { Link } from "wouter";
import { Car } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-12">
          {/* Logo and Social Links */}
          <div className="flex flex-col gap-6 md:col-span-2 lg:col-span-3">
            <Link href="/" className="flex items-center gap-3">
              {/* <img src="/logo.svg" alt="Logo" className="h-10 mb-4" /> */}
              <div className="bg-blue-600 p-2 rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Auto World Trader</span>
            </Link>
            <p className="text-slate-400 text-sm">
              Your trusted platform for buying and selling quality vehicles worldwide.
            </p>
            <div className="flex gap-4">
              <Link href="/instagram" className="bg-slate-800 p-2 rounded-full hover:bg-blue-600 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17" cy="7" r="1" />
                </svg>
              </Link>
              <Link href="/twitter" className="bg-slate-800 p-2 rounded-full hover:bg-blue-600 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </Link>
              <Link href="/facebook" className="bg-slate-800 p-2 rounded-full hover:bg-blue-600 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1 lg:col-span-3 lg:pl-8">
            <h3 className="text-lg font-bold mb-6 text-white relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-1 after:w-8 after:bg-blue-600">Auction List</h3>
            <ul className="space-y-3">
              <li><Link href="/cars" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center"><span className="mr-2">→</span>Cars</Link></li>
              <li><Link href="/bikes" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center"><span className="mr-2">→</span>Bikes</Link></li>
              <li><Link href="/watches" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center"><span className="mr-2">→</span>Watches</Link></li>
            </ul>
          </div>

          {/* About Links */}
          <div className="md:col-span-1 lg:col-span-3">
            <h3 className="text-lg font-bold mb-6 text-white relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-1 after:w-8 after:bg-blue-600">About</h3>
            <ul className="space-y-3">
              <li><Link href="/help-center" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center"><span className="mr-2">→</span>Help Center</Link></li>
              <li><Link href="/terms" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center"><span className="mr-2">→</span>Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center"><span className="mr-2">→</span>Privacy Policy</Link></li>
              <li><Link href="/returns" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center"><span className="mr-2">→</span>Returns & Refund</Link></li>
              <li><Link href="/feedback" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center"><span className="mr-2">→</span>Feedback</Link></li>
            </ul>
          </div>

          {/* Pages Links */}
          <div className="md:col-span-1 lg:col-span-3">
            <h3 className="text-lg font-bold mb-6 text-white relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-1 after:w-8 after:bg-blue-600">Pages</h3>
            <ul className="space-y-3">
              <li><Link href="/auction-details" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center"><span className="mr-2">→</span>Auction Details</Link></li>
              <li><Link href="/sales" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center"><span className="mr-2">→</span>Sales</Link></li>
              <li><Link href="/sell-car" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center"><span className="mr-2">→</span>Sell Car</Link></li>
              <li><Link href="/services" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center"><span className="mr-2">→</span>Services</Link></li>
            </ul>
          </div>
        </div>

        {/* Action Buttons - Keeping commented as requested but with updated styling */}
        {/* <div className="flex flex-wrap gap-4 mb-8 py-6 border-t border-slate-800 border-b">
          <div className="flex gap-4">
            <Link href="/auction" className="bg-blue-600 px-6 py-3 rounded-md text-white font-medium hover:bg-blue-700 transition-colors">
              Live Auction
            </Link>
            <Link href="/contact" className="bg-slate-800 px-6 py-3 rounded-md text-white font-medium hover:bg-slate-700 transition-colors">
              Let's Talk
            </Link>
          </div>
        </div> */}

        {/* Bottom Footer */}
        <div className="pt-8 border-t border-slate-800 mt-12 flex flex-wrap justify-between items-center text-sm text-slate-400">
          {/* <div className="flex items-center gap-4">
            <select className="bg-slate-800 text-slate-400 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600">
              <option>English</option>
              <option>Privacy</option>
              <option>Legal</option>
            </select>
          </div> */}
          <div>© 2024 Auto World Trader. All Rights Reserved.</div>
          <div className="mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-blue-400 transition-colors mr-6">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}