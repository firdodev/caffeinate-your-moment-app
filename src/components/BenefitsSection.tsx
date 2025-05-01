
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const BenefitsSection = () => {
  const benefits = [
    "Skip waiting in lines with mobile ordering",
    "Get personalized recommendations based on your taste",
    "Save favorite orders for quick reordering",
    "Receive special offers and promotions",
    "Track your loyalty points in real-time",
    "Get birthday rewards automatically"
  ];

  return (
    <section id="benefits" className="py-20 bg-coffee-cream/30">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="relative h-[500px] w-full">
              <div className="absolute top-0 left-0 w-3/4 h-3/4 bg-white shadow-lg rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2FmZSUyMHdpZmklMjBsYXB0b3B8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=600&q=60" 
                  alt="Person using café app" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-white shadow-lg rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2FmZSUyMHdpZmklMjBsYXB0b3B8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=600&q=60" 
                  alt="Coffee and mobile app" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-coffee-dark/60 text-white">
                  <div className="text-center p-6">
                    <p className="font-poppins font-bold text-2xl">Earn Rewards</p>
                    <p className="mt-2">Get your 10th coffee free!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold text-coffee-dark mb-6">Why Use Our Digital Café App?</h2>
            <p className="text-gray-600 mb-8">Our app is designed to make your café experience smoother, more personalized, and more rewarding. Say goodbye to waiting in lines and hello to a tailored coffee journey.</p>
            
            <div className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <div className="mt-1 bg-coffee-light rounded-full p-1">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <p className="ml-3 text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
            
            <Button className="bg-coffee-dark hover:bg-coffee-medium text-white px-8">Download Now</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
