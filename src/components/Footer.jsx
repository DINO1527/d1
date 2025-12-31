"use client";
import { MapPin, Phone, Mail, Youtube, Facebook, MessageCircle, Send } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 border-t-4 border-blue-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* --- Top Grid Section --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Column 1: Brand & Tagline */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Contact Us</h2>
            <p className="text-blue-400 font-serif italic text-lg">
              “Connect with Grace: Reach Out Today”
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              We are a community dedicated to expository preaching and brotherly fellowship. Join us as we grow in faith.
            </p>
          </div>

          {/* Column 2: Contact Details */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">Get in Touch</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                <span>
                  The Grace Evangelical Church<br/>
                  19, Rajasinghe Road<br/>
                  Wellawatte, Colombo 00600
                </span>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                <a href="mailto:graceevangelicalchurchsrilanka@gmail.com" className="hover:text-white transition">
                  graceevangelicalchurchsrilanka@gmail.com
                </a>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                <a href="tel:+94112503519" className="hover:text-white transition">
                  (+94) 11 250 3519
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Social & Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">Connect</h3>
            <div className="flex space-x-4 mb-6">
              {/* YouTube */}
              <a href="https://www.youtube.com/@TheGraceEvangelicalChurch" target="_blank" className="bg-gray-800 p-2 rounded-full hover:bg-red-600 hover:text-white transition">
                <Youtube size={20} />
              </a>
              {/* Facebook */}
              <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-blue-600 hover:text-white transition">
                <Facebook size={20} />
              </a>
              {/* WhatsApp */}
              <a href="https://wa.me/94112503519" target="_blank" className="bg-gray-800 p-2 rounded-full hover:bg-green-500 hover:text-white transition">
                <MessageCircle size={20} />
              </a>
              {/* Email Icon */}
              <a href="mailto:graceevangelicalchurchsrilanka@gmail.com" className="bg-gray-800 p-2 rounded-full hover:bg-yellow-500 hover:text-white transition">
                <Send size={20} />
              </a>
            </div>
            
            <div className="border-t border-gray-800 pt-4">
              <h4 className="text-sm font-bold text-white mb-2">About This Site</h4>
              <p className="text-xs text-gray-500">
                This is the official website for The Grace Evangelical Church Sri Lanka. Built to serve our members and visitors.
              </p>
            </div>
          </div>

          {/* Column 4: Find Us (Map Embed) */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">Find Us</h3>
            <div className="w-full h-48 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-lg">
              {/* Google Maps Embed - Centered on 19 Rajasinghe Rd */}
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.982245789123!2d79.860!3d6.874!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae25bbcb5555555%3A0x123456789!2s19%20Rajasinghe%20Rd%2C%20Colombo!5e0!3m2!1sen!2slk!4v1620000000000!5m2!1sen!2slk" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy"
                title="Church Location"
              ></iframe>
            </div>
            <a 
              href="https://goo.gl/maps/YOUR_REAL_MAP_LINK" 
              target="_blank"
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 block text-center"
            >
              View Larger Map
            </a>
          </div>
        </div>

        {/* --- Bottom Bar --- */}
        <div className="border-t border-gray-800 pt-8 text-center md:flex md:justify-between md:text-left">
          <p className="text-sm text-gray-500">
            &copy; 2025 Grace Evangelical Church. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 space-x-6 text-sm">
            <a href="#" className="text-gray-500 hover:text-white">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-white">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}