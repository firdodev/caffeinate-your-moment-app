
import React from 'react';
import { Gift, Coffee, Star, QrCode } from 'lucide-react';

const FeatureSection = () => {
  const features = [
    {
      icon: <Gift className="h-8 w-8 text-coffee-light" />,
      title: "Send Gift Cards",
      description: "Send digital gift cards with personalized messages for birthdays or special occasions, redeemable in-store or online."
    },
    {
      icon: <Coffee className="h-8 w-8 text-coffee-light" />,
      title: "Customize Your Order",
      description: "Design your perfect drink with customization options and get notified when it's ready for pickup or delivery."
    },
    {
      icon: <Star className="h-8 w-8 text-coffee-light" />,
      title: "Loyalty Program",
      description: "Earn points with every purchase and redeem them for free items like coffee or pastries through our rewards system."
    },
    {
      icon: <QrCode className="h-8 w-8 text-coffee-light" />,
      title: "Scan & Order",
      description: "Scan a QR code at your table to view the menu and order directly from your seat—no waiting in line required."
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="font-poppins text-3xl md:text-4xl font-bold text-coffee-dark mb-4">Crafted for Coffee Lovers</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Experience coffee like never before with features designed to enhance every aspect of your café visit.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card group"
              style={{
                animationDelay: `${index * 150}ms`,
                opacity: 0,
              }}
            >
              <div className="bg-coffee-cream/50 rounded-lg p-3 inline-block mb-4 group-hover:bg-coffee-cream transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-poppins font-semibold text-coffee-dark mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
