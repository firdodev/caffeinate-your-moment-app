
import React, { Suspense, lazy } from 'react';
import { Button } from '@/components/ui/button';
import { Coffee, Star } from 'lucide-react';

// Use lazy imports for the 3D components to ensure they only load on the client
const CoffeeScene = lazy(() => import('@/components/3d/CoffeeScene'));
const Phone3D = lazy(() => import('@/components/3d/Phone3D'));

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-coffee-cream to-white py-16 lg:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(#D4A76A_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
      <div className="container relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col space-y-6 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-coffee-cream rounded-full text-coffee-dark text-sm font-medium">
              <Coffee className="h-4 w-4 mr-2" />
              Reimagining your café experience
            </div>
            <h1 className="font-poppins text-4xl md:text-5xl lg:text-6xl font-bold text-coffee-dark leading-tight">
              Transform Your <br />
              <span className="text-coffee-light">Coffee Experience</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-lg">
              Personalize your orders, earn rewards, gift to friends, and order from your table with just a scan - all in one digital café companion.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button className="bg-coffee-dark hover:bg-coffee-medium text-white px-8 py-6 text-lg">
                Get the App
              </Button>
              <Button variant="outline" className="border-coffee-dark text-coffee-dark hover:bg-coffee-cream px-8 py-6 text-lg">
                Learn More
              </Button>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-coffee-dark flex items-center justify-center text-white text-xs">JD</div>
                <div className="w-8 h-8 rounded-full bg-coffee-medium flex items-center justify-center text-white text-xs">KL</div>
                <div className="w-8 h-8 rounded-full bg-coffee-light flex items-center justify-center text-white text-xs">MR</div>
              </div>
              <div className="flex items-center">
                <div className="flex">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                </div>
                <span className="ml-2 text-sm text-gray-600">From 500+ happy customers</span>
              </div>
            </div>
          </div>
          
          <div className="relative lg:h-[600px] animate-slide-up">
            <Suspense fallback={<div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-coffee-dark"></div>
            </div>}>
              <div className="relative">
                <CoffeeScene />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-full max-w-[300px] h-[600px]">
                  <Phone3D />
                </div>
              </div>
            </Suspense>
            <div className="absolute top-10 right-2 lg:-right-16 w-32 h-32 bg-coffee-light/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 left-2 lg:-left-16 w-40 h-40 bg-coffee-cream rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
