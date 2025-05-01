
import React from 'react';
import { Button } from '@/components/ui/button';

const DownloadSection = () => {
  return (
    <section id="download" className="py-24 bg-coffee-dark text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-coffee-light/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-coffee-light/10 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-poppins text-4xl md:text-5xl font-bold mb-6">Ready to Transform Your Coffee Experience?</h2>
          <p className="text-lg md:text-xl text-coffee-cream/90 mb-10 max-w-xl mx-auto">
            Download our app today and enjoy personalized ordering, rewards, and convenient table service at your favorite café.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-coffee-dark hover:bg-coffee-cream flex items-center justify-center gap-2 px-8 py-6 text-lg">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5227 19.382C16.9916 20.1461 16.3995 20.7817 15.6726 21.314L14.8824 22H9.07329L8.28308 21.314C7.59553 20.7817 6.96419 20.1461 6.47232 19.382C5.41594 17.9494 4.81982 16.2688 4.81982 14.5C4.81982 12.7312 5.41594 11.0506 6.47232 9.61803C7.52869 8.18546 9.01326 7.14489 10.7046 6.6349V2H13.2954V6.6349C14.9868 7.14489 16.4713 8.18546 17.5277 9.61803C18.5841 11.0506 19.1802 12.7312 19.1802 14.5C19.1802 16.2688 18.5841 17.9494 17.5277 19.382H17.5227Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.5 11H9.5L8 14.5L12 18L16 14.5L14.5 11Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              App Store
            </Button>
            <Button className="bg-white text-coffee-dark hover:bg-coffee-cream flex items-center justify-center gap-2 px-8 py-6 text-lg">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 20.5V3.5C3 2.89249 3.24724 2.36266 3.63128 2.01118C4.01532 1.6597 4.53143 1.5 5 1.5H19C19.4686 1.5 19.9847 1.6597 20.3687 2.01118C20.7528 2.36266 21 2.89249 21 3.5V20.5C21 21.1075 20.7528 21.6373 20.3687 21.9888C19.9847 22.3403 19.4686 22.5 19 22.5H5C4.53143 22.5 4.01532 22.3403 3.63128 21.9888C3.24724 21.6373 3 21.1075 3 20.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 7.5L15 12L9 16.5V7.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Google Play
            </Button>
          </div>
          
          <div className="mt-12 flex justify-center">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-coffee-light">10K+</div>
                <p className="text-coffee-cream/80 text-sm">Active Users</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-coffee-light">50+</div>
                <p className="text-coffee-cream/80 text-sm">Partner Cafés</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-coffee-light">4.8</div>
                <p className="text-coffee-cream/80 text-sm">App Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadSection;
