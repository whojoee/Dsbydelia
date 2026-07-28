import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Pastikan cuma nerima metode POST dari Midtrans
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const midtransData = req.body;
        
        // Midtrans ngirim status 'settlement' atau 'capture' kalau pembayaran berhasil lunas
        if (midtransData.transaction_status === 'settlement' || midtransData.transaction_status === 'capture') {
            const orderId = midtransData.order_id;

            // 1. Koneksi ke Supabase buat nyari data pelanggan
            const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
            
            const { data: orderData, error } = await supabase
                .from('orders')
                .select('customer_name, customer_phone, total_price')
                .eq('order_id', orderId)
                .single();

            if (error) {
                console.error("Gagal cari data order di Supabase:", error);
                return res.status(500).json({ error: 'Database error' });
            }

            if (orderData && orderData.customer_phone) {
                // Format angka harga biar rapi
                const formattedPrice = new Intl.NumberFormat('id-ID', {
                    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
                }).format(orderData.total_price);

                // 2. Siapkan isi pesan WA
                const pesanWA = `Halo Kak ${orderData.customer_name},\n\nPembayaran untuk pesanan *${orderId}* senilai *${formattedPrice}* sudah kami terima.\n\nPesanan Kakak sedang kami proses dan segera dipacking. Terima kasih sudah berbelanja di DS by Delia Septianti!`;

                // 3. Tembak API Fonnte buat kirim WA
                const fonnteResponse = await fetch('https://api.fonnte.com/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': process.env.FONNTE_TOKEN // Rahasia token Fonnte
                    },
                    body: new URLSearchParams({
                        target: orderData.customer_phone,
                        message: pesanWA,
                        countryCode: '62' // Standar kode negara Indonesia
                    })
                });

                const fonnteResult = await fonnteResponse.json();
                console.log("Status Kirim WA:", fonnteResult);
            }
        }

        // Kasih tau Midtrans kalau kita udah nerima laporannya dengan baik
        res.status(200).json({ message: 'Webhook berhasil diproses' });
    } catch (error) {
        console.error("Error di Webhook:", error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}