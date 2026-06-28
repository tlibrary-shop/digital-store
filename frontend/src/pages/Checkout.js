import React from 'react';
import { Link } from 'react-router-dom';

export default function Checkout() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <div className="card text-center py-12">
        <p className="text-gray-600 text-lg mb-4">
          Checkout dilakukan melalui halaman detail produk
        </p>
        <p className="text-gray-500 mb-6">
          Klik tombol "Beli Sekarang" untuk melanjutkan ke pembayaran
        </p>
        <Link to="/" className="btn btn-primary">
          Pilih Produk
        </Link>
      </div>
    </div>
  );
}
