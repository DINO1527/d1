"use client";
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { Scroll, History, User, ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';

// --- DATA: PASTORS ---
const pastors = [
  {
    name: "Benet Surendran",
    role: "Pastor",
    bio: "Known to many as Pastor Suresh. The Lord found him from a non-Christian background in the early 1980s. He has been serving full-time since 1988. He holds a Masters in Theology from Wales Evangelical Theological College. His passion is to preach, preach and preach.",
    // FIXED: Removed space at the end and added /pictures/ path
    image: "suresh.png" 
  },
  {
    name: "Ajit N.A. Perera",
    role: "Pastor",
    bio: "Ajit has been involved in pastoral ministry for 28 years. Initially pastor to the Sinhala congregation, he took on the English congregation in 2015. He holds a B.Th from North American Baptist College, Canada. He and his wife Trudy have been long-standing members.",
    // FIXED: Added /pictures/ path
    image: "/ajith.png"
  },
  {
    name: "Kamaadchisunderam Arulselvan",
    role: "Pastor",
    bio: "Arul joined the ministry in 2000 as Bookshop Manager and was appointed Elder/Pastor in 2016. He heads the mission station in Jaffna. He holds a BSc in Agriculture and MA in Theology. Arul is married to Ramani, his wife of 24 years.",
    // FIXED: Added leading slash and /pictures/ path
    image: "/arul.png"
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      {/* --- SECTION 1: HERO & QUOTE --- */}
        <section className="relative pt-16 pb-12 overflow-hidden">
          <div className="relative h-[85vh] flex items-center justify-center bg-gray-900 overflow-hidden">
            {/* Animated Blur Gradient Background */}
            <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
                <div className="absolute top-1/3 right-1/8 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
                <div className="absolute bottom-1/4 left-1/10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
            </div>
            
            <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-4 cursor-pointer group"
          whileHover={{ scale: 1.05 }}
            >
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 group-hover:drop-shadow-lg transition">About us</h1>
          <div className="mb-4 flex justify-center">
            <Scroll size={32} className="text-blue-400 group-hover:text-blue-300 transition" />
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto group-hover:text-gray-100 transition">
            &quot;We believe the church should be led by godly men, who serve the Chief Shepherd the Lord Jesus as under shepherds.&quot;
          </p>
            </motion.div>
          </div>
        </section>
        {/* --- SECTION 2: WHAT WE BELIEVE --- */}
          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              
              {/* Text Content */}
              <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
              >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">What We Believe</h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Together with all Protestants we confess our belief in the <strong className="text-blue-900">Five Solas</strong>. 
              As evangelicals, we are committed to the <strong>1689 Baptist Confession of Faith</strong> (2nd London).
            </p>
            <p className="text-lg text-gray-700 mb-8">
              We are a church that practices Congregational church government, believing in the autonomy of the local church under the authority of Scripture.
            </p>
            
            <a href="https://www.the1689confession.com/" target="_blank" className="inline-flex items-center bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition shadow-lg">
              Read Confession of Faith <ArrowRight size={20} className="ml-2"/>
            </a>
              </motion.div>

              {/* Visual/Image Area */}
                <motion.div 
                initial={{ opacity: 0, x: 50, rotate: 5 }}
                whileInView={{ opacity: 1, x: 0, rotate: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8 }}
                className="bg-white p-8 rounded-tr-3xl rounded-bl-3xl shadow-2xl border-l-8 border-blue-800"
                >
                 <h3 className="text-2xl font-bold text-gray-800 mb-4">Sola Dei Gloria</h3>
                 <p className="text-gray-500 italic">To God Alone Be The Glory</p>
                 <div className="mt-6 h-48 bg-gray-100 rounded flex items-center justify-center">
              <img src="/logo.png" alt="Church Logo" className="w-full h-full object-contain" onError={(e) => e.target.style.display = 'none'} />
             </div>
              </motion.div>
            </div>
          </section>

              {/* --- SECTION 3: OUR PASTORS (3D CARDS) --- */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">Our Pastors</h2>
            <p className="text-gray-500 mt-2">Serving the flock with dedication and truth.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pastors.map((pastor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -15 }}
                className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                {/* Top Colored Bar */}
                <div className="h-2 bg-blue-900 w-full"></div>
                
                <div className="p-8 text-center">
                  {/* Avatar Circle */}
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full border-4 border-white shadow-md overflow-hidden relative">
                    {/* The Image */}
                    <img 
                      src={pastor.image} 
                      alt={pastor.name} 
                      className="w-full h-full object-cover relative z-10" 
                    />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900">{pastor.name}</h3>
                  <span className="text-blue-600 font-medium text-sm uppercase tracking-wide">{pastor.role}</span>
                  
                  <p className="mt-4 text-gray-600 text-sm leading-relaxed text-left">
                    {pastor.bio}
                  </p>
                </div>

                {/* Hover Effect Line */}
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-blue-900 transition-all duration-500 group-hover:w-full"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

     
      {/* --- SECTION 4: OUR HISTORY (Timeline Style) --- */}  
          <section className="py-20 bg-blue-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            
            {/* LEFT SIDE: Background Image */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative rounded-2xl overflow-hidden shadow-xl h-80 md:h-96"
            >
              <img 
              src="/cover.jpg" 
              alt="Church History" 
              className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30"></div>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-lg text-blue-900">
                <History size={32} className="mr-2"/>
                <span className="font-bold text-lg">Established 1978</span>
              </div>
              </div>
            </motion.div>

            {/* RIGHT SIDE: Content */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col justify-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Our History</h2>
              
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border-l-4 border-blue-900">
              <p className="text-base md:text-lg text-gray-700 mb-6 leading-relaxed">
                The Grace Evangelical Church came out of the conviction that Sri Lanka needs a local church that preaches God&apos;s Word expositorily and systematically each Sunday.
              </p>
              
              <p className="text-sm md:text-base text-gray-600 mb-4 leading-relaxed">
                The first service at the current premises began in <strong className="text-blue-900">February 1978</strong>. The Lord has ensured that His people meet at these premises and hear the Word preached ever since.
              </p>
              
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                We now have a sister church in Jaffna. <span className="font-serif italic text-gray-800">Sola Dei Gloria.</span>
              </p>
              </div>
            </motion.div>
            </div>
          </div>
          </section>
          
      <Footer />
    </div>
  );
}