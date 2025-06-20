const ipc = window.electronAPI;

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const productsGrid = document.getElementById("productsGrid");
const productTemplate = document.getElementById("productTemplate");
const loading = document.getElementById("loading");
const noResults = document.getElementById("noResults");
const loadMoreButton = document.getElementById("loadMoreButton");
const platformsWrapper = document.getElementById('platformss');
let currentPage = 1;
let tiktokCount = 0;


(async() =>{
  const platforms = await ipc.getPlatforms();

  platforms.forEach(item =>{
    let itemHtml = 
    `<label class="flex items-center gap-2 rounded-full border border-gray-300 cursor-pointer hover:bg-gray-100 transition
        data-[checked=true]:bg-blue-500 data-[checked=true]:text-white">
        <input type="checkbox" name="platforms" value="${item}" class="hidden peer" checked />
        <span class="capitalize peer-checked:text-white peer-checked:bg-blue-500 px-3 py-1 rounded-full">${item.replace("key/", "")}</span>
      </label>`
    platformsWrapper.innerHTML += itemHtml;
  })
})()

// Sample data
const sampleProducts = [
  {
    img: "https://via.placeholder.com/200",
    title: "Sample Product with a longer name to test multiple lines",
    link: "https://example.com/product1",
    sold: 100,
    price: "$19.99",
    origin: "shopee",
  },
];

function getOriginClass(origin) {
  const classes = {
    shopee: "bg-orange-50 text-orange-600",
    tiktok: "bg-gray-900 text-white",
    etsy: "bg-green-50 text-green-600",
  };
  return classes[origin.toLowerCase()] || "bg-gray-50 text-gray-600";
}

function showLoading(show) {
  loading.classList.toggle("hidden", !show);
  if (loadMoreButton) loadMoreButton.classList.toggle("hidden", show);
}

function getPlatforms(origin) {
  
  const checkedPlatforms = document.querySelectorAll('input[name="platforms"]:checked');

  const platforms = [];

  checkedPlatforms.forEach((checkbox) => {
    platforms.push(checkbox.value);
  })

  return platforms;
}
function showNoResults(show) {
  noResults.classList.toggle("hidden", !show);
  productsGrid.classList.toggle("hidden", show);
  if (loadMoreButton) loadMoreButton.classList.toggle("hidden", show);
}

function clearProducts() {
  productsGrid.innerHTML = "";
  if (loadMoreButton) loadMoreButton.classList.add("hidden");
}

function pushProduct(product) {
  showNoResults(false);
  const clone = productTemplate.content.cloneNode(true);
  const img = clone.querySelector("img");
  img.src = product.img;
  img.alt = product.title;
  clone.querySelector("h3").textContent = product.title;
  clone.querySelector(".text-red-500").textContent = product.price;
  clone.querySelector(".sold").textContent = product.sold;
  const originTag = clone.querySelector(".origin-tag");
  originTag.textContent = product.origin;
  originTag.className = `origin-tag text-xs font-medium px-2 py-0.5 rounded-full ${getOriginClass(product.origin)}`;

  const productCard = clone.querySelector(".product-item");

  productCard.addEventListener("click",  async () => {
    const modalLoading = document.getElementById("modalLoading");
    if (modalLoading) modalLoading.classList.remove("hidden");
    try {
      const data = {
        key: product.id,
        link: product.link
      }
      const response = await ipc.getDetails(data);
      console.log("🧪 Product details:", response);
      const cloneProduct = {...product, images: response }

      showProductModal(cloneProduct);
    } catch (e) {
      alert("Không lấy được chi tiết sản phẩm!");
    } finally {
      if (modalLoading) modalLoading.classList.add("hidden");
    }
  });

  productsGrid.appendChild(clone);
  if (loadMoreButton && loading.classList.contains("hidden")) {
    loadMoreButton.classList.remove("hidden");
  }
}

searchButton.addEventListener("click", async () => {
  const query = searchInput.value.trim();

  currentPage = 1;
  tiktokCount = 0; 

  const platforms = getPlatforms();
  console.log("Selected platforms:", platforms);

  if (!query) return;
  clearProducts();
  showNoResults(false);
  showLoading(true);

  try {
    console.log("Searching for:", query);

    const data = {
      keyword: query,
      platforms: platforms,
    }
    const response = await ipc.search(data);
    // No need to render products array, products will be pushed one by one
    if (response && response.length === 0) {
      showNoResults(true);
    }
  } catch (error) {
    console.error("Search error:", error);
    showNoResults(true);
  } finally {
    showLoading(false);
  }
});

loadMoreButton.addEventListener("click", async () => {

  currentPage++;

  const query = searchInput.value.trim();
  if (!query) return;

  const platforms = getPlatforms();
  console.log("Selected platforms:", platforms);

  showNoResults(false);
  showLoading(true);
  try {

    const data = {
      keyword: query,
      pageNumber: currentPage,
      tiktokCount: tiktokCount,
      platforms: platforms,
    }
    const response = await ipc.loadMore(data);
    if (response && response.length === 0) {
      showNoResults(true);
    }
  } catch (error) {
    console.error("Search error:", error);
    showNoResults(true);
  } finally {
    showLoading(false);
  }

});



ipc.onNewProduct((product) => {
  if(product.origin === "TIKTOK") {
    tiktokCount++;
  }
  pushProduct(product);
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchButton.click();
  }
});

function showProductModal(product) {
  const modal = document.getElementById("productModal");
  const imagesContainer = document.getElementById("productImages");
  const titleEl = document.getElementById("productTitle");
  const priceEl = document.getElementById("productPrice");
  const originEl = document.getElementById("productOrigin");
  const soldEl = document.getElementById("productSold");
  const linkEl = document.getElementById("productLink");
  // Copy button
  const copyBtn = document.getElementById("copyTitleBtn");
  const copyMsg = document.getElementById("copySuccessMsg");
  // Zoom modal
  const imageZoomModal = document.getElementById("imageZoomModal");
  const zoomedImage = document.getElementById("zoomedImage");
  const closeZoomModal = document.getElementById("closeZoomModal");

  // Ảnh
  imagesContainer.innerHTML = '';
  (product.images || []).forEach((src, idx) => {
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'relative group';
    const img = document.createElement('img');
    img.src = src;
    img.className = "w-full h-24 object-cover rounded border cursor-zoom-in";
    // Click để zoom
    img.onclick = function(e) {
      e.stopPropagation();
      zoomedImage.src = src;
      imageZoomModal.classList.remove('hidden');
    };
    // Nút tải ảnh
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = 'Tải ảnh JPG';
    downloadBtn.className = 'absolute bottom-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition';
    downloadBtn.onclick = async (e) => {
      e.stopPropagation();
      // Gửi yêu cầu tải về backend
      try {
        const r = await ipc.downloadImageAsJpg({ url: src, fileName: `image_${idx+1}.jpg` });
        console.log(r);
      } catch (err) {
        alert('Không tải được ảnh!');
      }
    };
    imgWrapper.appendChild(img);
    imgWrapper.appendChild(downloadBtn);
    imagesContainer.appendChild(imgWrapper);
  });

  // Đóng modal zoom
  if (closeZoomModal) {
    closeZoomModal.onclick = function() {
      imageZoomModal.classList.add('hidden');
      zoomedImage.src = '';
    };
  }
  // Đóng khi click nền tối
  if (imageZoomModal) {
    imageZoomModal.onclick = function(e) {
      if (e.target === imageZoomModal) {
        imageZoomModal.classList.add('hidden');
        zoomedImage.src = '';
      }
    };
  }

  // Thông tin
  titleEl.textContent = product.title || 'Không có tên';
  priceEl.textContent = product.price || '—';
  originEl.textContent = product.origin || '—';
  soldEl.textContent = product.sold ? `Đã bán: ${product.sold}` : '';
  if (product.link) {
    linkEl.href = product.link;
    linkEl.classList.remove('pointer-events-none', 'text-gray-400');
  } else {
    linkEl.href = '#';
    linkEl.classList.add('pointer-events-none', 'text-gray-400');
  }

  // Copy tên sản phẩm
  if (copyBtn) {
    copyBtn.onclick = async function() {
      try {
        await navigator.clipboard.writeText(product.title || '');
        if (copyMsg) {
          copyMsg.classList.remove('hidden');
          setTimeout(() => copyMsg.classList.add('hidden'), 1200);
        }
      } catch (e) {
        alert('Không thể copy!');
      }
    };
  }

  // Sau imagesContainer
  const downloadAllBtnId = 'downloadAllImagesBtn';
  let downloadAllBtn = document.getElementById(downloadAllBtnId);
  if (!downloadAllBtn) {
    downloadAllBtn = document.createElement('button');
    downloadAllBtn.id = downloadAllBtnId;
    downloadAllBtn.textContent = 'Tải tất cả ảnh JPG';
    downloadAllBtn.className = 'mt-2 mb-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition block';
    imagesContainer.parentElement.appendChild(downloadAllBtn);
  }
  downloadAllBtn.onclick = async () => {
    if (!product.images || !product.images.length) return;
    const images = product.images.map((url, i) => ({ url, fileName: `image_${i+1}.jpg` }));
    try {
      const result = await ipc.downloadMultiImagesAsJpg({ images });
      if (result.success) {
        alert('Đã tải xong tất cả ảnh!');
      } else if (result.error === 'cancelled') {
        // user cancelled
      } else {
        alert('Có lỗi khi tải ảnh!');
      }
    } catch (e) {
      alert('Có lỗi khi tải ảnh!');
    }
  };

  // Hiện modal
  modal.classList.remove("hidden");
}

// Đóng modal
document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("productModal").classList.add("hidden");
});
