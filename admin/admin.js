import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// 1. Setup Koneksi ke Supabase
const supabaseUrl = 'https://krnaolsztrnesmymbmmu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybmFvbHN6dHJuZXNteW1ibW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyOTk0NDMsImV4cCI6MjA5OTg3NTQ0M30.ddZAXArx9A97-nhxw9d7_Xwur3jBq_jhquZEvti-AP8'; // GANTI PAKE KEY LU!
const supabase = createClient(supabaseUrl, supabaseKey);

// --- SISTEM SATPAM: Cek Sesi Login ---
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Kalau nggak ada session (belum login), tendang balik ke login.html
    if (!session) {
        window.location.href = 'login.html'; 
    }
}
// Jalankan satpamnya duluan
checkAuth();

// 2. Ambil elemen dari HTML
const tableBody = document.getElementById('order-table-body');
const refreshBtn = document.getElementById('refresh-btn');
const statusFilter = document.getElementById('status-filter'); 

let allOrders = []; // Simpan semua data

// 3. Fungsi narik data
async function fetchOrders() {
    tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500 animate-pulse">Menarik data dari Supabase...</td></tr>`;
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allOrders = orders || [];
        renderTable(); 
    } catch (error) {
        console.error('Gagal narik data:', error.message);
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Gagal memuat data.</td></tr>`;
    }
}

// 4. Fungsi nyusun data & Filter
function renderTable() {
    renderStats();
    const filterValue = statusFilter ? statusFilter.value : 'all';
    
    let filteredOrders = allOrders;
    if (filterValue === 'pending') {
        filteredOrders = allOrders.filter(o => o.payment_status === 'pending');
    } else if (filterValue === 'settlement') {
        filteredOrders = allOrders.filter(o => o.payment_status === 'settlement' || o.payment_status === 'paid');
    }

    if (!filteredOrders || filteredOrders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">Tidak ada pesanan untuk status ini.</td></tr>`;
        return;
    }

    tableBody.innerHTML = ''; 

    filteredOrders.forEach((order) => {
        const formattedPrice = new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(order.total_price);

        const dateObj = new Date(order.created_at);
        const formattedDate = dateObj.toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        let statusColor = 'bg-yellow-100 text-yellow-800 border-yellow-200'; 
        if (order.payment_status === 'settlement' || order.payment_status === 'paid') {
            statusColor = 'bg-green-100 text-green-800 border-green-200';
        } else if (order.payment_status === 'expire' || order.payment_status === 'cancel') {
            statusColor = 'bg-red-100 text-red-800 border-red-200';
        }

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition border-b border-gray-50';
        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-gray-900">${order.order_id}</td>
            <td class="px-6 py-4 text-gray-500 text-xs sm:text-sm">${formattedDate}</td>
            <td class="px-6 py-4 text-gray-900 font-semibold">${formattedPrice}</td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${statusColor}">
                    ${order.payment_status ? order.payment_status.toUpperCase() : 'PENDING'}
                </span>
            </td>
            <td class="px-6 py-4 text-center">
                <button onclick="window.showDetail('${order.order_id}')" class="text-black hover:text-gray-600 font-medium text-sm underline decoration-gray-300 underline-offset-4 transition">
                    Kelola
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// 8. Fungsi Hitung & Tampilkan Statistik
function renderStats() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalRevenue = 0;
    let pendingCount = 0;
    let successCount = 0;

    allOrders.forEach(order => {
        const isPaid = order.payment_status === 'settlement' || order.payment_status === 'paid';
        const isPending = order.payment_status === 'pending';

        if (isPaid) {
            successCount++;
            const orderDate = new Date(order.created_at);
            if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
                totalRevenue += Number(order.total_price) || 0;
            }
        }
        if (isPending) pendingCount++;
    });

    const formattedRevenue = new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(totalRevenue);

    document.getElementById('stat-revenue').textContent = formattedRevenue;
    document.getElementById('stat-pending').textContent = pendingCount;
    document.getElementById('stat-success').textContent = successCount;
}

// 5. Fitur Update Status ke Supabase
window.updateStatus = async function(orderId, newStatus) {
    const confirmUpdate = confirm(`Yakin mau ubah status order ${orderId} jadi ${newStatus.toUpperCase()}?`);
    if (!confirmUpdate) return;

    try {
        const { error } = await supabase
            .from('orders')
            .update({ payment_status: newStatus })
            .eq('order_id', orderId);

        if (error) throw error;

        alert('Status berhasil diupdate!');
        document.getElementById('detail-modal').remove(); 
        fetchOrders(); 
    } catch (error) {
        console.error('Gagal update status:', error.message);
        alert('Gagal update status. Cek log.');
    }
};

// 6. Fungsi Modal Detail + Data Pengiriman Pelanggan
window.showDetail = function(orderId) {
    const order = allOrders.find(o => o.order_id === orderId);
    if (!order) return;

    let itemsHtml = '<p class="text-gray-500 text-sm">Tidak ada detail item.</p>';
    if (order.items) {
        let itemsArray = order.items;
        if (typeof itemsArray === 'string') {
            try { itemsArray = JSON.parse(order.items); } catch(e) {}
        }
        if (Array.isArray(itemsArray) && itemsArray.length > 0) {
            itemsHtml = itemsArray.map(item => `
                <div class="flex justify-between items-center border-b py-2 text-sm">
                    <div>
                        <p class="font-medium text-gray-800">${item.name || item.title || 'Produk'}</p>
                        <p class="text-xs text-gray-500">Qty: ${item.quantity || 1}</p>
                    </div>
                    <span class="font-semibold text-gray-700">Rp ${Number(item.price || 0).toLocaleString('id-ID')}</span>
                </div>
            `).join('');
        }
    }

    let modalBg = document.getElementById('detail-modal');
    if (modalBg) modalBg.remove();

    modalBg = document.createElement('div');
    modalBg.id = 'detail-modal';
    modalBg.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    
    // HTML Modal dengan Kotak Informasi Pengiriman Pelanggan
    modalBg.innerHTML = `
        <div class="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl transform transition-all max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center border-b pb-3 mb-4">
                <h3 class="text-lg font-bold text-gray-800">Kelola Pesanan</h3>
                <button onclick="document.getElementById('detail-modal').remove()" class="text-gray-400 hover:text-black font-bold text-xl">&times;</button>
            </div>
            
            <div class="mb-4 space-y-1 text-sm text-gray-600">
                <p><strong>Order ID:</strong> ${order.order_id}</p>
                <p><strong>Total Belanja:</strong> Rp ${Number(order.total_price).toLocaleString('id-ID')}</p>
                <p><strong>Status Saat Ini:</strong> <span class="bg-gray-200 px-2 py-1 rounded text-black font-semibold uppercase">${order.payment_status}</span></p>
            </div>

            <!-- KOTAK INFORMASI PENGIRIMAN -->
            <div class="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
                <h4 class="font-bold text-gray-700 border-b pb-1 mb-2">Informasi Pengiriman</h4>
                <p class="mb-1"><strong>Nama:</strong> ${order.customer_name || '-'}</p>
                <p class="mb-1"><strong>No. WA:</strong> ${order.customer_phone || '-'}</p>
                <p><strong>Alamat:</strong> ${order.shipping_address || '-'}</p>
            </div>

            <div class="mb-6">
                <h4 class="font-semibold text-gray-700 text-sm mb-2">Daftar Produk:</h4>
                <div class="max-h-48 overflow-y-auto border rounded p-3 bg-gray-50">
                    ${itemsHtml}
                </div>
            </div>

            <!-- Tombol Aksi Admin -->
            <div class="border-t pt-4">
                <p class="text-xs text-gray-500 mb-2">Ubah Status Manual:</p>
                <div class="flex space-x-2 mb-4">
                    <button onclick="window.updateStatus('${order.order_id}', 'settlement')" class="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700">Set Lunas</button>
                    <button onclick="window.updateStatus('${order.order_id}', 'cancel')" class="bg-red-600 text-white px-3 py-1.5 rounded text-xs hover:bg-red-700">Batalkan</button>
                    <button onclick="window.updateStatus('${order.order_id}', 'pending')" class="bg-yellow-500 text-white px-3 py-1.5 rounded text-xs hover:bg-yellow-600">Set Pending</button>
                </div>
                
                <div class="flex justify-end">
                    <button onclick="document.getElementById('detail-modal').remove()" class="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 transition">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalBg);
};

// 7. Event Listener buat Trigger
fetchOrders();
refreshBtn.addEventListener('click', fetchOrders);

if (statusFilter) {
    statusFilter.addEventListener('change', renderTable);
}

// ==========================================
// KODE LOGIKA TAMBAH PRODUK
// ==========================================

// Menangkap form tambah produk
// ==========================================
// KODE LOGIKA TAMBAH PRODUK + UPLOAD FOTO
// ==========================================
const addProductForm = document.getElementById('addProductForm');
const submitProductBtn = document.getElementById('submitProductBtn');

if (addProductForm) {
    addProductForm.addEventListener('submit', async function(e) {
        e.preventDefault(); 

        const originalBtnText = submitProductBtn.innerText;
        submitProductBtn.innerText = 'Mengupload foto...';
        submitProductBtn.disabled = true;

        const name = document.getElementById('productName').value;
        const price = document.getElementById('productPrice').value;
        const category = document.getElementById('productCategory').value;
        const imageFileinput = document.getElementById('productImageFile');
        const file = imageFileinput.files[0];

        try {
            if (!file) {
                throw new Error('Pilih foto produk terlebih dahulu!');
            }

            // 1. Buat nama file yang unik biar nggak bentrok
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            submitProductBtn.innerText = 'Mengupload foto...';

            // 2. Upload file ke Supabase Storage (bucket: product-images)
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 3. Ambil Public URL dari file yang baru di-upload
            const { data: publicURLData } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            const publicImageUrl = publicURLData.publicUrl;

            submitProductBtn.innerText = 'Menyimpan data...';

            // 4. Masukkan data produk ke tabel 'products'
            const { error: insertError } = await supabase
                .from('products')
                .insert([
                    { 
                        name: name, 
                        price: parseInt(price), 
                        category: category, 
                        image_url: publicImageUrl 
                    }
                ]);

            if (insertError) throw insertError;

            alert('Produk berhasil ditambahkan.');
            addProductForm.reset();

        } catch (error) {
            console.error('Gagal tambah produk:', error.message);
            alert('Waduh, gagal nambah produk nih: ' + error.message);
        } finally {
            submitProductBtn.innerText = originalBtnText;
            submitProductBtn.disabled = false;
        }
    });
}