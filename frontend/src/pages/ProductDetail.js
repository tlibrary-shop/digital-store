import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await client.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      toast.error('Produk tidak ditemukan');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu');
      navigate('/login');
      return;
    }

    setPurchasing(true);
    try {
      const response = await client.post('/orders', {
        product_id: id
      });

      // Redirect ke payment gateway Midtrans
      if (response.data.payment_link) {
        window.location.href = response.data.payment_link;
      } else {
        toast.error('Gagal membuat pesanan');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Gagal membuat pesanan');
      console.error(error);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <p className="text-gray-600">Memuat produk...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Produk tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="card">
          {product.cover_image && (
            <img
              src={product.cover_image}
              alt={product.title}
              className="w-full h-96 object-cover rounded-lg"
            />
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
          <p className="text-gray-600 mb-4">{product.category}</p>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-gray-600 text-sm">Harga</p>
            <p className="text-4xl font-bold text-blue-600">
              Rp {product.price.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3">Deskripsi</h3>
            <p className="text-gray-700 leading-relaxed">
              {product.description || 'Tidak ada deskripsi'}
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <p className="text-green-800 flex items-center">
              <span className="text-2xl mr-2">✓</span>
              File akan dikirim otomatis setelah pembayaran dikonfirmasi
            </p>
          </div>

          <button
            onClick={handleBuy}
            disabled={purchasing}
            className="w-full btn btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {purchasing ? 'Memproses...' : 'Beli Sekarang'}
          </button>

          <p className="text-center text-gray-600 text-sm mt-4">
            Pembayaran aman melalui Midtrans
          </p>
        </div>
      </div>
    </div>
  );
}
