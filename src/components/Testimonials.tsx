"use client";

import React, { useEffect, useRef, useState } from 'react';
import VanillaTilt from 'vanilla-tilt';
import data from '@/data/Testimonials.json';
import  { motion } from 'framer-motion'

interface Testimonial {
  id: number;
  text: string;
  imageSrc: string;
  name: string;
  username: string;
}

const TestimonialsComponent = () => {
  const { testimonials } = data;
  const tiltRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [visibleTestimonials, setVisibleTestimonials] = useState<Testimonial[]>(testimonials);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setVisibleTestimonials(testimonials.slice(0, 3));
      } else if (window.innerWidth <= 980) {
        setVisibleTestimonials(testimonials.slice(3, 9));
      } else {
        setVisibleTestimonials(testimonials);
      }
    };

    handleResize(); // Set initial value

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [testimonials]);

  useEffect(() => {
    tiltRefs.current.forEach((el) => {
      if (el) {
        VanillaTilt.init(el, {
          max: 15,
          speed: 300,
          glare: true,
          scale: 1.1,
          "max-glare": 0.5,
        });
      }
    });

    // Clean up
    return () => {
      tiltRefs.current.forEach((el) => el?.vanillaTilt?.destroy());
    };
  }, []);

  return (
    <div className='text-slate-200 bg-black px-4 py-16 justify-center items-center border-t-2 border-gray-900'>
      <div className="text-center">
        <h2 className="text-base text-teal-600 font-semibold tracking-wide uppercase">
          Testimonials
        </h2>
        <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-slate-200 sm:text-4xl uppercase">
          Learn with the best
        </p>
      </div>

      <div className='mt-10'>
        <div className="flex flex-wrap justify-center [mask-image:linear-gradient(to_bottom,transparent,white_25%,white_70%,transparent)]">
          {visibleTestimonials.map((testimonial: Testimonial, index: number) => (
            <div key={testimonial.id} className="flex">
              <div
                className='card border-none cursor-pointer shadow-md flex flex-col '
                ref={(el) => (tiltRefs.current[index] = el)}
              >
                <p className="text-slate-100 font-extralight text-[13px] transition-all duration-100 ease-in-out break-words ">
                  {testimonial.text}
                </p>
                <div className=' profile mt-5 flex gap-3 items-center '>
                  <img src={testimonial.imageSrc} alt={testimonial.name} className="p-0 rounded-full w-11 h-11 items-start justify-start" />
                  <div>
                    <p className="font-semibold text-[15px]">{testimonial.name}</p>
                    <p className="text-[10px] text-gray-500">{testimonial.username}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TestimonialsComponent;
