"use client";
import { motion } from 'framer-motion';
import { BookOpen, UserCheck, Youtube } from 'lucide-react';

const features = [
  {
    title: "Book Ministry",
    desc: "Browse our spiritual collection. Check availability and contact us to purchase.",
    icon: <BookOpen size={40} className="text-blue-600" />,
    link: "/books"
  },
  {
    title: "Playlist",
    desc: "Watch our latest services and worship sessions directly on our site.",
    icon: <Youtube size={40} className="text-red-600" />,
    link: "/blogs?tab=videos&type=All",
  },
  {
    title: "Blogs & Resources",
    desc: "Read inspiring articles and access resources to deepen your faith journey.",
    icon: <UserCheck size={40} className="text-blue-600" />,
    link: "/blogs"
  }
];

export default function Features() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-bold mb-2 text-gray-800">{feature.title}</h3>
              <p className="text-gray-600 mb-4">{feature.desc}</p>
              <a href={feature.link} className="text-blue-600 font-semibold hover:underline">
                Learn More &rarr;
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}