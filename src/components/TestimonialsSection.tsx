
import React from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Regular Customer",
      image: "https://randomuser.me/api/portraits/women/12.jpg",
      content: "I love being able to order my coffee before I arrive and skip the line. The loyalty program is great too - I've earned so many free coffees!"
    },
    {
      name: "Michael Chen",
      role: "Coffee Enthusiast",
      image: "https://randomuser.me/api/portraits/men/22.jpg",
      content: "The custom ordering feature remembers my complex coffee order perfectly every time. And the QR code table ordering is so convenient!"
    },
    {
      name: "Emma Rodriguez",
      role: "Busy Professional",
      image: "https://randomuser.me/api/portraits/women/33.jpg",
      content: "I sent a gift card to my friend for her birthday through the app. It was so easy, and she loved the personalized message feature."
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="font-poppins text-3xl md:text-4xl font-bold text-coffee-dark mb-4">What Our Customers Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Hear from people who have transformed their coffee experience with our app.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <Card key={index} className="border border-coffee-cream hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
                <p className="mb-6 text-gray-600 italic">"{item.content}"</p>
                <div className="flex items-center">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-full" />
                  <div className="ml-3">
                    <h4 className="font-semibold text-coffee-dark">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
