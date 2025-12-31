"use client";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HomeAbout() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-6">About Us</h2>
          <div className="w-20 h-1 bg-yellow-500 mx-auto mb-8 rounded-full"></div>
          
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
            "We believe the church should be led by godly men, who serve the Chief Shepherd the Lord Jesus as under shepherds. We preach Christ, and Christ only. Therefore, a significant part of the service will be dedicated for the ministry of God’s word."
          </p>

          <Link href="/about">
            <button className="group inline-flex items-center bg-blue-900 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-800 transition shadow-lg">
              Learn More 
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}