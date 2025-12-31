import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import HomeAbout from '@/components/HomeAbout';      // New Component
import Features from '@/components/Features';
import ServiceTimes from '@/components/ServiceTimes'; // New Component
import YoutubeSection from '@/components/YoutubeSection';
import Footer from '@/components/Footer';
import FloatingContact from '@/components/Floating Contact';
import './globals.css';

export const metadata = {
  title: 'The Grace Evangelical Church',
  description: 'Official website of Grace Evangelical Church, Sri Lanka',
};

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <Navbar />
      
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Service Schedules */}
      <ServiceTimes />
      
      {/* 3. About Short Section */}
      <HomeAbout />
      
      {/* 4. Features (Book Store, Login, etc.) */}
      <Features />
      
      {/* 5. YouTube Playlist */}
      <YoutubeSection />
      <FloatingContact />
      {/* 6. Footer */}
      {/* Note: If you added Footer to layout.js, remove this line to avoid double footers */}
      <Footer />
      
    </main>
  );
}