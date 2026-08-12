import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login'
import ItemsPage from './pages/Items'

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/items" element={<ItemsPage/>} />
        <Route path="/" element={<Navigate to="/items" replace/>} />
      </Routes>
    </BrowserRouter>
  )
}
