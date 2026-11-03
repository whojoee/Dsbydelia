// Menggunakan window.supabase agar tidak tabrakan antar file
if (!window.supabaseClient) {
    const SUPABASE_URL = 'https://krnaolsztrnesmymbmmu.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybmFvbHN6dHJuZXNteW1ibW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyOTk0NDMsImV4cCI6MjA5OTg3NTQ0M30.ddZAXArx9A97-nhxw9d7_Xwur3jBq_jhquZEvti-AP8';
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function updateBagCounter() {
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    let totalqty = cart.reduce((sum, item) => sum + item.qty, 0);
    const baglink = document.getElementById('bag-counter');
    if (baglink) baglink.innerText = `Bag (${totalqty})`;
}

async function fetchHomeProducts() {
    try {
        const { data: products, error } = await window.supabaseClient.from('products').select('*');
        if (error) throw error;

        // Filter data berdasarkan category dari Supabase
        const newArrival = products.filter(p => p.category === 'New_Arrival').slice(0, 4);
        const bestSeller = products.filter(p => p.category === 'Sale').slice(0, 3);
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        const allProducts = shuffled.slice(0, 3);

        // 1. Render New Arrival (Target ID: newarrival-grid)
        const newArrivalContainer = document.getElementById('newarrival-grid');
        if (newArrivalContainer && newArrival.length > 0) {
            newArrivalContainer.innerHTML = newArrival.map(p => `
                <div class="grid-item">
                    <a href="Productview/detail.html?id=${p.id}" class="product-link">
                        <img class="product-img" src="${p.image_url}" alt="${p.name}">
                        <div class="product-info">
                            <div class="product-name">${p.name}</div>
                            <div class="product-price">IDR ${Number(p.price || 0).toLocaleString('id-ID')}</div>
                        </div>
                    </a>
                </div>
            `).join('');
        }

        // 2. Render Sale (Target ID: bestseller-grid)
        const bestContainer = document.getElementById('bestseller-grid');
        if (bestContainer && bestSeller.length > 0) {
            bestContainer.innerHTML = bestSeller.map(p => `
                <div class="grid-item">
                    <a href="Productview/detail.html?id=${p.id}" class="product-link">
                        <img class="product-img" src="${p.image_url}" alt="${p.name}">
                        <div class="product-info">
                            <div class="product-name">${p.name}</div>
                            <div class="product-price">IDR ${Number(p.price || 0).toLocaleString('id-ID')}</div>
                        
                            <div class="price-container">
                                <span class="original-price">IDR ${Number(p.original_price || 0).toLocaleString('id-ID')}</span>
                                <span class="sale-price">IDR ${Number(p.price || 0).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </a>
                </div>
            `).join('');
        }

        // 3. Render All Products (Target ID: allproudct-grid sesuai HTML)
        const allContainer = document.getElementById('allproudct-grid');
        if (allContainer && allProducts.length > 0) {
            allContainer.innerHTML = allProducts.map(p => `
                <div class="grid-item">
                    <a href="Productview/detail.html?id=${p.id}" class="product-link">
                        <img class="product-img" src="${p.image_url}" alt="${p.name}">
                        <div class="product-info">
                            <div class="product-name">${p.name}</div>
                            <div class="product-price">IDR ${Number(p.price || 0).toLocaleString('id-ID')}</div>
                        </div>
                    </a>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Gagal mengambil data:', err.message);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    updateBagCounter();
    fetchHomeProducts();
});