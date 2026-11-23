let head3 = "";
head3 += `  // L\u01b0u D\u1ef1 \u00c1n (T\u1ea1o m\u1edbi ho\u1eb7c C\u1ea5p nh\u1eadt)
  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!projectForm.ten_du_an.trim()) {
      showToast("Vui l\u00f2ng nh\u1eadp t\u00ean n\u01a1i l\u00e0m vi\u1ec7c / d\u1ef1 \u00e1n", "danger");
      return;
    }
    if (editingProject) {
      const res = await api.updateDuAn(editingProject._id, projectForm);
      if (res.success) {
        setShowProjectModal(false);
        setEditingProject(null);
        showToast("C\u1ea5p nh\u1eadt d\u1ef1 \u00e1n th\u00e0nh c\u00f4ng v\u00e0 \u0111\u00e3 \u0111\u00f4ng b\u1ed3 l\u00ean L\u00edch! \u270F\uFE0F", "success");
        loadData();
        loadShifts();
      } else {
        showToast(res.message || "L\u1ed7i c\u1ea5p nh\u1eadt d\u1ef1 \u00e1n", "danger");
      }
    } else {
      const res = await api.createDuAn(projectForm);
      if (res.success) {
        setShowProjectModal(false);
        showToast("T\u1ea1o d\u1ef1 \u00e1n th\u00e0nh c\u00f4ng v\u00e0 \u0111\u00e3 t\u01b0\u01a1ng \u0111\u1ed9ng v\u00e0o L\u00edch! \u270F\uFE0F", "success");
        loadData();
        loadShifts();
      } else {
        showToast(res.message || "L\u1ed7i t\u1ea1o d\u1ef1 \u00e1n", "danger");
      }
    }
  };

  // X\u00f3a D\u1ef1 \u00c1n
  const handleDeleteProject = async (id, ten) => {
    if (window.confirm("B\u1ea1n c\u00f3 ch\u00e1c ch\u00e2n mu\u1ed1n x\u00f3a \"" + ten + "\"? T\u1ea5t c\u1ea3 c\u00f4ng vi\u1ec7c v\u00e0 ca l\u00e0m vi\u1ec7c tr\u00ean L\u00edch s\u1ebf b\u1ecb x\u00f3a.")) {
      const res = await api.deleteDuAn(id);
      if (res.success) {
        showToast("\u0110\u00e3 x\u00f3a d\u1ef1 \u00e1n th\u00e0nh c\u00f4ng", "success");
        if (selectedProjectId === id) {
          setSelectedProjectId(null);
        }
        loadData();
      } else {
        showToast(res.message || "L\u1ed7i x\u00f3a d\u1ef1 \u00e1n", "danger");
      }
    }
  };

  // T\u1ea1o Task M\u1edbi
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.tieu_de.trim()) {
      showToast("Vui l\u00f2ng nh\u1eadp ti\u00eau \u0111\u1ec1 c\u00f4ng vi\u1ec7c", "danger");
      return;
    }
    const res = await api.createCongViec(taskForm);
    if (res.success) {
      setShowTaskModal(false);
      showToast("Th\u00eam c\u00f4ng vi\u1ec7c th\u00e0nh c\u00f4ng v\u00e0 \u0111\u00e3 \u0111\u00f4ng b\u1ed3 v\u00e0o L\u00edch! \u23F0", "success");
      loadData();
      loadShifts();
    } else {
      showToast(res.message || "L\u1ed7i th\u00eam c\u00f4ng vi\u1ec7c", "danger");
    }
  };

  // X\u00f3a Task
  const handleDeleteTask = async (id, tieuDe) => {
    if (window.confirm("X\u00f3a c\u00f4ng vi\u1ec7c \"" + tieuDe + "\"? S\u1ef1 ki\u1ec7n tr\u00ean L\u00edch c\u00f9ng s\u1ebf b\u1ecb g\u1eafp b\u1ecf.")) {
      const res = await api.deleteCongViec(id);
      if (res.success) {
        showToast("\u0110\u00e3 x\u00f3a c\u00f4ng vi\u1ec7c kh\u1ecfi danh s\u00e1ch v\u00e0 L\u00edch", "success");
        loadData();
        loadShifts();
      } else {
        showToast(res.message || "L\u1ed7i x\u00f3a c\u00f4ng vi\u1ec7c", "danger");
      }
    }
  };

  // Toggle tr\u1ea1ng th\u00e1i Task
  const toggleTaskStatus = async (task) => {
    const nextStatus = task.trang_thai === "hoan_thanh" ? "chua_lam" : "hoan_thanh";
    const res = await api.updateCongViec(task._id, { trang_thai: nextStatus });
    if (res.success) {
      showToast(nextStatus === "hoan_thanh" ? "\u0110\u00e3 \u0111\u00e1nh d\u1ea5u ho\u00e0n th\u00e0nh task! \u2705" : "\u0110\u00e3 m\u1edf l\u1ea1i task", "success");
      loadData();
      loadShifts();
    }
  };

`;

module.exports = head3;
