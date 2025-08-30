import React from "react";
import { motion } from "framer-motion";

const FeaturesGrid = () => {
  const features = [
    {
      icon: "🤖",
      title: "AI Personal Tutor",
      description:
        "24/7 intelligent tutoring system that adapts to each student's learning style",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: "📊",
      title: "Real-time Analytics",
      description:
        "Comprehensive dashboards showing progress, strengths, and areas for improvement",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: "🎯",
      title: "Smart Assessments",
      description:
        "Adaptive quizzes that adjust difficulty based on student performance",
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: "👨‍👩‍👧",
      title: "Family Portal",
      description:
        "Keep parents informed with detailed progress reports and recommendations",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: "🌍",
      title: "Multi-language",
      description: "Support for Amharic, Afaan Oromo, Tigrigna, and English",
      color: "from-pink-500 to-rose-500",
    },
    {
      icon: "📱",
      title: "Offline Access",
      description: "Learn anywhere, even without internet connection",
      color: "from-cyan-500 to-blue-500",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why EduTwin Stands Out
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive educational ecosystem powered by cutting-edge AI
            technology
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-2xl mb-6`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
