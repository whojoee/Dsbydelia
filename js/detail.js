if (!window.supabaseClient) {
    const SUPABASE_URL = 'https://krnaolsztrnesmymbmmu.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybmFvbHN6dHJuZXNteW1ibW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyOTk0NDMsImV4cCI6MjA5OTg3NTQ0M30.ddZAXArx9A97-nhxw9d7_Xwur3jBq_jhquZEvti-AP8';
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let currentProduct = null;

async function loadDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        currentProduct = data;

        // 1. Masukin Nama dan Harga (Deklarasi variabel diperbaiki)
        const nameEl = document.getElementById('product-name');
        const priceEl = document.getElementById('product-price');
        
        if (nameEl) nameEl.innerText = data.name;
        if (priceEl) priceEl.innerText = `IDR ${Number(data.price).toLocaleString('id-ID')}`;
        
        // 2. Render Gambar Dinamis
        const sliderContainer = document.getElementById('imageSlider');
        const dotsContainer = document.getElementById('sliderDots');

        if (sliderContainer) {
            let imagesHTML = `
                <div class="w-full h-full flex-shrink-0 snap-start">
                    <img src="../${data.image_url}" alt="${data.name} Main" class="w-full h-full object-cover">
                </div>
            `;
            let totalImage = 1; // Menggunakan konsistensi nama totalImage

            // Kalau di Supabase kolom image_url_2 diisi, tambahin sebagai slide kedua
            if (data.image_url_2) {
                imagesHTML += `
                    <div class="w-full h-full flex-shrink-0 snap-start">
                        <img src="../${data.image_url_2}" alt="${data.name} Detail" class="w-full h-full object-cover">
                    </div>
                `;
                totalImage++;

            if(data.image_url_3) {
                imagesHTML += `
                    <div class="w-full h-full flex-shrink-0 snap-start">
                        <img src="../${data.image_url_3}" alt="${data.name} Detail 2" class="w-full h-full object-cover">
                    </div>
                `;
                totalImage++;
            }

            sliderContainer.innerHTML = imagesHTML;

            if (dotsContainer && totalImage > 1) {
                let dotsHTML = '';
                for (let i = 0; i < totalImage; i++) {
                    const activeClass = i === 0 ? 'bg-neutral-800 ' : 'bg-neutral-400 ';
                    dotsHTML += `<span class="dot w-2 h-2 rounded-full transition-all duration-300 ${activeClass}"></span>`;
                }
                dotsContainer.innerHTML = dotsHTML;

                sliderContainer.addEventListener('scroll', () => {
                    
                    const scrollPosition = sliderContainer.scrollLeft;
                    const slideWidth = sliderContainer.clientWidth;
                    const activeIndex = Math.floor(scrollPosition / slideWidth);

                    const dots = dotsContainer.querySelectorAll('.dot');
                    
                    dots.forEach((dot, index) => {
                        if (index === activeIndex) {
                            dot.classList.remove('bg-neutral-400');
                            dot.classList.add('bg-neutral-800');
                        } else {
                            dot.classList.remove('bg-neutral-800');
                            dot.classList.add('bg-neutral-400');
                        }
                    })
                })
            } else if (dotsContainer) {
                dotsContainer.innerHTML = '';
            }
        }
     }
        
    } catch (err) {
        console.error("Gagal load detail produk:", err.message);
        document.getElementById('product-name').innerText = "Produk tidak ditemukan/Koneksi Error";
    }
}

// Logika Tambah ke Keranjang
document.getElementById('addToCartBtn')?.addEventListener('click', () => {
    const size = document.getElementById('sizePicker').value;
    if (!size) {
        alert('Pilih ukuran dulu bro!');
        return;
    }
    
    if (currentProduct) {
        let cart = JSON.parse(localStorage.getItem("shoppingCart")) || [];
        let item = cart.find(i => i.id === currentProduct.id && i.size === size);
        
        if (item) {
            item.qty += 1;
        } else {
            cart.push({ 
                id: currentProduct.id, 
                name: currentProduct.name, 
                price: currentProduct.price, 
                image: `../${currentProduct.image_url}`, 
                size: size, 
                qty: 1 
            });
        }
        
        localStorage.setItem("shoppingCart", JSON.stringify(cart));
        window.location.href = "../cart.html";
    }
});

window.addEventListener("DOMContentLoaded", loadDetail);