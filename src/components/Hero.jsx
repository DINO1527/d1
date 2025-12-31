"use client";
import { motion } from 'framer-motion';

export default function Hero() {

  // Function to handle smooth scrolling
  const scrollToService = () => {
    const section = document.getElementById('service-time');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative h-screen flex items-center justify-center bg-[url('/bgm.jpg')] bg-cover bg-center">
      {/* Dark Overlay for readability */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      <div className="relative z-10 text-center px-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-bold text-white mb-4"
        >
          Welcome to The Grace Evangelical Church
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl text-gray-200 mb-8"
        >
          A place of worship, community, and growth.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col md:flex-row gap-4 justify-center"
        >
          <button onClick={() => window.location.href = '/about'} className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition">
             About Us
          </button>
          
          {/* Added onClick event to trigger the scroll */}
          <button 
            onClick={scrollToService}
            className="border-2 border-white text-white px-8 py-3 rounded-full hover:bg-white hover:text-black transition"
          >
            Join Us This Sunday
          </button>
        </motion.div>
      </div>
    </section>
  );
}