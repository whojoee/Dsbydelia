const midtransClient = require('midtrans-client');
const { createClient } = require('@supabase/supabase-js');

// === Setup Koneksi ke Supabase ===
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // Hanya izinkan metode POST karena kita mengirim data keranjang belanja
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Inisialisasi Snap Midtrans
    let snap = new midtransClient.Snap({
      isProduction: false, // Kita set false karena masih pakai mode Sandbox (Testing)
      serverKey: process.env.MIDTRANS_SERVER_KEY // Ini brankas rahasia buat Server Key lu
    });

    // Menangkap data yang dikirim dari cart.js (frontend)
    const { order_id, gross_amount, items, customer_details } = req.body;

    // Menyusun parameter sesuai standar Midtrans
    let parameter = {
      transaction_details: {
        order_id: order_id,
        gross_amount: gross_amount
      },
      item_details: items,
      customer_details: customer_details
    };

    // Meminta token pembayaran dari Midtrans
    const transaction = await snap.createTransaction(parameter);

    // === Simpan Data Pesanan ke Supabase ===
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          order_id: order_id,
          total_price: gross_amount,
          items: items,
          payment_status: 'pending' // Status awal sebelum dibayar
        }
      ]);

    // Kalau ada error saat nyimpen ke database, kita catat di log Vercel
    if (error) {
      console.error("Gagal simpan ke Supabase:", error.message);
    }

    // Mengirim token kembali ke frontend untuk nampilin pop-up pembayaran
    return res.status(200).json({ token: transaction.token });

  } catch (error) {
    console.error("Midtrans/Supabase Error:", error);
    return res.status(500).json({ message: 'Gagal memproses pembayaran' });
  }
};