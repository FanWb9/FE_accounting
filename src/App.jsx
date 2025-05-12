import { useState } from 'react'
import { Routes, Route } from "react-router-dom";

import './App.css'
import Bank from './Bank/Bank_keluar';

function App() {
 

  return (
    <>
      <Routes>
        <Route path="/" element={<Bank />} />
        {/* Add other routes here */}
      </Routes>
    </>
  )
}

export default App
