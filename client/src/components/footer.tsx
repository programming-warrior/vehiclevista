import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white py-12">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
          {/* Logo and Social Links */}
          <div className="md:col-span-3">
            <Link href="/">
              <img src="/logo.svg" alt="Logo" className="h-8 mb-4" />
            </Link>
            <div className="flex gap-4">
              <Link href="/instagram" className="text-gray-600 hover:text-gray-900">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17" cy="7" r="1" />
                </svg>
              </Link>
              <Link href="/twitter" className="text-gray-600 hover:text-gray-900">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </Link>
              <Link href="/facebook" className="text-gray-600 hover:text-gray-900">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h3 className="font-semibold mb-4">Auction List</h3>
            <ul className="space-y-2">
              <li><Link href="/cars" className="text-gray-600 hover:text-gray-900">Cars</Link></li>
              <li><Link href="/bikes" className="text-gray-600 hover:text-gray-900">Bike</Link></li>
              <li><Link href="/watches" className="text-gray-600 hover:text-gray-900">Watches</Link></li>
            </ul>
          </div>

          {/* About Links */}
          <div className="md:col-span-3">
            <h3 className="font-semibold mb-4">About</h3>
            <ul className="space-y-2">
              <li><Link href="/help-center" className="text-gray-600 hover:text-gray-900">Help Center</Link></li>
              <li><Link href="/terms" className="text-gray-600 hover:text-gray-900">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy Policy</Link></li>
              <li><Link href="/returns" className="text-gray-600 hover:text-gray-900">Returns & Refund</Link></li>
              <li><Link href="/feedback" className="text-gray-600 hover:text-gray-900">Feedback</Link></li>
            </ul>
          </div>

          {/* Pages Links */}
          <div className="md:col-span-3">
            <h3 className="font-semibold mb-4">Pages</h3>
            <ul className="space-y-2">
              <li><Link href="/auction-details" className="text-gray-600 hover:text-gray-900">Auction Details</Link></li>
              <li><Link href="/sales" className="text-gray-600 hover:text-gray-900">Sales</Link></li>
              <li><Link href="/sell-car" className="text-gray-600 hover:text-gray-900">Sell Car</Link></li>
              <li><Link href="/services" className="text-gray-600 hover:text-gray-900">Services</Link></li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8 py-6 border-t border-b">
          <div className="flex gap-4">
            <Link href="/auction" className="bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200">
              Auction
            </Link>
            <Link href="/contact" className="bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200">
              Let's Talk
            </Link>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="flex flex-wrap justify-between items-center text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <select className="bg-transparent">
              <option>English</option>
              <option>Privacy</option>
              <option>Legal</option>
            </select>
          </div>
          <div>© 2024. All Rights Reserved.</div>
        </div>
      </div>
    </footer>
  );
}
