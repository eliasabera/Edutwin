import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Education?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Join thousands of students, teachers, and parents already
            experiencing the future of learning
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/register"
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
            >
              Start Your Journey Today
            </Link>
            <Link
              to="/contact"
              className="border-2 border-gray-300 text-gray-300 hover:border-white hover:text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 text-lg"
            >
              Schedule a Demo
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Free 14-day trial
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Setup in 5 minutes
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
