import React from "react";
import { motion } from "framer-motion";

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Alemayehu Tekle",
      role: "Grade 10 Student",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      content:
        "EduTwin helped me improve my math scores from 65% to 92% in just 3 months. The AI tutor explains concepts in a way I actually understand!",
      rating: 5,
    },
    {
      id: 2,
      name: "Selamawit Gebre",
      role: "Mathematics Teacher",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
      content:
        "The analytics dashboard helps me identify struggling students early. I've reduced my grading time by 70% and can focus more on teaching.",
      rating: 5,
    },
    {
      id: 3,
      name: "Teshome Lemma",
      role: "Parent",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      content:
        "As a working parent, I can easily track my children's progress and get alerts when they need help. It's like having a personal education assistant.",
      rating: 5,
    },
    {
      id: 4,
      name: "Meron Assefa",
      role: "Grade 12 Student",
      image:
        "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150&h=150&fit=crop&crop=face",
      content:
        "The personalized learning paths and gamification make studying actually enjoyable. I've never been this motivated to learn!",
      rating: 5,
    },
  ];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={index < rating ? "text-yellow-400" : "text-gray-300"}
      >
        ★
      </span>
    ));
  };

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
            What Our Users Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of satisfied students, teachers, and parents who are
            transforming education with EduTwin
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                {renderStars(testimonial.rating)}
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trusted by section */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-semibold text-gray-700 mb-8">
            Trusted by schools and institutions across Ethiopia
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            <div className="text-3xl font-bold text-gray-800">
              Addis Ababa University
            </div>
            <div className="text-3xl font-bold text-gray-800">
              Ethio Parents School
            </div>
            <div className="text-3xl font-bold text-gray-800">
              Bright Future Academy
            </div>
            <div className="text-3xl font-bold text-gray-800">
              Unity High School
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
