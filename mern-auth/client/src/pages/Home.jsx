import React from 'react';
import Navbar from '../components/Navbar';
import Header from '../components/Header';
import ProductList from '../components/products';

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[url('/bg_img.png')] bg-cover bg-center">
      <Navbar />
      <Header />
      <ProductList />
    </div>
  );
};

export default Home;
