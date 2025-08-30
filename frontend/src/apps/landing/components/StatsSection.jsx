import React from "react";
import CountUp from "react-countup";
import { motion } from "framer-motion";

const StatsSection = () => {
  const stats = [
    { number: 15000, label: "Active Students", suffix: "+" },
    { number: 95, label: "Improvement Rate", suffix: "%" },
    { number: 500, label: "Expert Teachers", suffix: "+" },
    { number: 24, label: "Support Languages", suffix: "/7" },
  ];

  return (
    <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                <CountUp end={stat.number} duration={3} suffix={stat.suffix} />
              </div>
              <div className="text-purple-200 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
