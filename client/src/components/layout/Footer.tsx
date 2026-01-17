import { Link } from "wouter";
import { Mail, Phone, MapPin } from "lucide-react";
import { SiFacebook, SiInstagram, SiPinterest, SiX } from "react-icons/si";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="font-serif text-2xl font-bold text-primary mb-4">Marjahan's</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Crafting timeless elegance since 1985. Each piece tells a story of 
              exceptional craftsmanship and enduring beauty.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-facebook">
                <SiFacebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-instagram">
                <SiInstagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-pinterest">
                <SiPinterest className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-x">
                <SiX className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-shop">
                  Shop All
                </Link>
              </li>
              <li>
                <Link href="/category/rings" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-rings">
                  Rings
                </Link>
              </li>
              <li>
                <Link href="/category/necklaces" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-necklaces">
                  Necklaces
                </Link>
              </li>
              <li>
                <Link href="/category/bracelets" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-bracelets">
                  Bracelets
                </Link>
              </li>
              <li>
                <Link href="/category/earrings" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-earrings">
                  Earrings
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>123 Luxury Lane, Beverly Hills, CA 90210</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+1 (800) 555-0123</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>contact@marjahans.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Newsletter</h4>
            <p className="text-muted-foreground text-sm mb-4">
              Subscribe to receive updates on new arrivals and exclusive offers.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Your email"
                className="flex-1"
                data-testid="input-newsletter-email"
              />
              <Button type="submit" data-testid="button-newsletter-subscribe">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Marjahan's. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Shipping Info
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
