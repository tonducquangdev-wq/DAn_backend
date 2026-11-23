let head2 = "";
head2 += `  // N\u1eadp d\u1eef li\u1ec7u
  const loadData = () => {
    api.getDuAn().then((res) => {
      if (res.success) {
        setDuAns(res.data || []);
      }
    });
    api.getCongViec().then((res) => {
      if (res.success) {
        setTasks(res.data || []);
      }
    });
  };

  // N\u1eadp ca l\u00e0m vi\u1ec7c c\u01a1 d\u1ef1 \u00e1n \u0111ang xem chi ti\u1ebft
  const loadShifts = () => {
    if (!selectedProjectId) return;
    const query = "\u003fdu_an_id=" + selectedProjectId;
    api.getCaLamViec(query).then((res) => {
      if (res.success) {
        setShifts(res.data || []);
        setShiftStats(res.stats || {});
      }
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadShifts();
  }, [selectedProjectId]);

  // C\u00e1c d\u1ef1 \u00e1n Part-time
  const partTimeProjects = useMemo(() => {
    return duAns.filter((d) => d.loai_du_an === "part_time");
  }, [duAns]);

  // D\u1ef1 \u00e1n \u0111ang ch\u1ecdn (m\u00e0n chi ti\u1ebft)
  const selectedProject = useMemo(() => duAns.find((d) => d._id === selectedProjectId), [duAns, selectedProjectId]);

  // Quay l\u1ea1i m\u00e0n h\u00ecnh danh s\u00e1ch d\u1ef1 \u00e1n
  const handleBackToList = () => {
    setSelectedProjectId(null);
  };

  // Handler m\u1edf Modal Task
  const handleOpenTaskModal = (defaultProjectId = "") => {
    setTaskForm({
      tieu_de: "",
      du_an_id: defaultProjectId || selectedProjectId || "",
      mo_ta: "",
      do_uu_tien: "trung_binh",
      han_chot: ""
    });
    setShowTaskModal(true);
  };

  // Handler m\u1edf Modal Ca L\u00e0m Nhanh
  const handleOpenSingleShiftModal = (defaultProjectId = "") => {
    const pId = defaultProjectId || selectedProjectId || (partTimeProjects[0]?._id || "");
    const selectedProj = duAns.find((d) => d._id === pId);
    setSingleShiftForm({
      du_an_id: pId,
      tieu_de: "",
      ngay_lam: new Date().toISOString().split("T")[0],
      gio_bat_dau: "08:00",
      gio_ket_thuc: "12:00",
      luong_theo_gio: selectedProj?.luong_theo_gio !== undefined ? selectedProj.luong_theo_gio : "",
      dia_diem: selectedProj?.dia_chi || "",
      ghi_chu: ""
    });
    setShowSingleShiftModal(true);
  };

  // Handler m\u1edf Modal Bulk Shift
  const handleOpenBulkShiftModal = () => {
    const pId = selectedProjectId || partTimeProjects[0]?._id || "";
    const selectedProj = duAns.find((d) => d._id === pId);
    setBulkShiftForm({
      du_an_id: pId,
      tieu_de: "",
      days_of_week: [1, 3, 5],
      gio_bat_dau: "08:00",
      gio_ket_thuc: "12:00",
      luong_theo_gio: selectedProj?.luong_theo_gio !== undefined ? selectedProj.luong_theo_gio : "",
      tu_ngay: new Date().toISOString().split("T")[0],
      den_ngay: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      dia_diem: selectedProj?.dia_chi || "",
      ghi_chu: ""
    });
    setShowBulkShiftModal(true);
  };

`;

module.exports = head2;
