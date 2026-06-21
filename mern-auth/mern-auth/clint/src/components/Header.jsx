import React, { useState, useEffect, useContext } from 'react';
import { AppContent } from '../context/AppContext';
import { assets } from '../assets/assets';
import pastry1 from "../assets/pastry8.jpg"; 
import pastry2 from "../assets/pastry9.jpg"; 
import pastry3 from "../assets/pastry6.jpg";

const images = [pastry1, pastry2, pastry3];

const Header = () => {
  const { userData } = useContext(AppContent);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    /* mt-20 clears the fixed navbar height */
    <div className="relative w-full h-[80vh] sm:h-[85vh] overflow-hidden bg-slate-900 mt-20">
      
      {/* Background Slideshow with Ken Burns Effect */}
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <img 
            src={img} 
            alt="Artisanal Pastry" 
            className={`w-full h-full object-cover transition-transform duration-[6000ms] ease-out ${
              index === current ? "scale-110" : "scale-100"
            }`} 
          />
        </div>
      ))}

      {/* Cinematic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent flex flex-col items-start justify-center px-6 md:px-16 lg:px-24">
        
        {/* Personalized Welcome Badge */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full mb-6 animate-in fade-in slide-in-from-left-4 duration-1000">
          <span className="text-white text-xs md:text-sm font-bold tracking-[0.1em] uppercase">
            {userData ? `Welcome back, ${userData.name}` : "The Art of Baking"}
          </span>
          <img src={assets.hand_wave} className="w-4 h-4" alt="" />
        </div>

        {/* Main Heading */}
        <h1 className="text-white text-5xl md:text-8xl font-black tracking-tighter mb-6 leading-tight max-w-3xl drop-shadow-2xl">
          Frosty <span className="text-indigo-400">Pastry</span>
        </h1>

        {/* Subtext */}
        <p className="text-gray-100 text-lg md:text-xl max-w-lg font-medium leading-relaxed mb-10 opacity-90">
          Indulge in handcrafted treats where every bite tells a story of premium organic ingredients and timeless tradition.
        </p>

        {/* Call to Action Group */}
        <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
          <button className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-lg font-bold shadow-2xl shadow-indigo-500/20 hover:bg-white hover:text-indigo-600 transition-all duration-300 active:scale-95">
            Explore Menu
          </button>
          <button className="px-10 py-4 border-2 border-white/50 text-white backdrop-blur-md rounded-2xl text-lg font-bold hover:bg-white/10 transition-all active:scale-95">
            Our Story
          </button>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
        {images.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-500 ${current === i ? "w-8 bg-indigo-400" : "w-2 bg-white/30"}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Header;