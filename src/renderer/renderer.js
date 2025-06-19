const ipc = window.electronAPI;

let urlElement ;
let etsyElement;
let tiktokElement;
let shopeeElement;
let connectButton;


document.addEventListener("DOMContentLoaded", async () => {

    urlElement = document.getElementById("url");
    etsyElement = document.getElementById("etsy");
    tiktokElement = document.getElementById("tiktok");
    shopeeElement = document.getElementById("shoppe");
    connectButton = document.getElementById("connect-btn");

    await loadCache();
    connectButton.onclick = connect;

})

const connect = async () => {

    document.getElementById('error-connect').innerText='';

    const url = urlElement.value.trim();
    const etsy = etsyElement.value.trim();
    const tiktok = tiktokElement.value.trim();
    const shopee = shopeeElement.value.trim();

    if (!url || !etsy || !tiktok || !shoppe) {
        showToast("Vui lòng nhập đầy đủ thông tin!", "red");
        return;
    }


    connectButton.disabled = true;
    connectButton.innerHTML = `
        <div class="flex items-center space-x-2">
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Đang kết nối...</span>
        </div>
    `;
    const response = await ipc.sendConnectData({ etsy, tiktok, shopee, url })
    
    if(!response.status){
        connectButton.innerText = "Kết nối"
        showToast("Kết nối thất bại. Kiểm tra lại thông tin!")
        return;
    }
    connectButton.innerText = "Thành công!"
    let error = [];

    if(!response.tiktok) error.push("Tiktok lỗi!")
    if(!response.etsy) error.push("Etsy lỗi!")
    if(!response.shopee) error.push("Shopee lỗi!")
    
    if(error.length > 0) {
        document.getElementById('error-connect').innerText = error.join(" ")
    }    
};

const loadCache = async () => {
   
    const response = await ipc.getCache();
    console.log("🧪 Dữ liệu load từ cache:", response); // THÊM DÒNG NÀY

    urlElement.value = response.url;
    etsyElement.value = response.etsy;
    tiktokElement.value = response.tiktok;
    shopeeElement.value = response.shopee;
}


function showToast(message, color = "green", time = 500) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `fixed top-5 right-5 bg-${color}-500 text-white px-4 py-2 rounded shadow-lg opacity-100 transition-opacity duration-300 z-50`;

    setTimeout(() => {
        toast.classList.remove("opacity-100");
        toast.classList.add("opacity-0");
    }, time);
}

