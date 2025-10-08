import React from 'react'
import Image from 'next/image'
import SignUpForm from '../_Components/SignUp'

function Page() {
  return (
    <div className="bg-[url('/img_back.png')] bg-cover bg-center flex flex-col px-6 py-6">
      
      <div className="flex flex-row text-white text-2xl font-bold p-2">
      <Image width={40} height={40} src="/logo.png" alt='logo'/> 
        <h2 className='px-2 text-xl my-1'>Smartan Fittech</h2> 
      </div>

      <div className="flex-grow ">
        <SignUpForm />
      </div>

      <div className="text-white text-sm text-center">
        © 2025 Your Company. All rights reserved.
      </div>

    </div>
  )
}

export default Page
