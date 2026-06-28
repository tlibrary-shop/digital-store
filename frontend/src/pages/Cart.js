import React from 'react';
import { Link } from 'react-router-dom';

export default function Cart() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">Keranjang Belanja</h1>
      
      <div className="card text-center py-12">
        <p className="text-gray-600 text-lg mb-4">
          Fitur keranjang sedang dalam pengembangan
        </p>
        <p className="text-gray-500 mb-6">
          Untuk sekarang, Anda bisa membeli produk secara langsung dari halaman detail produk
        </p>
        <Link to="/" className="btn btn-primary">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
