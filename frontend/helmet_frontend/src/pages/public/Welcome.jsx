import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Welcome = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) navigate('/admin/dashboard');
      else navigate('/supervisor/dashboard');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const features = [
    {
      icon: "🎯",
      title: "AI-Powered Detection",
      desc: "Real-time helmet detection using YOLOv8 deep learning model with 99% accuracy"
    },
    {
      icon: "📹",
      title: "Multi-Camera Support",
      desc: "Monitor multiple construction zones simultaneously with live camera feeds"
    },
    {
      icon: "⚠️",
      title: "Instant Alerts",
      desc: "Immediate sound and visual notifications when safety violations are detected"
    },
    {
      icon: "📊",
      title: "Analytics Dashboard",
      desc: "Comprehensive statistics, compliance tracking, and violation history reports"
    },
    {
      icon: "👥",
      title: "Role-Based Access",
      desc: "Separate dashboards for Admins and Supervisors with secure permissions"
    },
    {
      icon: "🔒",
      title: "Secure & Reliable",
      desc: "Enterprise-grade security with encrypted data and session management"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80"
            alt="Construction Site"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 via-gray-900/80 to-gray-900"></div>
        </div>

        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-20 p-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-white text-xl font-bold">Safety Helmet Detection</span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 text-white border border-white/30 rounded-lg hover:bg-white/10 transition"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}




        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-16">
          <div className="inline-block mb-6 px-4 py-2 bg-orange-500/20 border border-orange-500/50 rounded-full">
            <span className="text-orange-400 text-sm font-medium">🚀 AI Safety Technology</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white block">Safety Helmet Detection</span>
            <span className="text-orange-400 block">Detection System</span>
          </h1>

          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            AI-powered safety monitoring for construction sites. Ensure PPE compliance,
            prevent accidents, and save lives with real-time helmet violation detection.
          </p>
          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">99%</p>
              <p className="text-gray-400 text-sm">Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">&lt;1s</p>
              <p className="text-gray-400 text-sm">Detection Speed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">24/7</p>
              <p className="text-gray-400 text-sm">Monitoring</p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Everything you need to ensure safety compliance across all your construction sites
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-orange-500/50 transition-all duration-300 hover:transform hover:-translate-y-2"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Secure Your Construction Site?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join construction companies using Safety Helmet Detection to protect their workers
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-10 py-4 bg-white text-orange-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition transform"
          >
            Create Free Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-white text-lg font-bold">Safety Helmet detection system</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 Safety Helmet Detection System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;