"use client";
import { useState } from "react";
import { Mail, MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);

  // WhatsApp number + message
  const phoneNumber = "94772106856";
  const message = encodeURIComponent("I want to connect with you");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  // Email configuration
  const email = "graceevangelicalchurchsrilanka@gmail.com";
  const emailUrl = `mailto:${email}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* Buttons Animation */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Email Button */}
            <motion.a
              href={emailUrl}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ delay: 0.05 }}
              className="flex items-center justify-center w-12 h-12 bg-red-500 rounded-full shadow-lg text-white hover:bg-red-600 transition-colors"
              title="Send Email"
            >
              <Mail size={20} />
            </motion.a>

            {/* WhatsApp Button */}
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Chat on WhatsApp"
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full shadow-lg text-white hover:bg-green-600 transition-colors"
            >
              {/* OFFICIAL WHATSAPP SVG ICON */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={22}
                height={22}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.52 3.48A11.8 11.8 0 0012 0C5.37 0 0 5.37 0 12a11.9 11.9 0 001.63 6L0 24l6.29-1.65A11.92 11.92 0 0012 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22a10 10 0 01-5.17-1.43l-.37-.21-3.74.98.99-3.7-.24-.38A9.99 9.99 0 1122 12c0 5.51-4.49 10-10 10zm5.41-7.62c-.29-.15-1.76-.87-2.03-.98-.27-.1-.47-.15-.67.15-.2.29-.77.96-.95 1.17-.17.2-.35.22-.65.07-.29-.15-1.25-.46-2.38-1.47-1.22-1.08-1.51-1.87-1.68-2.17-.17-.29-.02-.45.13-.6.14-.13.29-.35.43-.52.15-.17.2-.29.29-.48.1-.19.05-.37-.02-.52-.07-.15-.67-1.6-.92-2.2-.24-.6-.49-.51-.67-.52h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.23 3.08.15.2 2.09 3.2 5.06 4.39.71.31 1.26.49 1.66.63.71.23 1.36.19 1.87.12a2.8 2.8 0 001.99-1.44c.2-.7.2-1.29.15-1.42-.07-.13-.27-.2-.57-.35z" />
              </svg>
            </motion.a>
          </>
        )}
      </AnimatePresence>

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 ${
          isOpen ? "bg-gray-700 rotate-90" : "bg-blue-900 hover:scale-110"
        }`}
      >
        {isOpen ? (
          <X size={28} className="text-white" />
        ) : (
          <MessageSquare size={28} className="text-white" />
        )}
      </button>
    </div>
  );
}
