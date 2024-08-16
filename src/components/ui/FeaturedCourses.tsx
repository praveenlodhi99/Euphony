"use client"

import React from 'react'
import Link from "next/link"
import courseData from "@/data/music_courses.json"
import VanillaTilt from '@/utils/vanilla-tilt'

//making own datatype to datisfy typescript
interface Course {
    id: number,
    title: string,
    slug: string,
    description: string,
    price: number,
    instructor: string,
    isFeatured: boolean,
}

function FeaturedCourses() {
    const featuredCourses = courseData.courses.filter((course: Course) => course.isFeatured)

    return (
        <>
            <div className="border-t-2 border-gray-900 py-16 bg-black">
                <div>
                    <div className="text-center">
                        <h2 className="text-base text-teal-600 font-semibold tracking-wide uppercase">
                            featured courses
                        </h2>
                        <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-slate-200 sm:text-4xl uppercase">
                            learn with best
                        </p>
                    </div>
                </div>
    
                <div className='mt-10 text-black'>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-center py-5 px-16">
                        {featuredCourses.map((course: Course) => (
                            <div key={course.id} className="flex justify-center">
                                <div className='bg-[#8EC5FC] bg-gradient-to-br from-[#85d1d4] to-[#717270] px-5 py-3 rounded-lg text-center shadow-[#b4b4b4] shadow-md opacity-90' >
                                    <p className="text-2xl mb-2 underline font-semibold break-words">{course.title}</p>
                                    <p className="font-light mt-auto transition-all duration-100 ease-in-out break-words">{course.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
    
                <div className="mt-10 text-center">
                    <Link className="bg-black font-light text-green-400 border-2 border-green-500 rounded-md py-3 px-4 transition hover:rounded-[50px] duration-300 hover:text-black hover:font-medium hover:border-none hover:bg-green-600" href={"/courses"}>
                        View All Courses
                    </Link>
                </div>
            </div>
        </>
    )
    
}

export default FeaturedCourses