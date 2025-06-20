const ipc = window.electronAPI;

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const productsGrid = document.getElementById("productsGrid");
const productTemplate = document.getElementById("productTemplate");
const loading = document.getElementById("loading");
const noResults = document.getElementById("noResults");
const loadMoreButton = document.getElementById("loadMoreButton");
let currentPage = 1;
let tiktokCount = 0;

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
  const productLink = clone.querySelector("a");
  productLink.href = product.link;
  const img = clone.querySelector("img");
  img.src = product.img;
  img.alt = product.title;
  clone.querySelector("h3").textContent = product.title;
  clone.querySelector(".text-red-500").textContent = product.price;
  clone.querySelector(".sold").textContent = product.sold;
  const originTag = clone.querySelector(".origin-tag");
  originTag.textContent = product.origin;
  originTag.className = `origin-tag text-xs font-medium px-2 py-0.5 rounded-full ${getOriginClass(product.origin)}`;
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
