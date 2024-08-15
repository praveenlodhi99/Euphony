import Link from "next/link"
// import courseData from "../data/music_courses.json"

import React from 'react'

const FeaturedCourses = () => {
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

                <div></div>

                <div className="mt-20 text-center">
                    <Link className="bg-black font-light text-green-400 border-2 border-green-500 rounded-md py-3 px-4 transition hover:rounded-[50px] duration-300 hover:text-black hover:font-medium hover:border-none hover:bg-green-600" href={"/courses"}>
                        View All Courses
                    </Link>
                </div>

            </div>
        </>
    )
}

export default FeaturedCourses