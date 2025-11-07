class FileBrowser {
  constructor(container, files, onFileSelect) {
    this.container = container;
    this.files = files;
    this.onFileSelect = onFileSelect;
    this.activePath = null;
    this.container.classList.add("file-browser");
    this.render();
  }

  render() {
    this.container.innerHTML = "";
    const tree = this.buildTree();
    const treeElement = this.renderTree(tree);
    this.container.appendChild(treeElement);
    this.highlightActivePath();
  }

  buildTree() {
    const tree = {};
    for (const file of this.files) {
      const parts = file.path.split("/");
      let current = tree;
      for (const part of parts) {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
    return tree;
  }

  renderTree(node, path = "") {
    const ul = document.createElement("ul");
    const entries = Object.entries(node).sort((a, b) => {
      const aIsFolder = Object.keys(a[1]).length > 0;
      const bIsFolder = Object.keys(b[1]).length > 0;
      if (aIsFolder !== bIsFolder) {
        return aIsFolder ? -1 : 1;
      }
      return a[0].localeCompare(b[0]);
    });

    for (const [name, children] of entries) {
      const fullPath = path ? `${path}/${name}` : name;
      const li = document.createElement("li");

      if (Object.keys(children).length === 0) {
        const item = this.createFileItem(name, fullPath);
        li.appendChild(item);
      } else {
        const item = this.createFolderItem(name);
        const nested = this.renderTree(children, fullPath);
        nested.classList.add("nested");
        const toggleIcon = item.querySelector(".toggle-icon");
        li.classList.add("folder-node");
        li.appendChild(item);
        li.appendChild(nested);
        item.addEventListener("click", (event) => {
          event.stopPropagation();
          const collapsed = li.classList.toggle("collapsed");
          toggleIcon.textContent = collapsed ? "chevron_right" : "expand_more";
        });
      }

      ul.appendChild(li);
    }

    return ul;
  }

  createFolderItem(name) {
    const item = document.createElement("div");
    item.className = "item folder-item";
    const toggleIcon = document.createElement("span");
    toggleIcon.className = "material-icons toggle-icon";
    toggleIcon.textContent = "expand_more";
    const folderIcon = document.createElement("span");
    folderIcon.className = "material-icons folder-icon";
    folderIcon.textContent = "folder";
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = name;
    item.append(toggleIcon, folderIcon, label);
    return item;
  }

  createFileItem(name, path) {
    const item = document.createElement("div");
    item.className = "item file-item";
    item.dataset.path = path;
    const icon = document.createElement("span");
    icon.className = "material-icons file-icon";
    icon.textContent = "insert_drive_file";
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = name;
    item.append(icon, label);
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      this.selectFile(path);
    });
    return item;
  }

  selectFile(path) {
    this.activePath = path;
    this.highlightActivePath();
    if (typeof this.onFileSelect === "function") {
      this.onFileSelect(path);
    }
  }

  highlightActivePath() {
    const items = this.container.querySelectorAll(".file-item");
    if (!this.activePath) {
      for (const item of items) {
        item.classList.remove("active");
      }
      return;
    }
    for (const item of items) {
      item.classList.toggle("active", item.dataset.path === this.activePath);
    }
  }
}

export default FileBrowser;
