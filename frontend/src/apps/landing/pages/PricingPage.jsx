import React from "react";
import { motion } from "framer-motion";
import Button from "../../../shared/components/ui/Button";

const PricingPage = () => {
  const plans = [
    {
      name: "Free",
      price: "0",
      period: "forever",
      description: "Perfect for individual students to get started",
      features: [
        "Basic AI tutoring",
        "Limited subjects",
        "Progress tracking",
        "Email support",
        "1 quiz per week",
      ],
      buttonText: "Get Started Free",
      popular: false,
    },
    {
      name: "Premium",
      price: "299",
      period: "per month",
      description: "Ideal for serious students and individual learners",
      features: [
        "Advanced AI tutoring",
        "All subjects",
        "Detailed analytics",
        "Priority support",
        "Unlimited quizzes",
        "Offline access",
        "Parent portal access",
      ],
      buttonText: "Start Premium Trial",
      popular: true,
    },
    {
      name: "School",
      price: "Custom",
      period: "per year",
      description: "Complete solution for schools and institutions",
      features: [
        "Everything in Premium",
        "Multiple teacher accounts",
        "School analytics dashboard",
        "Custom content creation",
        "Dedicated support",
        "API access",
        "White-label options",
        "Training & onboarding",
      ],
      buttonText: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Choose the plan that works best for you. All plans include a 14-day
            free trial.
          </motion.p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                className={`bg-white rounded-2xl p-8 shadow-lg relative ${
                  plan.popular ? "ring-2 ring-blue-500 transform scale-105" : ""
                }`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center mb-2">
                    {plan.price === "Custom" ? (
                      <span className="text-4xl font-bold text-gray-900">
                        Custom
                      </span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-gray-900">
                          ETB {plan.price}
                        </span>
                        <span className="text-gray-600 ml-1">
                          /{plan.period}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? "primary" : "outline"}
                  size="large"
                  className="w-full"
                >
                  {plan.buttonText}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our pricing
            </p>
          </motion.div>

          <div className="space-y-8">
            {[
              {
                question: "Can I change plans anytime?",
                answer:
                  "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
              },
              {
                question: "Is there a free trial?",
                answer:
                  "Yes, all paid plans include a 14-day free trial with full access to all features.",
              },
              {
                question: "Do you offer discounts for schools?",
                answer:
                  "Absolutely! We offer significant discounts for educational institutions. Contact our sales team for custom pricing.",
              },
              {
                question: "What payment methods do you accept?",
                answer:
                  "We accept all major credit cards, mobile banking, and bank transfers for Ethiopian customers.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                className="bg-gray-50 rounded-lg p-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
