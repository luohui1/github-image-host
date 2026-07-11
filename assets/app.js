(() => {
  const DEFAULTS = {
    owner: "luohui1",
    repo: "github-image-host",
    branch: "main",
    path: "images",
  };

  const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i;
  const MAX_BYTES = 5 * 1024 * 1024;
  const STORAGE_KEY = "framebin.config";

  const els = {
    tabs: [...document.querySelectorAll(".tab")],
    panels: {
      gallery: document.getElementById("panel-gallery"),
      upload: document.getElementById("panel-upload"),
      settings: document.getElementById("panel-settings"),
    },
    grid: document.getElementById("grid"),
    status: document.getElementById("status"),
    refreshBtn: document.getElementById("refreshBtn"),
    dropzone: document.getElementById("dropzone"),
    fileInput: document.getElementById("fileInput"),
    queue: document.getElementById("queue"),
    form: document.getElementById("settingsForm"),
    cfgOwner: document.getElementById("cfgOwner"),
    cfgRepo: document.getElementById("cfgRepo"),
    cfgBranch: document.getElementById("cfgBranch"),
    cfgToken: document.getElementById("cfgToken"),
    clearToken: document.getElementById("clearToken"),
    repoLink: document.getElementById("repoLink"),
    toast: document.getElementById("toast"),
  };

  function loadConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { ...DEFAULTS, ...saved };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function saveConfig(cfg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }

  let config = loadConfig();

  function fillSettings() {
    els.cfgOwner.value = config.owner;
    els.cfgRepo.value = config.repo;
    els.cfgBranch.value = config.branch;
    els.cfgToken.value = config.token || "";
    els.repoLink.href = `https://github.com/${config.owner}/${config.repo}`;
    els.repoLink.textContent = `${config.owner}/${config.repo}`;
  }

  function cdnUrl(name) {
    return `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@${config.branch}/${config.path}/${name}`;
  }

  function toast(msg) {
    els.toast.hidden = false;
    els.toast.textContent = msg;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      els.toast.hidden = true;
    }, 2200);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("已复制 jsDelivr 链接");
    } catch {
      window.prompt("复制链接：", text);
    }
  }

  function setStatus(msg, show = true) {
    els.status.hidden = !show;
    els.status.textContent = msg || "";
  }

  function switchTab(name) {
    els.tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.tab === name));
    Object.entries(els.panels).forEach(([key, panel]) => {
      panel.classList.toggle("is-active", key === name);
    });
  }

  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  async function fetchManifest() {
    const url = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@${config.branch}/${config.path}/manifest.json`;
    const res = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("manifest missing");
    const data = await res.json();
    return (data.files || []).filter((f) => IMAGE_EXT.test(f));
  }

  async function fetchViaApi() {
    const headers = { Accept: "application/vnd.github+json" };
    if (config.token) headers.Authorization = `Bearer ${config.token}`;
    const res = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}?ref=${config.branch}`,
      { headers }
    );
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const data = await res.json();
    return data
      .filter((f) => f.type === "file" && IMAGE_EXT.test(f.name))
      .map((f) => f.name)
      .sort()
      .reverse();
  }

  function renderGrid(files) {
    els.grid.innerHTML = "";
    if (!files.length) {
      els.grid.innerHTML = `<div class="empty">还没有图片。去「上传」加一张吧。</div>`;
      return;
    }
    const frag = document.createDocumentFragment();
    for (const name of files) {
      const url = cdnUrl(name);
      const card = document.createElement("article");
      card.className = "card";
      card.title = "点击复制链接";
      card.innerHTML = `
        <img src="${url}" alt="${name}" loading="lazy" />
        <div class="meta"><strong>${name}</strong><span>复制</span></div>
      `;
      card.addEventListener("click", () => copyText(url));
      frag.appendChild(card);
    }
    els.grid.appendChild(frag);
  }

  async function loadGallery() {
    setStatus("加载中…");
    try {
      let files;
      try {
        files = await fetchManifest();
      } catch {
        files = await fetchViaApi();
      }
      renderGrid(files);
      setStatus("", false);
    } catch (err) {
      renderGrid([]);
      setStatus(`加载失败：${err.message}。可在设置里填 Token 后重试。`);
    }
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        resolve(result.split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function safeName(file) {
    const ext = (file.name.match(/\.[^.]+$/) || [".png"])[0].toLowerCase();
    const base = file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^\w\-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "img";
    const stamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d+Z$/, "")
      .replace("T", "-");
    return `${base}-${stamp}${ext}`;
  }

  async function githubGet(path) {
    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
    };
    const res = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`,
      { headers }
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`读取 ${path} 失败 (${res.status})`);
    return res.json();
  }

  async function githubPut(path, message, contentBase64, sha) {
    const body = {
      message,
      content: contentBase64,
      branch: config.branch,
    };
    if (sha) body.sha = sha;
    const res = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `写入失败 (${res.status})`);
    return data;
  }

  function utf8ToBase64(text) {
    return btoa(unescape(encodeURIComponent(text)));
  }

  async function updateManifest(newName) {
    const path = `${config.path}/manifest.json`;
    const existing = await githubGet(path);
    let files = [];
    if (existing?.content) {
      try {
        const json = JSON.parse(decodeURIComponent(escape(atob(existing.content.replace(/\n/g, "")))));
        files = Array.isArray(json.files) ? json.files : [];
      } catch {
        files = [];
      }
    }
    if (!files.includes(newName)) files.unshift(newName);
    files = files.filter((f) => IMAGE_EXT.test(f));
    const payload = {
      updatedAt: new Date().toISOString(),
      files,
    };
    await githubPut(
      path,
      `chore: update manifest after ${newName}`,
      utf8ToBase64(JSON.stringify(payload, null, 2)),
      existing?.sha
    );
  }

  async function uploadFile(file, row) {
    const msg = row.querySelector(".msg");
    if (!config.token) {
      msg.className = "msg err";
      msg.textContent = "请先在「设置」填写 GitHub Token";
      switchTab("settings");
      return;
    }
    if (file.size > MAX_BYTES) {
      msg.className = "msg err";
      msg.textContent = "超过 5MB";
      return;
    }
    if (!IMAGE_EXT.test(file.name)) {
      msg.className = "msg err";
      msg.textContent = "不支持的文件类型";
      return;
    }

    msg.className = "msg";
    msg.textContent = "上传中…";
    const name = safeName(file);
    try {
      const content = await toBase64(file);
      await githubPut(`${config.path}/${name}`, `upload: ${name}`, content);
      try {
        await updateManifest(name);
      } catch (manifestErr) {
        console.warn(manifestErr);
      }
      const url = cdnUrl(name);
      msg.className = "msg ok";
      msg.innerHTML = `<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`;
      await copyText(url);
      setTimeout(loadGallery, 1500);
    } catch (err) {
      msg.className = "msg err";
      msg.textContent = err.message || "上传失败";
    }
  }

  function enqueue(files) {
    for (const file of files) {
      const li = document.createElement("li");
      const preview = URL.createObjectURL(file);
      li.innerHTML = `
        <img src="${preview}" alt="" />
        <div>
          <p class="name">${file.name}</p>
          <p class="msg">等待上传</p>
        </div>
        <button type="button" class="ghost">上传</button>
      `;
      const btn = li.querySelector("button");
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        await uploadFile(file, li);
        btn.disabled = false;
      });
      els.queue.prepend(li);
      // auto start
      btn.click();
    }
  }

  els.dropzone.addEventListener("click", () => els.fileInput.click());
  els.dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      els.fileInput.click();
    }
  });
  els.fileInput.addEventListener("change", () => {
    enqueue([...els.fileInput.files]);
    els.fileInput.value = "";
  });

  ["dragenter", "dragover"].forEach((ev) => {
    els.dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      els.dropzone.classList.add("is-drag");
    });
  });
  ["dragleave", "drop"].forEach((ev) => {
    els.dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      els.dropzone.classList.remove("is-drag");
    });
  });
  els.dropzone.addEventListener("drop", (e) => {
    const files = [...(e.dataTransfer?.files || [])];
    if (files.length) enqueue(files);
  });

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    config = {
      ...config,
      owner: els.cfgOwner.value.trim() || DEFAULTS.owner,
      repo: els.cfgRepo.value.trim() || DEFAULTS.repo,
      branch: els.cfgBranch.value.trim() || DEFAULTS.branch,
      token: els.cfgToken.value.trim(),
    };
    saveConfig(config);
    fillSettings();
    toast("设置已保存");
    loadGallery();
  });

  els.clearToken.addEventListener("click", () => {
    config.token = "";
    els.cfgToken.value = "";
    saveConfig(config);
    toast("Token 已清除");
  });

  els.refreshBtn.addEventListener("click", loadGallery);

  fillSettings();
  loadGallery();
})();
