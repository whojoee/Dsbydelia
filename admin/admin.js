import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ==========================================
// 0. SISTEM NOTIFIKASI CANTIK (TAILWIND)
// ==========================================
function showToast(message, type = 'success') {
    let container = document.getElementById('ds-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'ds-toast-container';
        container.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-black' : 'bg-red-600';
    toast.className = `px-6 py-3 rounded shadow-lg transform transition-all duration-300 translate-x-full opacity-0 ${bgColor} text-white font-medium text-sm flex items-center gap-2 pointer-events-auto`;
    toast.innerHTML = `<span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-x-full', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000); 
}

function showConfirm(message, onConfirm) {
    const modalBg = document.createElement('div');
    modalBg.className = 'fixed inset-0 bg-gray-900 bg-opacity-50 z-[9999] flex items-center justify-center p-4 transition-opacity';
    
    modalBg.innerHTML = `
        <div class="bg-white rounded-lg max-w-sm w-full p-6 shadow-xl transform transition-all">
            <h3 class="text-lg font-bold text-gray-900 mb-2">Konfirmasi</h3>
            <p class="text-sm text-gray-600 mb-6">${message}</p>
            <div class="flex justify-end gap-3">
                <button id="cancel-confirm-btn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium transition">Batal</button>
                <button id="ok-confirm-btn" class="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 text-sm font-medium transition">Yakin</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalBg);

    document.getElementById('cancel-confirm-btn').onclick = () => modalBg.remove();
    document.getElementById('ok-confirm-btn').onclick = () => {
        modalBg.remove();
        onConfirm();
    };
}

// ==========================================
// 1. SETUP KONEKSI SUPABASE & AUTH
// ==========================================
const supabaseUrl = 'https://krnaolsztrnesmymbmmu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybmFvbHN6dHJuZXNteW1ibW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyOTk0NDMsImV4cCI6MjA5OTg3NTQ0M30.ddZAXArx9A97-nhxw9d7_Xwur3jBq_jhquZEvti-AP8'; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html'; 
    }
}
checkAuth();

// ==========================================
// 2. MANAJEMEN PESANAN (ORDERS)
// ==========================================
const tableBody = document.getElementById('order-table-body');
const refreshBtn = document.getElementById('refresh-btn');
const statusFilter = document.getElementById('status-filter'); 
let allOrders = []; 

async function fetchOrders() {
    if(!tableBody) return; 
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

function renderTable() {
    renderStats();
    const filterValue = statusFilter ? statusFilter.value : 'all';
    
    let filteredOrders = allOrders;
    if (filterValue === 'pending') {
        filteredOrders = allOrders.filter(o => o.payment_status === 'pending');
    } else if (filterValue === 'SETTLEMENT' || filterValue === 'paid') {
        filteredOrders = allOrders.filter(o => o.payment_status === 'SETTLEMENT' || o.payment_status === 'paid');
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
        if (order.payment_status === 'SETTLEMENT' || order.payment_status === 'paid') {
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

    if(document.getElementById('stat-revenue')) document.getElementById('stat-revenue').textContent = formattedRevenue;
    if(document.getElementById('stat-pending')) document.getElementById('stat-pending').textContent = pendingCount;
    if(document.getElementById('stat-success')) document.getElementById('stat-success').textContent = successCount;
}

window.updateStatus = async function(orderId, newStatus) {
    showConfirm(`Yakin mau ubah status order ${orderId} jadi ${newStatus.toUpperCase()}?`, async () => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ payment_status: newStatus })
                .eq('order_id', orderId);

            if (error) throw error;

            showToast('Status pesanan berhasil diupdate!');
            document.getElementById('detail-modal').remove(); 
            fetchOrders(); 
        } catch (error) {
            console.error('Gagal update status:', error.message);
            showToast('Gagal update status. Coba lagi nanti.', 'error');
        }
    });
};

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

// ==========================================
// 3. MANAJEMEN PRODUK (TAMBAH, TAMPIL, EDIT, HAPUS)
// ==========================================

window.loadProducts = async function() {
    const productTableBody = document.getElementById('product-table-body');
    if (!productTableBody) return; 
    
    productTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Memuat data produk...</td></tr>`;

    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        productTableBody.innerHTML = '';

        if (!products || products.length === 0) {
            productTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Belum ada produk.</td></tr>`;
            return;
        }

        products.forEach(product => {
            const formattedPrice = new Intl.NumberFormat('id-ID', {
                style: 'currency', currency: 'IDR', minimumFractionDigits: 0
            }).format(product.price);

            let finalImageUrl = 'https://placehold.co/100x100?text=No+Photo'; 
            
            if (product.image_url) {
                if (product.image_url.startsWith('http')) {
                    finalImageUrl = product.image_url;
                } else {
                    finalImageUrl = `../${product.image_url}`;
                }
            }

            const tr = document.createElement('tr');
            tr.className = 'border-b hover:bg-gray-50 transition';
            tr.innerHTML = `
                <td class="px-6 py-4">
                    <img src="${finalImageUrl}" onerror="this.onerror=null;this.src='https://placehold.co/100x100?text=Error';" class="w-12 h-12 object-cover rounded shadow-sm bg-gray-100">
                </td>
                <td class="px-6 py-4 font-medium text-gray-900">${product.name}</td>
                <td class="px-6 py-4 text-gray-900">${formattedPrice}</td>
                <td class="px-6 py-4 text-gray-500">${product.category}</td>
                <td class="px-6 py-4">
                    <button onclick="window.openEditModal('${product.id}', '${product.name}', ${product.price}, '${product.category}')" class="text-blue-600 hover:text-blue-900 mr-3 font-medium">Edit</button>
                    <button onclick="window.deleteProduct('${product.id}')" class="text-red-600 hover:text-red-900 font-medium">Hapus</button>
                </td>
            `;
            productTableBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Gagal memuat produk:', error.message);
    }
};

// --- FITUR HAPUS PRODUK ---
window.deleteProduct = function(id) {
    showConfirm("Yakin mau menghapus produk ini dari toko?", async () => {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;

            showToast('Produk berhasil dihapus!');
            window.loadProducts(); // Refresh tabel produk
        } catch (error) {
            console.error('Gagal hapus produk:', error.message);
            showToast('Gagal menghapus produk: ' + error.message, 'error');
        }
    });
};

const addProductForm = document.getElementById('addProductForm');
const submitProductBtn = document.getElementById('submitProductBtn');

if (addProductForm) {
    addProductForm.addEventListener('submit', async function(e) {
        e.preventDefault(); 
        const originalBtnText = submitProductBtn.innerText;
        submitProductBtn.disabled = true;

        const name = document.getElementById('productName').value;
        const price = document.getElementById('productPrice').value;
        const category = document.getElementById('productCategory').value;
        const imageFilesInput = document.getElementById('productImageFiles');
        const files = imageFilesInput.files;

        try {
            if (!files || files.length === 0) throw new Error('Pilih minimal 1 foto produk!');

            const filesToUpload = Array.from(files).slice(0, 3);
            let uploadedUrls = [];

            for (let i = 0; i < filesToUpload.length; i++) {
                const file = filesToUpload[i];
                submitProductBtn.innerText = `Mengupload foto ${i + 1} dari ${filesToUpload.length}...`;
                const fileExt = file.name.split('.').pop();
                const filePath = `${Date.now()}_${i}.${fileExt}`;

                const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
                if (uploadError) throw uploadError;

                const { data: publicURLData } = supabase.storage.from('product-images').getPublicUrl(filePath);
                uploadedUrls.push(publicURLData.publicUrl);
            }

            submitProductBtn.innerText = 'Menyimpan data produk...';

            const { error: insertError } = await supabase
                .from('products')
                .insert([{ name: name, price: parseInt(price), category: category, image_url: uploadedUrls[0] }]);

            if (insertError) throw insertError;

            showToast('Mantap bro! Berhasil upload dan nambahin produk baru.');
            addProductForm.reset();
            window.loadProducts(); 

        } catch (error) {
            console.error('Gagal tambah produk:', error.message);
            showToast('Waduh, gagal nambah produk nih: ' + error.message, 'error');
        } finally {
            submitProductBtn.innerText = originalBtnText;
            submitProductBtn.disabled = false;
        }
    });
}

const editProductModal = document.getElementById('editProductModal');
const editProductForm = document.getElementById('editProductForm');

window.openEditModal = function(id, name, price, category) {
    document.getElementById('editProductId').value = id;
    document.getElementById('editProductName').value = name;
    document.getElementById('editProductPrice').value = price;
    document.getElementById('editProductCategory').value = category;
    
    if(editProductModal) editProductModal.classList.remove('hidden');
};

window.closeEditModal = function() {
    if(editProductModal) {
        editProductModal.classList.add('hidden');
        editProductForm.reset();
    }
};

if (editProductForm) {
    editProductForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const saveBtn = document.getElementById('saveEditBtn');
        const originalText = saveBtn.innerText;
        saveBtn.disabled = true;
        saveBtn.innerText = 'Menyimpan...';

        const id = document.getElementById('editProductId').value;
        const name = document.getElementById('editProductName').value;
        const price = document.getElementById('editProductPrice').value;
        const category = document.getElementById('editProductCategory').value;

        try {
            const { error } = await supabase
                .from('products')
                .update({ name: name, price: parseInt(price), category: category })
                .eq('id', id);

            if (error) throw error;

            showToast('Data produk berhasil diupdate!');
            window.closeEditModal();
            window.loadProducts(); 
        } catch (error) {
            console.error('Gagal update produk:', error.message);
            showToast('Gagal update produk nih: ' + error.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerText = originalText;
        }
    });
}

// ==========================================
// 4. JALANKAN SAAT HALAMAN DIBUKA
// ==========================================
fetchOrders();
window.loadProducts();

if (refreshBtn) refreshBtn.addEventListener('click', fetchOrders);
if (statusFilter) statusFilter.addEventListener('change', renderTable);