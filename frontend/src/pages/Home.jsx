import React from 'react'
import Sidebar from '../components/Sidebar'
import Messagearea from '../components/Messagearea'
import useGetMessage from '../customHooks/getMessage'  
import { useSelector } from 'react-redux';

function Home({ socket }) {
  useGetMessage();  
  const { selectedUser } = useSelector((state) => state.user);
  
  return (
    <div className='chat-shell'>
      <Sidebar socket={socket} />
      <Messagearea key={selectedUser?._id || 'empty'} socket={socket} />
    </div>
  )
}

export default Home
