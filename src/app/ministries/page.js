"use client";
import Navbar from '@/components/Navbar'; // Adjust path if needed
import { motion } from 'framer-motion';
import { Calendar, Clock, Video, Users, Heart, BookOpen } from 'lucide-react';
import Footer from '@/components/Footer';
// --- DATA STRUCTURE (Easy to update text here) ---
const sections = [
  {
    title: "On Sundays",
    subtitle: "Expect On Sundays after Service",
    items: [
      {
        id: 1,
        title: "Sunday School",
        time: "11:15 AM",
        desc: "We believe that children need to grow in the knowledge and love of God too. As such, we are committed to educating our children biblically to provide them with a strong biblical foundation for life. To this end we use the 'Go-Teach' Sunday School curriculum.",
        icon: <BookOpen className="text-orange-500" />,
        color: "bg-orange-50",
        imagePlaceholder: "/sundayschool.jpg" 
      },
      {
        id: 2,
        title: "Youth Fellowship",
        time: "11:15 AM (Under the Mango Tree)",
        desc: "A time for young people to connect, share, and grow in their faith through discussions, prayer, and activities.",
        icon: <Users className="text-blue-500" />,
        color: "bg-blue-50",
        imagePlaceholder: "/youth.jpg"
      }
    ]
  },
  {
    title: "On Weekdays",
    subtitle: "Keeping in touch throughout the week",
    items: [
      {
        id: 3,
        title: "Tamil Bible Study",
        time: "Wednesdays @ 8:00 PM (Zoom)",
        desc: "Our Tamil Congregation meets weekly via Zoom to study the Bible in depth.",
        icon: <Video className="text-purple-500" />,
        color: "bg-purple-50",
        imagePlaceholder: "/zoom.png"
      },
      {
        id: 4,
        title: "Sinhala Bible Study & Prayers",
        time: "Wed 7:30 PM & Thu 7:45 PM",
        desc: "Sinhala Congregation meets Wednesday for Bible Study and Thursday for Prayer.",
        icon: <Clock className="text-green-500" />,
        color: "bg-green-50",
        imagePlaceholder: "Prayer Meeting"
      }
    ]
  },
  {
    title: "Monthly Gatherings",
    subtitle: "Building Community",
    items: [
      {
        id: 5,
        title: "Women's Fellowship",
        time: "Monthly (Rotational Homes)",
        desc: "Each month a special gathering of sisterhood and support takes place at different volunteer’s homes.",
        icon: <Heart className="text-pink-500" />,
        color: "bg-pink-50",
        imagePlaceholder: "Women's Fellowship"
      },
      {
        id: 6,
        title: "Men's Fellowship",
        time: "Monthly (Rotational Homes)",
        desc: "Brothers in Christ gather for spiritual growth, encouragement, and fellowship, building one another up in faith.",
        icon: <Users className="text-indigo-500" />,
        color: "bg-indigo-50",
        imagePlaceholder: "Men's Group"
      }
    ]
  }
];

export default function MinistriesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <div className="relative h-[95vh] flex items-center justify-center bg-gray-900 overflow-hidden">
        {/* Abstract Background Animation */}
        <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
                <div className="absolute top-1/3 right-1/8 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
                <div className="absolute bottom-1/4 left-1/10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
            </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-4"
        >
          <span className="text-blue-400 font-bold tracking-widest uppercase mb-2 block">Connect & Grow</span>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Our Ministries</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            From the youngest child to the oldest adult, there is a place for you to belong and serve.
          </p>
        </motion.div>
      </div>

      {/* --- CONTENT SECTIONS --- */}
      <div className="max-w-7xl mx-auto px-4 py-20 space-y-32">
        
        {sections.map((section, sIndex) => (
          <div key={sIndex} className="relative">
            {/* Section Header */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="mb-12 border-l-4 border-blue-900 pl-6"
            >
              <h2 className="text-4xl font-bold text-gray-900">{section.title}</h2>
              <p className="text-xl text-gray-500 mt-2">{section.subtitle}</p>
            </motion.div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {section.items.map((item, iIndex) => (
                <MinistryCard key={item.id} item={item} index={iIndex} />
              ))}
            </div>
          </div>
        ))}

      </div>
      <Footer />
    </div>
  );
}

// --- SUB-COMPONENT: 3D CARD ---
function MinistryCard({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      whileHover={{ y: -10, scale: 1.02 }} // The 3D Lift Effect
      className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
    >
      {/* Image Half */}
      <div className="h-64 bg-gray-200 relative overflow-hidden">
        <img src={item.imagePlaceholder} alt={item.title} className="w-full h-full object-cover" />
        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
      </div>

      {/* Content Half */}
      <div className="p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gray-50 rounded-full shadow-sm">
            {item.icon}
          </div>
          <span className="text-sm font-bold text-blue-900 uppercase tracking-wide">{item.time}</span>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-blue-700 transition-colors">
          {item.title}
        </h3>
        
        <p className="text-gray-600 leading-relaxed">
          {item.desc}
        </p>
      </div>
    </motion.div>
  );
}