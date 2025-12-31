"use client";
import { motion } from 'framer-motion';
import { Clock, Calendar, Video, MapPin } from 'lucide-react';

const services = [
  {
    id: 1,
    location: "Sinhala (Colombo)",
    color: "border-green-500",
    bg: "bg-green-50",
    details: [
      { text: "Combined Service (1st Week)", time: "8:30 AM", icon: <Calendar size={16} /> },
      { text: "Sinhala Language Service", time: "8:30 AM", icon: <Clock size={16} /> },
      { text: "Bible Studies (Online)", time: "Wed 7:45 PM", icon: <Video size={16} /> },
    ]
  },
  {
    id: 2,
    location: "Tamil (Colombo)",
    color: "border-blue-500",
    bg: "bg-blue-50",
    details: [
      { text: "Combined Service (1st Week)", time: "8:30 AM", icon: <Calendar size={16} /> },
      { text: "Tamil Language Service", time: "8:30 AM", icon: <Clock size={16} /> },
      { text: "Prayers (Online)", time: "Wed 8:00 PM", icon: <Video size={16} /> },
    ]
  },
  {
    id: 3,
    location: "Tamil (Jaffna)",
    color: "border-red-500",
    bg: "bg-red-50",
    details: [
      { text: "Tamil Language Service", time: "9:00 AM", icon: <Clock size={16} /> },
      { text: "Sunday Prayers", time: "11:00 AM", icon: <Calendar size={16} /> },
    ]
  }
];

export default function ServiceTimes() {
  return (
    <section id="service-time" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">Service Schedules</h2>
          <p className="text-gray-500 mt-2">Join us for worship and fellowship.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ scale: 1.03 }}
              className={`bg-white p-6 rounded-xl shadow-md border-t-4 ${service.color}`}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-center">
                <MapPin className="mr-2 text-gray-400" size={20}/> 
                {service.location}
              </h3>
              
              <div className="space-y-4">
                {service.details.map((item, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${service.bg}`}>
                    <div className="flex items-center text-gray-700 font-medium text-sm">
                      <span className="mr-2 text-gray-500">{item.icon}</span>
                      {item.text}
                    </div>
                    <span className="text-sm font-bold text-gray-900 bg-white px-2 py-1 rounded shadow-sm">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}