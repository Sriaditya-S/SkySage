const itemsPerPage = 52;
let imageDatas = [];
document.addEventListener("DOMContentLoaded", async function () {
  isLoading(true);
  imageDatas = await loadPicture();
  for (let imageData of imageDatas) {
    imageData.id = getParam("id", imageData.url);
  }
  displayImagesAndUpdateURL(imageDatas, getCurrentPage());

  document.querySelectorAll(".firstPage").forEach((button) => {
    button.addEventListener("click", function () {
      displayImagesAndUpdateURL(imageDatas, 1);
    });
  });
  document.querySelectorAll(".prevPage").forEach((button) => {
    button.addEventListener("click", function () {
      const currentPage = parseInt(
        document.querySelector(".currentPage").textContent
      );
      if (currentPage > 1) {
        displayImagesAndUpdateURL(imageDatas, currentPage - 1);
      }
    });
  });
  document.querySelectorAll(".nextPage").forEach((button) => {
    button.addEventListener("click", function () {
      const currentPage = parseInt(
        document.querySelector(".currentPage").textContent
      );
      const totalPages = Math.ceil(imageDatas.length / itemsPerPage);
      if (currentPage < totalPages) {
        displayImagesAndUpdateURL(imageDatas, currentPage + 1);
      }
    });
  });

  document.querySelectorAll(".lastPage").forEach((button) => {
    button.addEventListener("click", function () {
      const totalPages = Math.ceil(imageDatas.length / itemsPerPage);
      displayImagesAndUpdateURL(imageDatas, totalPages);
    });
  });

  const scrollTopBtn = document.getElementById("scrollTopBtn");
  window.addEventListener("scroll", function () {
    if (window.scrollY > 200) {
      scrollTopBtn.classList.add("show");
    } else {
      scrollTopBtn.classList.remove("show");
    }
  });
  scrollTopBtn.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
  document
    .getElementById("searchInput")
    .addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        performSearch();
      }
    });
  document
    .getElementById("searchButton")
    .addEventListener("click", performSearch);
  document
    .getElementById("donwloadWallPaper")
    .addEventListener("click", donwloadWallPaper);
  isLoading(false);
});

async function loadPicture() {
  const response = await fetch(
    `https://chrome-tool.github.io/change-google-calendar-background/raw/datas.json`
  );
  return await response.json();
}

function displayImagesAndUpdateURL(imageDatas, currentPage) {
  displayImages(imageDatas, currentPage);
  updateURL(currentPage);
}

function displayImages(currentImages, currentPage) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageImages = currentImages.slice(startIndex, endIndex);
  const gallery = document.querySelector(".image-gallery");
  while (gallery.firstChild) {
    gallery.removeChild(gallery.firstChild);
  }
  pageImages.forEach((el) => {
    const imageItem = document.createElement("div");
    if (el.selected) imageItem.classList.add("selected");
    imageItem.classList.add("image-item");
    const loadingElement = document.createElement("div");
    loadingElement.classList.add("image-loading");
    loadingElement.textContent = "Loading...";
    loadingElement.style.display = "block";
    const img = new Image();
    img.onload = function () {
      loadingElement.style.display = "none";
    };
    img.onerror = function (e) {
      console.log(e);
    };
    img.alt = el.title || el.copyright;
    img.title = el.title || el.copyright;
    img.src = el.url.replace("&w=3840&h=2160", "&w=453&h=600");
    img.dataset.id = el.id;
    img.loading = "lazy";
    img.decoding = "async";
    imageItem.appendChild(img);
    imageItem.appendChild(loadingElement);
    gallery.appendChild(imageItem);

    imageItem.addEventListener("click", function (e) {
      let selectedImage = imageDatas.find((el) => el.id == e.target.dataset.id);
      if (imageItem.classList.contains("selected")) {
        imageItem.classList.remove("selected");
        selectedImage.selected = false;
      } else {
        imageItem.classList.add("selected");
        selectedImage.selected = true;
      }
    });
  });

  document.querySelectorAll(".currentPage").forEach((span) => {
    span.textContent = currentPage;
  });

  const totalPages = Math.ceil(currentImages.length / itemsPerPage);
  document.querySelectorAll(".totalpage").forEach((span) => {
    span.textContent = totalPages;
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function updateURL(page) {
  const allPath = window.location.origin + window.location.pathname;
  const newUrl = allPath + "?page=" + page;
  window.history.pushState({ path: newUrl }, "", newUrl);
}

function getCurrentPage() {
  const totalPages = Math.ceil(imageDatas.length / itemsPerPage);
  const urlParams = new URLSearchParams(window.location.search);
  let currentPage = parseInt(urlParams.get("page")) || 1;
  if (isNaN(currentPage)) {
    currentPage = 1;
  } else if (currentPage < 1) {
    currentPage = 1;
  } else if (currentPage > totalPages) {
    currentPage = totalPages;
  }
  return currentPage;
}

function displayError() {
  const gallery = document.querySelector(".image-gallery");
  gallery.innerHTML =
    "<p>Error fetching wallpaper. Please try again later.</p>";
}

function performSearch() {
  const searchInput = document.getElementById("searchInput");
  const searchTerm = searchInput.value.toLowerCase();
  let currentImages = [];
  for (let image of imageDatas) {
    image.selected = false;
  }
  if (!searchTerm.trim()) {
    currentImages = imageDatas.slice();
  } else {
    currentImages = imageDatas.filter(
      (item) =>
        item?.bsTitle?.toLowerCase()?.includes(searchTerm) ||
        item?.caption?.toLowerCase()?.includes(searchTerm) ||
        item?.copyright?.toLowerCase()?.includes(searchTerm) ||
        item?.desc?.toLowerCase()?.includes(searchTerm) ||
        item?.date?.toLowerCase()?.includes(searchTerm)
    );
  }
  displayImagesAndUpdateURL(currentImages, 1);
}

async function donwloadWallPaper() {
  const selectedImages = imageDatas.filter((el) => el.selected);
  if (selectedImages.length == 0) {
    openModal("Please Select WallPaper!");
  } else {
    isLoading(true);
    let urls = [];
    for (let selectedImage of selectedImages) {
      urls.push(selectedImage.url);
    }
    try {
      await downloadImages(urls);
    } catch (e) {
      console.error(e);
    } finally {
      isLoading(false);
    }
  }
}

async function downloadImages(urls) {
  const result = await getImageBlog(urls);
  const zipBlob = await generateZipBlob(result);
  saveBlob(
    zipBlob,
    `WallPaper_${dateFormat(new Date(), "YYYYmmddHHMMSS")}.zip`
  );
}

function generateZipBlob(nameContentPairs) {
  let zip = new JSZip();
  nameContentPairs.forEach((nameContentPair) => {
    zip.file(nameContentPair.name, nameContentPair.content);
  });
  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOption: {
      level: 1,
    },
  });
}

async function getImageBlog(urls) {
  let contens = [];
  for (let url of urls) {
    const response = await fetch(url);
    const blob = await response.blob();
    contens.push({
      name: getParam("id", url),
      content: blob,
    });
  }
  return contens;
}

function saveBlob(blob, name = undefined) {
  if (window.navigator.msSaveBlob) {
    if (name) window.navigator.msSaveBlob(blob, name);
    else window.navigator.msSaveBlob(blob);
  } else {
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    if (name) a.download = name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

function dateFormat(date, fmt) {
  let ret;
  const opt = {
    "Y+": date.getFullYear().toString(),
    "m+": (date.getMonth() + 1).toString(),
    "d+": date.getDate().toString(),
    "H+": date.getHours().toString(),
    "M+": date.getMinutes().toString(),
    "S+": date.getSeconds().toString(),
  };
  for (let k in opt) {
    ret = new RegExp("(" + k + ")").exec(fmt);
    if (ret) {
      fmt = fmt.replace(
        ret[1],
        ret[1].length == 1 ? opt[k] : opt[k].padStart(ret[1].length, "0")
      );
    }
  }
  return fmt;
}

function getParam(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function isLoading(isLoading) {
  if (isLoading) {
    document.querySelector(".loader-wrapper").style.display = "block";
  } else {
    document.querySelector(".loader-wrapper").style.display = "none";
  }
}

function openModal(message) {
  const modal = document.querySelector(".modal-overlay");
  const modalContent = modal.querySelector(".modal-content span");
  modalContent.innerHTML = message;
  modal.classList.add("show");
  document.querySelector('.close-btn').addEventListener("click", function () {
    modal.classList.remove("show");
  });
}
