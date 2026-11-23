let head = "";
head += `//Qu\u1ea3n l\u00fd D\u1ef1 \u00c1n, Task Kanban v\u00e0 Ca l\u00e0m vi\u1ec7c part-time t\u00edn l\u01b0\u01a1ng
import React, { useEffect, useState, useMemo } from "react";
import { api } from "../services/api";

const PRESET_COLORS = [
  { name: "Indigo", hex: "#6366f1" },
  { name: "Xanh bi\u00ean", hex: "#3b82f6" },
  { name: "Xanh l\u00e1", hex: "#10b981" },
  { name: "H\u1ed3 ph\u00e1ch", hex: "#f59e0b" },
  { name: "\u0110\u01a1 h\u1ed3ng", hex: "#ef4444" },
  { name: "T\u00edm", hex: "#8b5cf6" },
  { name: "H\u1ed3ng \u0111\u00e0o", hex: "#ec4899" }
];

const DAYS_OF_WEEK = [
  { day: 1, label: "T2", fullName: "Th\u1ee9 2" },
  { day: 2, label: "T3", fullName: "Th\u1ee9 3" },
  { day: 3, label: "T4", fullName: "Th\u1ee9 4" },
  { day: 4, label: "T5", fullName: "Th\u1ee9 5" },
  { day: 5, label: "T6", fullName: "Th\u1ee9 6" },
  { day: 6, label: "T7", fullName: "Th\u1ee9 7" },
  { day: 0, label: "CN", fullName: "Ch\u1ee7 Nh\u1eadt" }
];

export const ProjectsView = () => {
  // Danh s\u00e1ch d\u1ef1 \u00e1n / n\u01a1i l\u00e0m vi\u1ec7c
  const [duAns, setDuAns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Ca l\u00e0m vi\u1ec7c c\u01a1 d\u1ef1 \u00e1n \u0111ang xem chi ti\u1ebft
  const [shifts, setShifts] = useState([]);
  const [shiftStats, setShiftStats] = useState({});

  // Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSingleShiftModal, setShowSingleShiftModal] = useState(false);
  const [showBulkShiftModal, setShowBulkShiftModal] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // Form D\u1ef1 \u00c1n
  const [projectForm, setProjectForm] = useState({
    ten_du_an: "",
    mo_ta: "",
    loai_du_an: "part_time",
    luong_theo_gio: "",
    luong_co_ban: "",
    dia_chi: "",
    mau_sac: "#6366f1",
    ngay_bat_dau: new Date().toISOString().split("T")[0],
    ngay_ket_thuc: ""
  });

  // Form Task Todo
  const [taskForm, setTaskForm] = useState({
    tieu_de: "",
    du_an_id: "",
    mo_ta: "",
    do_uu_tien: "trung_binh",
    han_chot: ""
  });

  // Form Ca L\u00e0m Nhanh (\u0110\u01a1n l\u1eadp)
  const [singleShiftForm, setSingleShiftForm] = useState({
    du_an_id: "",
    tieu_de: "",
    ngay_lam: new Date().toISOString().split("T")[0],
    gio_bat_dau: "08:00",
    gio_ket_thuc: "12:00",
    luong_theo_gio: "",
    dia_diem: "",
    ghi_chu: ""
  });

  // Form Setup L\u00edch Tu\u1ea7n (H\u00e0ng lo\u1ea5t)
  const [bulkShiftForm, setBulkShiftForm] = useState({
    du_an_id: "",
    tieu_de: "",
    days_of_week: [1, 3, 5],
    gio_bat_dau: "08:00",
    gio_ket_thuc: "12:00",
    luong_theo_gio: "",
    tu_ngay: new Date().toISOString().split("T")[0],
    den_ngay: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    dia_diem: "",
    ghi_chu: ""
  });

  // T\u00ednh s\u1ed1 gi\u1edd gi\u1eefa 2 khung gi\u1edd HH:mm
  const calculateShiftHours = (start, end) => {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(":").map(Number);
    const [h2, m2] = end.split(":").map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff <= 0) diff += 24 * 60;
    return Math.round((diff / 60) * 10) / 10;
  };

  const singleShiftPreview = useMemo(() => {
    const hours = calculateShiftHours(singleShiftForm.gio_bat_dau, singleShiftForm.gio_ket_thuc);
    const rate = Number(singleShiftForm.luong_theo_gio) || 0;
    return { hours, totalSalary: Math.round(hours * rate) };
  }, [singleShiftForm.gio_bat_dau, singleShiftForm.gio_ket_thuc, singleShiftForm.luong_theo_gio]);

  const bulkShiftPreview = useMemo(() => {
    const hoursPerShift = calculateShiftHours(bulkShiftForm.gio_bat_dau, bulkShiftForm.gio_ket_thuc);
    const rate = Number(bulkShiftForm.luong_theo_gio) || 0;
    const salaryPerShift = Math.round(hoursPerShift * rate);
    const numDays = bulkShiftForm.days_of_week?.length || 0;
    return { hoursPerShift, salaryPerShift, weeklySalary: salaryPerShift * numDays };
  }, [bulkShiftForm.gio_bat_dau, bulkShiftForm.gio_ket_thuc, bulkShiftForm.luong_theo_gio, bulkShiftForm.days_of_week]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

`;

module.exports = head;
