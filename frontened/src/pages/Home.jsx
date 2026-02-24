import React from 'react'
import Sidebar from '../components/Sidebar'
import Messagearea from '../components/Messagearea'
import useGetMessage from '../customHooks/getMessage'  

function Home() {
  useGetMessage();  
  
  return (
    <div className='flex h-screen'>
      <Sidebar />
      <Messagearea />
    </div>
  )
}

export default Home
