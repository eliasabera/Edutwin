import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center px-4 py-20">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-left"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            Transform Education with
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              {" "}
              AI-Powered Learning
            </span>
          </h1>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            EduTwin revolutionizes education with personalized AI tutoring,
            real-time progress tracking, and collaborative tools for students,
            teachers, and parents. Experience the future of learning today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
            <Link
              to="/register"
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Start Free Trial
              <span className="text-lg">→</span>
            </Link>
            <Link
              to="/demo"
              className="border-2 border-white text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 hover:bg-white hover:text-purple-600"
            >
              Watch Demo
            </Link>
          </div>
          <div className="flex flex-wrap gap-8 justify-center lg:justify-start">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">10,000+</div>
              <div className="text-blue-200">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">95%</div>
              <div className="text-blue-200">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-blue-200">AI Support</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative"
        >
          <div className="grid grid-cols-2 gap-6 relative">
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <div className="text-3xl mb-4">🎓</div>
              <h4 className="text-white font-semibold mb-2">
                Student Dashboard
              </h4>
              <p className="text-blue-200 text-sm">
                Personalized learning path
              </p>
            </motion.div>

            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mt-12"
            >
              <div className="text-3xl mb-4">👩‍🏫</div>
              <h4 className="text-white font-semibold mb-2">
                Teacher Analytics
              </h4>
              <p className="text-blue-200 text-sm">
                Class performance insights
              </p>
            </motion.div>

            <motion.div
              animate={{ y: [0, -25, 0] }}
              transition={{ duration: 6, repeat: Infinity, delay: 1 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <div className="text-3xl mb-4">👪</div>
              <h4 className="text-white font-semibold mb-2">Parent Portal</h4>
              <p className="text-blue-200 text-sm">Progress monitoring</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
