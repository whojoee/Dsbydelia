import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { order_id, resi } = req.body;

        // Konek ke Supabase
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        
        // Cari nama dan nomor WA pembeli berdasarkan Order ID
        const { data: orderData, error } = await supabase
            .from('orders')
            .select('customer_name, customer_phone')
            .eq('order_id', order_id)
            .single();

        if (error || !orderData) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (orderData.customer_phone) {
            // Teks WA yang bakal dikirim ke pelanggan
            const pesanWA = `Halo Kak ${orderData.customer_name},\n\nPesanan Kakak dengan nomor *${order_id}* sudah kami kirimkan ya! 🎉\n\nBerikut adalah nomor resinya: *${resi}*\n\nTerima kasih sudah berbelanja di DS by Delia Septianti. Ditunggu kedatangan paketnya! 😊`;

            // Tembak API Fonnte
            await fetch('https://api.fonnte.com/send', {
                method: 'POST',
                headers: { 'Authorization': process.env.FONNTE_TOKEN },
                body: new URLSearchParams({
                    target: orderData.customer_phone,
                    message: pesanWA,
                    countryCode: '62'
                })
            });
        }

        res.status(200).json({ message: 'Resi berhasil dikirim' });
    } catch (error) {
        console.error("Error Kirim Resi:", error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}