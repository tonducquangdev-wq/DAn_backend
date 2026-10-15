import React, { useEffect, useState, useRef } from "react";
import { api } from "../services/api";
import "../styles/tap-luyen.css";

// Helper map ngày trong tuần theo chuẩn VN (2 = T2, ..., 8 = CN)
const DAYS_OF_WEEK = [
  { day: 2, label: "T2", fullName: "Thứ Hai" },
  { day: 3, label: "T3", fullName: "Thứ Ba" },
  { day: 4, label: "T4", fullName: "Thứ Tư" },
  { day: 5, label: "T5", fullName: "Thứ Năm" },
  { day: 6, label: "T6", fullName: "Thứ Sáu" },
  { day: 7, label: "T7", fullName: "Thứ Bảy" },
  { day: 8, label: "CN", fullName: "Chủ Nhật" }
];

// Danh sách các giáo án mẫu khoa học được hệ thống tính toán sẵn
const WORKOUT_TEMPLATES = [
  // 2 buổi/tuần
  {
    id: "full_body_2",
    frequency: 2,
    title: "Giáo Án Full Body Compound (2 Buổi / Tuần)",
    desc: "Tối ưu hóa thời gian tối đa cho người bận rộn. Kích thích toàn thân với các bài tập phức hợp compound lớn.",
    tag: "Tối Giản & Duy Trì",
    suitable: "Người cực kỳ bận rộn, người mới bắt đầu",
    days: [
      {
        day: 2,
        name: "Buổi 1: Full Body Heavy (Ngực - Lưng - Đùi)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Barbell Back Squat", nhom_co: "Đùi trước & Mông", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 15 },
          { ten_bai_tap: "Barbell Bench Press", nhom_co: "Ngực", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Barbell Bent Over Row", nhom_co: "Lưng giữa", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Plank Cổ Điển", nhom_co: "Cơ bụng & Core", loai_bai_tap: "core", sets: 3, reps: 45, mins: 8 }
        ]
      },
      { day: 3, name: "Nghỉ ngơi phục hồi (Rest Day)", isRest: true, gio_bat_dau: "06:00", gio_ket_thuc: "07:00", exercises: [] },
      { day: 4, name: "Nghỉ ngơi phục hồi (Rest Day)", isRest: true, gio_bat_dau: "06:00", gio_ket_thuc: "07:00", exercises: [] },
      {
        day: 5,
        name: "Buổi 2: Full Body Hypertrophy (Đùi sau - Vai - Xô)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Romanian Deadlift", nhom_co: "Đùi sau & Lưng dưới", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 15 },
          { ten_bai_tap: "Overhead Dumbbell Press", nhom_co: "Vai", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Lat Pulldown", nhom_co: "Lưng xô", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Bicep Barbell Curl", nhom_co: "Tay trước", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 }
        ]
      },
      { day: 6, name: "Nghỉ ngơi phục hồi (Rest Day)", isRest: true, gio_bat_dau: "06:00", gio_ket_thuc: "07:00", exercises: [] },
      { day: 7, name: "Nghỉ ngơi phục hồi (Rest Day)", isRest: true, gio_bat_dau: "06:00", gio_ket_thuc: "07:00", exercises: [] },
      { day: 8, name: "Nghỉ ngơi phục hồi (Rest Day)", isRest: true, gio_bat_dau: "06:00", gio_ket_thuc: "07:00", exercises: [] }
    ]
  },
  // 3 buổi/tuần
  {
    id: "full_body_3",
    frequency: 3,
    title: "Giáo Án Full Body Toàn Thân (3 Buổi Tiêu Chuẩn)",
    desc: "Kích thích toàn bộ các nhóm cơ chính 3 lần mỗi tuần. Tối ưu thời gian và phục hồi hoàn hảo.",
    tag: "Khởi Đầu & Toàn Diện",
    suitable: "Người bận rộn, người mới hoặc duy trì thể lực",
    days: [
      {
        day: 2,
        name: "Buổi 1: Full Body A (Ngực - Lưng - Đùi trước)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Barbell Back Squat", nhom_co: "Đùi trước & Mông", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 15 },
          { ten_bai_tap: "Barbell Bench Press", nhom_co: "Ngực", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Barbell Bent Over Row", nhom_co: "Lưng giữa", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Plank Cổ Điển", nhom_co: "Cơ bụng & Core", loai_bai_tap: "core", sets: 3, reps: 45, mins: 8 }
        ]
      },
      { day: 3, name: "Nghỉ ngơi phục hồi (Rest Day)", isRest: true, gio_bat_dau: "06:00", gio_ket_thuc: "07:00", exercises: [] },
      {
        day: 4,
        name: "Buổi 2: Full Body B (Đùi sau - Ngực trên - Xô)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Romanian Deadlift", nhom_co: "Đùi sau & Lưng dưới", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 15 },
          { ten_bai_tap: "Incline Dumbbell Press", nhom_co: "Ngực trên", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 12 },
          { ten_bai_tap: "Lat Pulldown", nhom_co: "Lưng xô", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Bicep Barbell Curl", nhom_co: "Tay trước", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 }
        ]
      },
      { day: 5, name: "Nghỉ ngơi phục hồi (Rest Day)", isRest: true, gio_bat_dau: "06:00", gio_ket_thuc: "07:00", exercises: [] },
      {
        day: 6,
        name: "Buổi 3: Full Body C (Đùi - Vai - Lưng giữa)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Leg Press", nhom_co: "Đùi & Mông", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 12 },
          { ten_bai_tap: "Overhead Dumbbell Press", nhom_co: "Vai", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Seated Cable Row", nhom_co: "Lưng giữa", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Tricep Rope Pushdown", nhom_co: "Tay sau", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 }
        ]
      },
      { day: 7, name: "Nghỉ ngơi phục hồi (Rest Day)", isRest: true, gio_bat_dau: "06:00", gio_ket_thuc: "07:00", exercises: [] },
      { day: 8, name: "Nghỉ ngơi nạp năng lượng (Rest Day)", isRest: true, gio_bat_dau: "06:00", gio_ket_thuc: "07:00", exercises: [] }
    ]
  },
  // 4 buổi/tuần
  {
    id: "upper_lower_4",
    frequency: 4,
    title: "Giáo Án Upper / Lower Split (4 Buổi Tiêu Chuẩn)",
    desc: "Tiêu chuẩn vàng của thể hình hiện đại. 2 buổi Thân Trên & 2 buổi Thân Dưới xen kẽ ngày nghỉ để phục hồi tối ưu.",
    tag: "Phổ Biến & Hiệu Quả Nhất",
    suitable: "Cân bằng hoàn hảo cơ bắp & nghỉ ngơi",
    days: [
      {
        day: 2,
        name: "Buổi 1: Upper Power (Thân Trên Sức Mạnh)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Barbell Bench Press", nhom_co: "Ngực", loai_bai_tap: "strength", sets: 4, reps: 8, mins: 15 },
          { ten_bai_tap: "Barbell Bent Over Row", nhom_co: "Lưng giữa", loai_bai_tap: "strength", sets: 4, reps: 8, mins: 15 },
          { ten_bai_tap: "Overhead Dumbbell Press", nhom_co: "Vai", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Tricep Rope Pushdown", nhom_co: "Tay sau", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 }
        ]
      },
      {
        day: 3,
        name: "Buổi 2: Lower Power (Thân Dưới Sức Mạnh)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Barbell Back Squat", nhom_co: "Đùi trước & Mông", loai_bai_tap: "strength", sets: 4, reps: 8, mins: 15 },
          { ten_bai_tap: "Romanian Deadlift", nhom_co: "Đùi sau & Lưng dưới", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Leg Press", nhom_co: "Đùi & Mông", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 12 },
          { ten_bai_tap: "Standing Calf Raise", nhom_co: "Bắp chân", loai_bai_tap: "strength", sets: 3, reps: 15, mins: 8 }
        ]
      },
      { day: 4, name: "Nghỉ ngơi phục hồi (Rest Day)", isRest: true, gio_bat_dau: "06:00", gio_ket_thuc: "07:00", exercises: [] },
      {
        day: 5,
        name: "Buổi 3: Upper Hypertrophy (Thân Trên Tăng Cơ)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Incline Dumbbell Press", nhom_co: "Ngực trên", loai_bai_tap: "strength", sets: 4, reps: 10, mins: 12 },
          { ten_bai_tap: "Lat Pulldown", nhom_co: "Lưng xô", loai_bai_tap: "strength", sets: 4, reps: 10, mins: 12 },
          { ten_bai_tap: "Dumbbell Lateral Raise", nhom_co: "Vai giữa", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 },
          { ten_bai_tap: "Bicep Barbell Curl", nhom_co: "Tay trước", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 }
        ]
      },
      {
        day: 6,
        name: "Buổi 4: Lower Hypertrophy (Thân Dưới Tăng Cơ & Bụng)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Dumbbell Walking Lunge", nhom_co: "Đùi & Mông", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 12 },
          { ten_bai_tap: "Leg Extension", nhom_co: "Đùi trước", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 },
          { ten_bai_tap: "Hamstring Curl Machine", nhom_co: "Đùi sau", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 },
          { ten_bai_tap: "Plank Cổ Điển", nhom_co: "Cơ bụng & Core", loai_bai_tap: "core", sets: 3, reps: 60, mins: 8 }
        ]
      },
      { day: 7, name: "Nghỉ ngơi phục hồi (Rest Day)", isRest: true, gio_bat_dau: "06:00", gio_ket_thuc: "07:00", exercises: [] },
      { day: 8, name: "Nghỉ ngơi thư giãn cuối tuần (Rest Day)", isRest: true, gio_bat_dau: "06:00", gio_ket_thuc: "07:00", exercises: [] }
    ]
  },
  // 5 buổi/tuần
  {
    id: "ppl_ul_5",
    frequency: 5,
    title: "Giáo Án Push - Pull - Legs + Upper - Lower (5 Buổi)",
    desc: "Kết hợp PPL và Upper/Lower, kích thích cơ bắp 2 lần/tuần với khối lượng tập luyện cao.",
    tag: "Khối Lượng Cao & Nâng Cao",
    suitable: "Gymer đã tập 6 tháng trở lên",
    days: [
      {
        day: 2,
        name: "Buổi 1: Push Day (Ngực - Vai - Tay sau)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Barbell Bench Press", nhom_co: "Ngực", loai_bai_tap: "strength", sets: 4, reps: 8, mins: 15 },
          { ten_bai_tap: "Overhead Dumbbell Press", nhom_co: "Vai", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Incline Dumbbell Press", nhom_co: "Ngực trên", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 12 },
          { ten_bai_tap: "Tricep Rope Pushdown", nhom_co: "Tay sau", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 }
        ]
      },
      {
        day: 3,
        name: "Buổi 2: Pull Day (Lưng - Xô - Tay trước)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Barbell Bent Over Row", nhom_co: "Lưng giữa", loai_bai_tap: "strength", sets: 4, reps: 8, mins: 15 },
          { ten_bai_tap: "Lat Pulldown", nhom_co: "Lưng xô", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Face Pull (Dây Kéo Mặt)", nhom_co: "Vai sau", loai_bai_tap: "strength", sets: 3, reps: 15, mins: 10 },
          { ten_bai_tap: "Bicep Barbell Curl", nhom_co: "Tay trước", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 }
        ]
      },
      {
        day: 4,
        name: "Buổi 3: Legs Day (Đùi - Mông - Bắp chân)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Barbell Back Squat", nhom_co: "Đùi trước & Mông", loai_bai_tap: "strength", sets: 4, reps: 8, mins: 15 },
          { ten_bai_tap: "Romanian Deadlift", nhom_co: "Đùi sau & Lưng dưới", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Leg Press", nhom_co: "Đùi & Mông", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 12 },
          { ten_bai_tap: "Plank Cổ Điển", nhom_co: "Cơ bụng & Core", loai_bai_tap: "core", sets: 3, reps: 60, mins: 8 }
        ]
      },
      { day: 5, name: "Nghỉ ngơi phục hồi (Rest Day)", isRest: true, gio_bat_dau: "06:00", gio_ket_thuc: "07:00", exercises: [] },
      {
        day: 6,
        name: "Buổi 4: Upper Body (Thân Trên Tổng Hợp)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Dumbbell Bench Press", nhom_co: "Ngực", loai_bai_tap: "strength", sets: 4, reps: 10, mins: 12 },
          { ten_bai_tap: "Seated Cable Row", nhom_co: "Lưng giữa", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Dumbbell Lateral Raise", nhom_co: "Vai giữa", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 },
          { ten_bai_tap: "Hammer Curl", nhom_co: "Tay trước", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 }
        ]
      },
      {
        day: 7,
        name: "Buổi 5: Lower Body & Core (Thân Dưới & Bụng)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Leg Press", nhom_co: "Đùi & Mông", loai_bai_tap: "strength", sets: 4, reps: 12, mins: 12 },
          { ten_bai_tap: "Hamstring Curl Machine", nhom_co: "Đùi sau", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 },
          { ten_bai_tap: "Standing Calf Raise", nhom_co: "Bắp chân", loai_bai_tap: "strength", sets: 3, reps: 15, mins: 8 },
          { ten_bai_tap: "Russian Twist", nhom_co: "Cơ liên sườn", loai_bai_tap: "core", sets: 3, reps: 20, mins: 8 }
        ]
      },
      { day: 8, name: "Nghỉ ngơi phục hồi (Rest Day)", isRest: true, gio_bat_dau: "06:00", gio_ket_thuc: "07:00", exercises: [] }
    ]
  },
  // 6 buổi/tuần
  {
    id: "ppl_2x_6",
    frequency: 6,
    title: "Giáo Án PPL 2 Vòng (6 Buổi Chuyên Sâu)",
    desc: "Push - Pull - Legs lặp lại 2 vòng mỗi tuần. Khối lượng và áp lực cao nhất cho người tập chuyên nghiệp.",
    tag: "Chuyên Sâu Thể Hình",
    suitable: "Vận động viên hoặc gymer thâm niên",
    days: [
      {
        day: 2,
        name: "Buổi 1: Push A (Ngực nặng - Vai - Tay sau)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Barbell Bench Press", nhom_co: "Ngực", loai_bai_tap: "strength", sets: 4, reps: 8, mins: 15 },
          { ten_bai_tap: "Overhead Dumbbell Press", nhom_co: "Vai", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Incline Dumbbell Press", nhom_co: "Ngực trên", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 12 },
          { ten_bai_tap: "Tricep Rope Pushdown", nhom_co: "Tay sau", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 }
        ]
      },
      {
        day: 3,
        name: "Buổi 2: Pull A (Lưng nặng - Xô - Tay trước)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Barbell Bent Over Row", nhom_co: "Lưng giữa", loai_bai_tap: "strength", sets: 4, reps: 8, mins: 15 },
          { ten_bai_tap: "Lat Pulldown", nhom_co: "Lưng xô", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Seated Cable Row", nhom_co: "Lưng giữa", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 },
          { ten_bai_tap: "Bicep Barbell Curl", nhom_co: "Tay trước", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 }
        ]
      },
      {
        day: 4,
        name: "Buổi 3: Legs A (Squat nặng - Đùi - Bắp chân)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Barbell Back Squat", nhom_co: "Đùi trước & Mông", loai_bai_tap: "strength", sets: 4, reps: 8, mins: 15 },
          { ten_bai_tap: "Romanian Deadlift", nhom_co: "Đùi sau & Lưng dưới", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Leg Press", nhom_co: "Đùi & Mông", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 12 },
          { ten_bai_tap: "Standing Calf Raise", nhom_co: "Bắp chân", loai_bai_tap: "strength", sets: 3, reps: 15, mins: 8 }
        ]
      },
      {
        day: 5,
        name: "Buổi 4: Push B (Vai nặng - Ngực trên - Tay sau)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Overhead Dumbbell Press", nhom_co: "Vai", loai_bai_tap: "strength", sets: 4, reps: 8, mins: 15 },
          { ten_bai_tap: "Incline Dumbbell Press", nhom_co: "Ngực trên", loai_bai_tap: "strength", sets: 4, reps: 10, mins: 12 },
          { ten_bai_tap: "Dumbbell Lateral Raise", nhom_co: "Vai giữa", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 },
          { ten_bai_tap: "Push-up (Hít Đất)", nhom_co: "Ngực & Tay sau", loai_bai_tap: "strength", sets: 3, reps: 15, mins: 10 }
        ]
      },
      {
        day: 6,
        name: "Buổi 5: Pull B (Xô nặng - Lưng - Tay trước)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Lat Pulldown", nhom_co: "Lưng xô", loai_bai_tap: "strength", sets: 4, reps: 10, mins: 15 },
          { ten_bai_tap: "Seated Cable Row", nhom_co: "Lưng giữa", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 12 },
          { ten_bai_tap: "Face Pull (Dây Kéo Mặt)", nhom_co: "Vai sau", loai_bai_tap: "strength", sets: 3, reps: 15, mins: 10 },
          { ten_bai_tap: "Hammer Curl", nhom_co: "Tay trước", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 }
        ]
      },
      {
        day: 7,
        name: "Buổi 6: Legs B (Đùi sau - Mông - Bụng)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Romanian Deadlift", nhom_co: "Đùi sau & Lưng dưới", loai_bai_tap: "strength", sets: 4, reps: 8, mins: 15 },
          { ten_bai_tap: "Leg Press", nhom_co: "Đùi & Mông", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 12 },
          { ten_bai_tap: "Plank Cổ Điển", nhom_co: "Cơ bụng & Core", loai_bai_tap: "core", sets: 3, reps: 60, mins: 8 },
          { ten_bai_tap: "Russian Twist", nhom_co: "Cơ liên sườn", loai_bai_tap: "core", sets: 3, reps: 20, mins: 8 }
        ]
      },
      { day: 8, name: "Nghỉ ngơi phục hồi (Rest Day)", isRest: true, gio_bat_dau: "06:00", gio_ket_thuc: "07:00", exercises: [] }
    ]
  },
  // 7 buổi/tuần
  {
    id: "pro_split_7",
    frequency: 7,
    title: "Giáo Án Chuyên Nghiệp 7 Ngày (6 Kháng Lực + 1 Phục Hồi Tích Cực)",
    desc: "Lịch tập dành cho vận động viên và gymer duy trì nhịp tập đều đặn mỗi ngày kèm 1 buổi giãn cơ Cardio nhẹ.",
    tag: "Chuyên Nghiệp & Kỷ Luật",
    suitable: "Vận động viên hoặc gymer thâm niên",
    days: [
      {
        day: 2,
        name: "Buổi 1: Push A (Ngực - Vai - Tay sau)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Barbell Bench Press", nhom_co: "Ngực", loai_bai_tap: "strength", sets: 4, reps: 8, mins: 15 },
          { ten_bai_tap: "Overhead Dumbbell Press", nhom_co: "Vai", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Incline Dumbbell Press", nhom_co: "Ngực trên", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 12 },
          { ten_bai_tap: "Tricep Rope Pushdown", nhom_co: "Tay sau", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 }
        ]
      },
      {
        day: 3,
        name: "Buổi 2: Pull A (Lưng - Xô - Tay trước)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Barbell Bent Over Row", nhom_co: "Lưng giữa", loai_bai_tap: "strength", sets: 4, reps: 8, mins: 15 },
          { ten_bai_tap: "Lat Pulldown", nhom_co: "Lưng xô", loai_bai_tap: "strength", sets: 3, reps: 10, mins: 12 },
          { ten_bai_tap: "Face Pull (Dây Kéo Mặt)", nhom_co: "Vai sau", loai_bai_tap: "strength", sets: 3, reps: 15, mins: 10 },
          { ten_bai_tap: "Bicep Barbell Curl", nhom_co: "Tay trước", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 }
        ]
      },
      {
        day: 4,
        name: "Buổi 3: Legs A (Đùi trước - Mông - Bắp chân)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Barbell Back Squat", nhom_co: "Đùi trước & Mông", loai_bai_tap: "strength", sets: 4, reps: 8, mins: 15 },
          { ten_bai_tap: "Leg Press", nhom_co: "Đùi & Mông", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 12 },
          { ten_bai_tap: "Standing Calf Raise", nhom_co: "Bắp chân", loai_bai_tap: "strength", sets: 4, reps: 15, mins: 10 },
          { ten_bai_tap: "Plank Cổ Điển", nhom_co: "Cơ bụng & Core", loai_bai_tap: "core", sets: 3, reps: 45, mins: 8 }
        ]
      },
      {
        day: 5,
        name: "Buổi 4: Push B (Ngực trên - Vai giữa - Tay sau)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Incline Dumbbell Press", nhom_co: "Ngực trên", loai_bai_tap: "strength", sets: 4, reps: 10, mins: 12 },
          { ten_bai_tap: "Dumbbell Lateral Raise", nhom_co: "Vai giữa", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 },
          { ten_bai_tap: "Push-up (Hít Đất)", nhom_co: "Ngực & Tay sau", loai_bai_tap: "strength", sets: 3, reps: 15, mins: 10 }
        ]
      },
      {
        day: 6,
        name: "Buổi 5: Pull B (Xô nặng - Lưng - Tay trước)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Lat Pulldown", nhom_co: "Lưng xô", loai_bai_tap: "strength", sets: 4, reps: 10, mins: 15 },
          { ten_bai_tap: "Seated Cable Row", nhom_co: "Lưng giữa", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 12 },
          { ten_bai_tap: "Hammer Curl", nhom_co: "Tay trước", loai_bai_tap: "strength", sets: 3, reps: 12, mins: 10 }
        ]
      },
      {
        day: 7,
        name: "Buổi 6: Legs B (Đùi sau - Mông - Bụng)",
        isRest: false,
        gio_bat_dau: "17:30",
        gio_ket_thuc: "18:45",
        exercises: [
          { ten_bai_tap: "Romanian Deadlift", nhom_co: "Đùi sau & Lưng dưới", loai_bai_tap: "strength", sets: 4, reps: 8, mins: 15 },
          { ten_bai_tap: "Russian Twist", nhom_co: "Cơ liên sườn", loai_bai_tap: "core", sets: 3, reps: 20, mins: 8 }
        ]
      },
      {
        day: 8,
        name: "Buổi 7: Active Recovery (Cardio nhẹ & Giãn cơ toàn thân)",
        isRest: false,
        gio_bat_dau: "06:30",
        gio_ket_thuc: "07:30",
        exercises: [
          { ten_bai_tap: "Đi bộ dốc nhẹ (Incline Walk)", nhom_co: "Tim mạch & Bắp chân", loai_bai_tap: "cardio", sets: 1, reps: 30, mins: 30 },
          { ten_bai_tap: "Giãn cơ toàn thân (Full Body Stretch)", nhom_co: "Toàn thân", loai_bai_tap: "core", sets: 3, reps: 10, mins: 20 }
        ]
      }
    ]
  }
];

// Danh sách tổ hợp ngày tập mẫu phổ biến
const WORKOUT_DAY_PRESETS = [
  { label: "T2 - T4 - T6", days: [2, 4, 6], count: 3, desc: "3 buổi cách ngày" },
  { label: "T3 - T5 - T7", days: [3, 5, 7], count: 3, desc: "3 buổi cách ngày" },
  { label: "T2 - T3 - T5 - T6", days: [2, 3, 5, 6], count: 4, desc: "4 buổi tiêu chuẩn" },
  { label: "T2 - T4 - T6 - CN", days: [2, 4, 6, 8], count: 4, desc: "4 buổi cách ngày" },
  { label: "T2 đến T6", days: [2, 3, 4, 5, 6], count: 5, desc: "5 buổi ngày thường" },
  { label: "T2 đến T7", days: [2, 3, 4, 5, 6, 7], count: 6, desc: "6 buổi chuyên sâu" }
];

// Helper ánh xạ danh sách bài tập của template sang các ngày tập do người dùng tùy chọn
const mapTemplateToSelectedDays = (template, selectedDays = []) => {
  if (!template) {
    return DAYS_OF_WEEK.map((d) => {
      const isSelected = selectedDays.includes(d.day);
      const dayOrder = selectedDays.indexOf(d.day) + 1;
      return {
        day: d.day,
        name: isSelected ? `Buổi tập ${dayOrder}` : "Nghỉ ngơi phục hồi (Rest Day)",
        isRest: !isSelected,
        gio_bat_dau: isSelected ? "17:30" : "06:00",
        gio_ket_thuc: isSelected ? "18:45" : "07:00",
        exercises: []
      };
    });
  }

  // Lọc các buổi tập thực tế (không phải ngày nghỉ) trong template
  const activeWorkouts = template.days.filter((d) => !d.isRest);

  return DAYS_OF_WEEK.map((d) => {
    const isSelected = selectedDays.includes(d.day);
    if (!isSelected) {
      return {
        day: d.day,
        name: "Nghỉ ngơi phục hồi (Rest Day)",
        isRest: true,
        gio_bat_dau: "06:00",
        gio_ket_thuc: "07:00",
        exercises: []
      };
    }

    const dayIndexInSelected = selectedDays.indexOf(d.day);
    const workoutSession = activeWorkouts[dayIndexInSelected % activeWorkouts.length];

    if (workoutSession) {
      return {
        ...workoutSession,
        day: d.day,
        isRest: false,
        name: workoutSession.name
      };
    }

    return {
      day: d.day,
      name: `Buổi tập ${dayIndexInSelected + 1}`,
      isRest: false,
      gio_bat_dau: "17:30",
      gio_ket_thuc: "18:45",
      exercises: []
    };
  });
};

export const WorkoutView = ({ onNavigateToCalendar }) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState("today"); // "today" | "plans" | "history"

  // Dữ liệu từ API
  const [scheduleData, setScheduleData] = useState(null);
  const [plansList, setPlansList] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [exerciseCatalog, setExerciseCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ngày đang chọn trên Weekly Strip
  const getTodayDayNumber = () => {
    const jsDay = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    return jsDay === 0 ? 8 : jsDay + 1; // 0->8, 1->2, 2->3...
  };
  const [selectedDay, setSelectedDay] = useState(getTodayDayNumber());

  // Trạng thái bài tập & checklist
  const [completedExercises, setCompletedExercises] = useState([]);
  const [activeExercise, setActiveExercise] = useState(null);

  // Đồng hồ tập luyện (Stopwatch) & Rest timer
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchRef = useRef(null);

  const [restCountdown, setRestCountdown] = useState(0);
  const restTimerRef = useRef(null);

  // Modals state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ ten_ke_hoach: "", mo_ta: "", is_active: false });

  // State phục vụ Wizard thiết kế giáo án từng bước
  const [wizardStep, setWizardStep] = useState(1); // 1: Tần suất & Cường độ | 2: Giáo án gợi ý & Bài tập | 3: Giờ tập & Đồng bộ
  const [slideDirection, setSlideDirection] = useState("next"); // "next" (trượt từ phải sang) | "prev" (trượt từ trái sang)
  const [wizardFrequency, setWizardFrequency] = useState(4); // 2, 3, 4, 5, 6, 7 buổi/tuần
  const [wizardSelectedDays, setWizardSelectedDays] = useState([2, 3, 5, 6]); // Mặc định 4 buổi: Thứ 2, Thứ 3, Thứ 5, Thứ 6
  const [wizardIntensity, setWizardIntensity] = useState("intermediate"); // beginner | intermediate | advanced
  const [selectedTemplateId, setSelectedTemplateId] = useState("upper_lower_4");
  const [previewDayIndex, setPreviewDayIndex] = useState(0);
  const [wizardSessions, setWizardSessions] = useState([]);
  const [wizardSyncCalendar, setWizardSyncCalendar] = useState(true);
  const [wizardIsActive, setWizardIsActive] = useState(true);
  const [wizardPlanName, setWizardPlanName] = useState("Giáo Án Upper / Lower Split (4 Buổi Tiêu Chuẩn)");
  const [wizardPlanDesc, setWizardPlanDesc] = useState("Tiêu chuẩn vàng của thể hình hiện đại. 2 buổi Thân Trên & 2 buổi Thân Dưới xen kẽ ngày nghỉ để phục hồi tối ưu.");
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [wizardCustomExercises, setWizardCustomExercises] = useState({}); // { [dayNum]: [exerciseObj, ...] }
  const [showWizardAddExModal, setShowWizardAddExModal] = useState(false);
  const [wizardTargetDay, setWizardTargetDay] = useState(2);
  const [wizardExForm, setWizardExForm] = useState({
    bai_tap_the_chat_id: "",
    ten_bai_tap: "",
    nhom_co: "Ngực",
    loai_bai_tap: "strength",
    sets: 4,
    reps: 10,
    mins: 12
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState(null);
  const [planDetailSessions, setPlanDetailSessions] = useState([]);

  const [showAddExModal, setShowAddExModal] = useState(false);
  const [currentBuoiForEx, setCurrentBuoiForEx] = useState(null);
  const [exForm, setExForm] = useState({
    bai_tap_the_chat_id: "",
    ten_bai_tap: "",
    nhom_co: "Ngực",
    loai_bai_tap: "strength",
    so_sets: 3,
    so_reps: 10,
    thoi_luong_phut: 10
  });

  const [showEditDetailModal, setShowEditDetailModal] = useState(false);
  const [editingDetail, setEditingDetail] = useState(null);
  const [detailForm, setDetailForm] = useState({ so_sets: 3, so_reps: 10, thoi_luong_phut: "" });

  // =========================================================================
  // STATE CỘNG ĐỒNG GYMMER & CHIA SẺ MÃ CODE (COMMUNITY & SHARE CODE)
  // =========================================================================
  const [communityPlans, setCommunityPlans] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [communityFreqFilter, setCommunityFreqFilter] = useState("all");
  const [communitySearch, setCommunitySearch] = useState("");
  const [quickCodeInput, setQuickCodeInput] = useState("");
  const [previewModalData, setPreviewModalData] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isImportingPlan, setIsImportingPlan] = useState(false);
  const [importForm, setImportForm] = useState({ custom_name: "", activate_now: true, dong_bo_lich: true });
  const [shareModalPlan, setShareModalPlan] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareForm, setShareForm] = useState({ custom_code: "", is_public_community: true, the_loai: "Tăng cơ - Hypertrophy" });
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");

  // Nạp toàn bộ dữ liệu khi khởi động
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [scheduleRes, plansRes, reportRes, catalogRes] = await Promise.all([
        api.getWorkoutSchedule(),
        api.getWorkoutPlans(),
        api.getWorkoutReport(),
        api.getExerciseCatalog()
      ]);

      if (scheduleRes.success) setScheduleData(scheduleRes.data);
      if (plansRes.success) setPlansList(plansRes.data || []);
      if (reportRes.success) setReportData(reportRes.data);
      if (catalogRes.success) setExerciseCatalog(catalogRes.data || []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu tập luyện:", err);
    } finally {
      setLoading(false);
    }
  };

  // Nạp danh sách giáo án cộng đồng khám phá
  const loadCommunityPlans = async (freq = communityFreqFilter, search = communitySearch) => {
    try {
      setLoadingCommunity(true);
      let queryStr = "";
      const params = new URLSearchParams();
      if (freq && freq !== "all") params.append("frequency", freq);
      if (search && search.trim()) params.append("search", search.trim());
      const pStr = params.toString();
      if (pStr) queryStr = `?${pStr}`;

      const res = await api.getCommunityPlans(queryStr);
      if (res.success) {
        setCommunityPlans(res.data || []);
      }
    } catch (err) {
      console.error("Lỗi tải kế hoạch cộng đồng:", err);
    } finally {
      setLoadingCommunity(false);
    }
  };

  // Thả tim giáo án cộng đồng (Optimistic Update)
  const handleToggleLike = async (planId) => {
    try {
      setCommunityPlans((prev) =>
        prev.map((p) => {
          if (p._id === planId) {
            const nextLiked = !p.da_thich;
            return {
              ...p,
              da_thich: nextLiked,
              so_luot_thich: nextLiked ? (p.so_luot_thich || 0) + 1 : Math.max(0, (p.so_luot_thich || 1) - 1)
            };
          }
          return p;
        })
      );
      await api.toggleLikeCommunityPlan(planId);
    } catch (err) {
      console.error("Lỗi thả tim:", err);
    }
  };

  // Mở modal chia sẻ giáo án
  const handleOpenShareModal = (plan) => {
    setShareModalPlan(plan);
    setShareForm({
      custom_code: plan.share_code || "",
      is_public_community: plan.is_public_community !== false,
      the_loai: plan.the_loai || "Tăng cơ - Hypertrophy"
    });
    setCopyFeedback("");
    setShowShareModal(true);
  };

  // Sinh hoặc cập nhật mã chia sẻ
  const handleGenerateShareCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!shareModalPlan) return;
    try {
      setIsGeneratingCode(true);
      const res = await api.createShareCode(shareModalPlan._id, shareForm);
      if (res.success) {
        const updatedCode = res.data.share_code;
        setShareModalPlan((prev) => ({
          ...prev,
          share_code: updatedCode,
          is_public_community: res.data.is_public_community,
          the_loai: res.data.the_loai
        }));
        setPlansList((prev) =>
          prev.map((p) =>
            p._id === shareModalPlan._id
              ? { ...p, share_code: updatedCode, is_public_community: res.data.is_public_community, the_loai: res.data.the_loai }
              : p
          )
        );
        setCopyFeedback("🎉 Đã tạo mã chia sẻ thành công: " + updatedCode);
        setTimeout(() => setCopyFeedback(""), 3500);
      } else {
        alert("⚠️ " + res.message);
      }
    } catch (err) {
      console.error("Lỗi tạo share code:", err);
      alert("Không thể tạo mã code: " + err.message);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Copy mã code vào clipboard
  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopyFeedback(`Đã sao chép mã [ ${code} ] vào bộ nhớ tạm!`);
    setTimeout(() => setCopyFeedback(""), 3000);
  };

  // Xem trước giáo án theo mã code
  const handleQuickPreviewByCode = async (codeToPreview) => {
    const targetCode = (codeToPreview || quickCodeInput || "").trim().toUpperCase();
    if (!targetCode) {
      alert("Vui lòng nhập mã code giáo án (VD: PPL-PRO, GYM-XXXX)!");
      return;
    }
    try {
      setIsPreviewLoading(true);
      const res = await api.previewPlanByCode(targetCode);
      if (res.success && res.data) {
        setPreviewModalData(res.data);
        setImportForm({
          custom_name: res.data.plan.ten_ke_hoach,
          activate_now: true,
          dong_bo_lich: true
        });
        setShowPreviewModal(true);
      } else {
        alert("⚠️ " + (res.message || "Không tìm thấy giáo án với mã code này. Vui lòng kiểm tra lại!"));
      }
    } catch (err) {
      console.error("Lỗi xem trước giáo án:", err);
      alert("Lỗi kết nối máy chủ: " + err.message);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Tiến hành nhập (Clone) giáo án vào tài khoản
  const handleExecuteImportPlan = async () => {
    if (!previewModalData?.plan?.share_code) return;
    try {
      setIsImportingPlan(true);
      const payload = {
        share_code: previewModalData.plan.share_code,
        custom_name: importForm.custom_name,
        activate_now: importForm.activate_now,
        dong_bo_lich: importForm.dong_bo_lich
      };
      const res = await api.importPlanByCode(payload);
      if (res.success) {
        alert("🎉 " + (res.message || "Đã nhập giáo án thành công!"));
        setShowPreviewModal(false);
        setQuickCodeInput("");
        await loadAllData();
        setActiveTab("plans");
      } else {
        alert("⚠️ " + res.message);
      }
    } catch (err) {
      console.error("Lỗi nhập giáo án:", err);
      alert("Lỗi nhập giáo án: " + err.message);
    } finally {
      setIsImportingPlan(false);
    }
  };

  useEffect(() => {
    loadAllData();
    loadCommunityPlans();

    // Hỗ trợ chia sẻ đường dẫn trực tiếp: ?code=XYZ
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const codeParam = urlParams.get("code");
      if (codeParam) {
        const cleanCode = codeParam.trim().toUpperCase();
        setQuickCodeInput(cleanCode);
        handleQuickPreviewByCode(cleanCode);
        setActiveTab("community");
      }
    } catch (e) {
      // Ignored
    }
  }, []);

  // Quản lý Stopwatch
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchRef.current = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    }
    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, [isStopwatchRunning]);

  // Quản lý Rest Countdown
  useEffect(() => {
    if (restCountdown > 0) {
      restTimerRef.current = setInterval(() => {
        setRestCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [restCountdown]);

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Xác định buổi tập của ngày đang chọn trong Kế hoạch active
  const currentSession = scheduleData?.danh_sach_buoi_tap?.find(
    (b) => b.ngay_trong_tuan === selectedDay
  );

  // Set active exercise mặc định khi đổi ngày hoặc có dữ liệu mới
  useEffect(() => {
    if (currentSession?.chi_tiet && currentSession.chi_tiet.length > 0) {
      if (!activeExercise || !currentSession.chi_tiet.some((c) => c._id === activeExercise._id)) {
        setActiveExercise(currentSession.chi_tiet[0]);
      }
    } else {
      setActiveExercise(null);
    }
  }, [selectedDay, currentSession]);

  // Checklist hoàn thành bài tập
  const toggleExerciseCheck = (detailId) => {
    setCompletedExercises((prev) =>
      prev.includes(detailId) ? prev.filter((id) => id !== detailId) : [...prev, detailId]
    );
  };

  const exerciseCount = currentSession?.chi_tiet?.length || 0;
  const completedCount = currentSession?.chi_tiet?.filter((c) =>
    completedExercises.includes(c._id)
  ).length || 0;
  const progressPercent =
    exerciseCount > 0 ? Math.round((completedCount / exerciseCount) * 100) : 0;

  // Hoàn thành buổi tập
  const handleCompleteWorkout = async () => {
    if (!currentSession) return;

    const workoutMinutes = Math.max(1, Math.round(stopwatchSeconds / 60)) || 45;
    const res = await api.completeWorkout({
      buoi_tap_id: currentSession._id,
      ten_buoi_tap: currentSession.ten_buoi_tap,
      thoi_gian_tap_phut: workoutMinutes,
      ghi_chu: `Hoàn thành ${completedCount}/${exerciseCount} bài tập (${workoutMinutes} phút)`
    });

    if (res.success) {
      alert(`🎉 ${res.message}`);
      setIsStopwatchRunning(false);
      setStopwatchSeconds(0);
      setCompletedExercises([]);
      loadAllData();
    } else {
      alert("⚠️ " + (res.message || "Không thể lưu buổi tập"));
    }
  };

  // Kích hoạt một kế hoạch tập luyện
  const handleActivatePlan = async (planId) => {
    const res = await api.activateWorkoutPlan(planId);
    if (res.success) {
      alert(`⚡ ${res.message}`);
      loadAllData();
    } else {
      alert("⚠️ " + res.message);
    }
  };

  // Mở modal tạo / sửa kế hoạch
  const handleOpenPlanModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        ten_ke_hoach: plan.ten_ke_hoach,
        mo_ta: plan.mo_ta || "",
        is_active: plan.is_active || false
      });
      setShowPlanModal(true);
    } else {
      setEditingPlan(null);
      setWizardStep(1);
      setSlideDirection("next");
      setWizardFrequency(4);
      setWizardSelectedDays([2, 3, 5, 6]);
      setWizardIntensity("intermediate");
      setSelectedTemplateId("upper_lower_4");
      setPreviewDayIndex(0);
      setWizardCustomExercises({});
      setWizardSyncCalendar(true);
      setWizardIsActive(plansList.length === 0);
      setWizardPlanName("Giáo Án Upper / Lower Split (4 Buổi Tiêu Chuẩn)");
      setWizardPlanDesc("Tiêu chuẩn vàng của thể hình hiện đại. 2 buổi Thân Trên & 2 buổi Thân Dưới xen kẽ ngày nghỉ để phục hồi tối ưu.");
      setActiveTab("create_plan");
    }
  };

  // Điều hướng giữa các bước Wizard kèm hướng trượt hoạt ảnh (slide from right / slide from left)
  const goToWizardStep = (targetStep) => {
    if (targetStep === wizardStep) return;
    const direction = targetStep > wizardStep ? "next" : "prev";
    setSlideDirection(direction);
    if (targetStep === 3) {
      handleProceedToStep3(direction);
    } else {
      setWizardStep(targetStep);
    }
  };

  // Lấy danh sách bài tập của một ngày trong Bước 2 (Gợi ý giáo án)
  const getPreviewExercises = (dayNum, templateExercises = []) => {
    if (wizardCustomExercises[dayNum] !== undefined) {
      return wizardCustomExercises[dayNum];
    }
    return templateExercises || [];
  };

  // Mở modal thêm bài tập cho 1 ngày cụ thể trong Wizard Bước 2
  const handleOpenWizardAddExModal = (dayNum) => {
    setWizardTargetDay(dayNum);
    const defSets = wizardIntensity === "beginner" ? 3 : 4;
    const defReps = wizardIntensity === "beginner" ? 12 : wizardIntensity === "intermediate" ? 10 : 8;

    setWizardExForm({
      bai_tap_the_chat_id: exerciseCatalog[0]?._id || "",
      ten_bai_tap: "",
      nhom_co: "Ngực",
      loai_bai_tap: "strength",
      sets: defSets,
      reps: defReps,
      mins: 12
    });
    setShowWizardAddExModal(true);
  };

  // Lưu bài tập mới vào ngày tập trong Wizard Bước 2
  const handleSaveWizardExercise = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    let exToAdd;
    if (wizardExForm.bai_tap_the_chat_id) {
      const found = exerciseCatalog.find(
        (c) => c._id === wizardExForm.bai_tap_the_chat_id
      );
      exToAdd = {
        bai_tap_the_chat_id: found?._id,
        ten_bai_tap: found?.ten_bai_tap || "Bài tập mới",
        nhom_co: found?.nhom_co || "Toàn thân",
        loai_bai_tap: found?.loai_bai_tap || "strength",
        sets: Number(wizardExForm.sets) || 4,
        reps: Number(wizardExForm.reps) || 10,
        mins: Number(wizardExForm.mins) || 12
      };
    } else {
      if (!wizardExForm.ten_bai_tap.trim()) {
        alert("Vui lòng nhập tên bài tập!");
        return;
      }
      exToAdd = {
        ten_bai_tap: wizardExForm.ten_bai_tap.trim(),
        nhom_co: wizardExForm.nhom_co || "Toàn thân",
        loai_bai_tap: wizardExForm.loai_bai_tap || "strength",
        sets: Number(wizardExForm.sets) || 4,
        reps: Number(wizardExForm.reps) || 10,
        mins: Number(wizardExForm.mins) || 12
      };
    }

    const currentTmpl = WORKOUT_TEMPLATES.find((t) => t.id === selectedTemplateId);
    const currentDays = mapTemplateToSelectedDays(currentTmpl, wizardSelectedDays);
    const daySession = currentDays.find((d) => d.day === wizardTargetDay);
    const currentExs = getPreviewExercises(wizardTargetDay, daySession?.exercises);

    setWizardCustomExercises((prev) => ({
      ...prev,
      [wizardTargetDay]: [...currentExs, exToAdd]
    }));
    setShowWizardAddExModal(false);
  };

  // Xóa 1 bài tập khỏi ngày tập trong Wizard Bước 2
  const handleDeleteWizardExercise = (dayNum, exIndex, fallbackExercises = []) => {
    const currentExs = getPreviewExercises(dayNum, fallbackExercises);
    const updated = currentExs.filter((_, i) => i !== exIndex);
    setWizardCustomExercises((prev) => ({
      ...prev,
      [dayNum]: updated
    }));
  };

  // Bật/tắt một ngày tập trong tuần tại Wizard Step 1 & Step 2
  const handleToggleWizardDay = (dayNum) => {
    let nextDays;
    if (wizardSelectedDays.includes(dayNum)) {
      if (wizardSelectedDays.length <= 1) {
        alert("Bạn cần giữ lại ít nhất 1 ngày tập trong tuần!");
        return;
      }
      nextDays = wizardSelectedDays.filter((d) => d !== dayNum);
    } else {
      nextDays = [...wizardSelectedDays, dayNum].sort((a, b) => a - b);
    }

    setWizardSelectedDays(nextDays);
    setWizardFrequency(nextDays.length);

    // Tự động tìm template phù hợp với số ngày vừa chọn
    const matched = WORKOUT_TEMPLATES.find((t) => t.frequency === nextDays.length);
    if (matched) {
      setSelectedTemplateId(matched.id);
    } else {
      setSelectedTemplateId("custom");
    }
    setPreviewDayIndex(0);
  };

  // Áp dụng bộ ngày tập gợi ý nhanh (Preset)
  const handleApplyDayPreset = (days) => {
    const sorted = [...days].sort((a, b) => a - b);
    setWizardSelectedDays(sorted);
    setWizardFrequency(sorted.length);

    const matched = WORKOUT_TEMPLATES.find((t) => t.frequency === sorted.length);
    if (matched) {
      setSelectedTemplateId(matched.id);
    } else {
      setSelectedTemplateId("custom");
    }
    setPreviewDayIndex(0);
  };

  // Chọn tần suất buổi tập trong Wizard Step 1
  const handleSelectWizardFrequency = (freq) => {
    setWizardFrequency(freq);
    let defaultDays;
    if (freq === 2) defaultDays = [2, 5];
    else if (freq === 3) defaultDays = [2, 4, 6];
    else if (freq === 4) defaultDays = [2, 3, 5, 6];
    else if (freq === 5) defaultDays = [2, 3, 4, 5, 6];
    else if (freq === 6) defaultDays = [2, 3, 4, 5, 6, 7];
    else if (freq === 7) defaultDays = [2, 3, 4, 5, 6, 7, 8];
    else defaultDays = [2, 4, 6];

    setWizardSelectedDays(defaultDays);

    const matched = WORKOUT_TEMPLATES.find((t) => t.frequency === freq);
    if (matched) {
      setSelectedTemplateId(matched.id);
      setPreviewDayIndex(0);
    } else {
      setSelectedTemplateId("custom");
    }
  };

  // Chuyển sang Bước 3: Chuẩn bị danh sách 7 ngày kèm giờ tập và bài tập theo cường độ và ngày đã chọn
  const handleProceedToStep3 = (direction = "next") => {
    const template = WORKOUT_TEMPLATES.find((t) => t.id === selectedTemplateId);

    // Tính toán sets và reps theo cường độ đã chọn
    const getSetsReps = (exSets, exReps) => {
      if (wizardIntensity === "beginner") {
        return { sets: 3, reps: Math.max(10, exReps || 12) };
      }
      if (wizardIntensity === "advanced") {
        return { sets: Math.min(5, (exSets || 4) + 1), reps: Math.max(6, (exReps || 8) - 2) };
      }
      return { sets: exSets || 4, reps: exReps || 10 };
    };

    // Ánh xạ template lên các ngày tập mà người dùng đã chọn (wizardSelectedDays)
    const mappedDays = mapTemplateToSelectedDays(template, wizardSelectedDays);

    const preparedDays = mappedDays.map((d) => {
      const dayExercises = getPreviewExercises(d.day, d.exercises);
      return {
        day: d.day,
        name: d.name,
        isRest: d.isRest,
        gio_bat_dau: d.gio_bat_dau || (d.isRest ? "06:00" : "17:30"),
        gio_ket_thuc: d.gio_ket_thuc || (d.isRest ? "07:00" : "18:45"),
        exercises: (dayExercises || []).map((ex) => {
          const adj = getSetsReps(ex.sets || ex.so_sets, ex.reps || ex.so_reps);
          return {
            ...ex,
            sets: adj.sets,
            reps: adj.reps
          };
        })
      };
    });

    if (template) {
      setWizardPlanName(template.title);
      setWizardPlanDesc(template.desc);
    } else {
      setWizardPlanName(`Giáo Án Tự Thiết Kế (${wizardSelectedDays.length} Buổi/Tuần)`);
      setWizardPlanDesc("Lịch tập luyện do bạn tự tùy chỉnh phân bổ thời gian và bài tập.");
    }

    setWizardSessions(preparedDays);
    setSlideDirection(direction);
    setWizardStep(3);
  };

  // Áp dụng khung giờ tập nhanh (Preset) cho tất cả các ngày tập trong Wizard
  const handleApplyTimePreset = (startTime, endTime) => {
    setWizardSessions((prev) =>
      prev.map((s) => (s.isRest ? s : { ...s, gio_bat_dau: startTime, gio_ket_thuc: endTime }))
    );
  };

  // Chuyển đổi trạng thái ngày tập / ngày nghỉ trong Wizard Step 3
  const handleToggleWizardRestDay = (dayIndex) => {
    setWizardSessions((prev) => {
      const updated = prev.map((s, idx) => {
        if (idx !== dayIndex) return s;
        const newIsRest = !s.isRest;
        return {
          ...s,
          isRest: newIsRest,
          name: newIsRest ? "Nghỉ ngơi phục hồi (Rest Day)" : "Buổi tập chính"
        };
      });

      // Đồng bộ lại wizardSelectedDays theo các ngày không nghỉ
      const activeDays = updated.filter((s) => !s.isRest).map((s) => s.day);
      setWizardSelectedDays(activeDays);
      setWizardFrequency(activeDays.length);
      return updated;
    });
  };

  // Cập nhật giờ tập trong Wizard
  const handleUpdateWizardSessionTime = (dayIndex, field, val) => {
    setWizardSessions((prev) =>
      prev.map((s, idx) => (idx === dayIndex ? { ...s, [field]: val } : s))
    );
  };

  // Cập nhật tên buổi tập trong Wizard Step 3
  const handleUpdateWizardSessionName = (dayIndex, newName) => {
    setWizardSessions((prev) =>
      prev.map((s, idx) => (idx === dayIndex ? { ...s, name: newName } : s))
    );
  };

  // Lưu kế hoạch tập luyện từ Wizard
  const handleSaveWizardPlan = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!wizardPlanName.trim()) {
      alert("Vui lòng nhập tên giáo án!");
      return;
    }

    try {
      setIsSavingPlan(true);
      const payload = {
        ten_ke_hoach: wizardPlanName.trim(),
        mo_ta: wizardPlanDesc.trim(),
        so_buoi_tuan: wizardFrequency,
        cuong_do: wizardIntensity,
        is_active: wizardIsActive,
        dong_bo_lich: wizardSyncCalendar,
        sessions: wizardSessions.map((s) => ({
          ngay_trong_tuan: s.day,
          ten_buoi_tap: s.name,
          is_rest_day: s.isRest,
          gio_bat_dau: s.gio_bat_dau || "06:00",
          gio_ket_thuc: s.gio_ket_thuc || "07:15",
          exercises: (s.exercises || []).map((ex) => ({
            ten_bai_tap: ex.ten_bai_tap,
            nhom_co: ex.nhom_co,
            loai_bai_tap: ex.loai_bai_tap,
            so_sets: ex.sets,
            so_reps: ex.reps,
            thoi_luong_phut: ex.mins || 10
          }))
        }))
      };

      const res = await api.createWorkoutPlan(payload);
      if (res.success) {
        alert(`🎉 ${res.message || "Tạo giáo án và đồng bộ lên Lịch thành công!"}`);
        setShowPlanModal(false);
        setActiveTab("plans");
        loadAllData();
      } else {
        alert("⚠️ " + res.message);
      }
    } catch (err) {
      alert("⚠️ Lỗi lưu giáo án: " + err.message);
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Đồng bộ thủ công giáo án sang trang Lịch
  const handleSyncPlanToCalendar = async (planId) => {
    try {
      const res = await api.syncWorkoutPlanToCalendar(planId);
      if (res.success) {
        alert(`🎉 ${res.message || "Đã đồng bộ lịch tập vào trang Lịch!"}`);
      } else {
        alert("⚠️ " + res.message);
      }
    } catch (err) {
      alert("⚠️ Lỗi đồng bộ lịch: " + err.message);
    }
  };

  // Lưu kế hoạch
  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planForm.ten_ke_hoach.trim()) {
      alert("Vui lòng nhập tên giáo án!");
      return;
    }

    if (editingPlan) {
      const res = await api.updateWorkoutPlan(editingPlan._id, {
        ten_ke_hoach: planForm.ten_ke_hoach,
        mo_ta: planForm.mo_ta
      });
      if (res.success) {
        setShowPlanModal(false);
        loadAllData();
      } else {
        alert("⚠️ " + res.message);
      }
    } else {
      const res = await api.createWorkoutPlan(planForm);
      if (res.success) {
        setShowPlanModal(false);
        loadAllData();
      } else {
        alert("⚠️ " + res.message);
      }
    }
  };

  // Xóa kế hoạch có xác nhận
  const handleConfirmDeletePlan = async () => {
    if (!planToDelete) return;
    const res = await api.deleteWorkoutPlan(planToDelete._id);
    if (res.success) {
      setShowDeleteModal(false);
      setPlanToDelete(null);
      if (selectedPlanForEdit?._id === planToDelete._id) {
        setSelectedPlanForEdit(null);
      }
      loadAllData();
    } else {
      alert("⚠️ " + res.message);
    }
  };

  // Chuyển đổi trạng thái ngày nghỉ / ngày tập
  const handleToggleRestDay = async (buoiId, currentRestState) => {
    const res = await api.updateBuoiTap(buoiId, {
      is_rest_day: !currentRestState,
      ten_buoi_tap: !currentRestState ? "Nghỉ ngơi phục hồi (Rest Day)" : "Buổi tập chính"
    });
    if (res.success) {
      loadAllData();
      if (selectedPlanForEdit) {
        loadPlanForEdit(selectedPlanForEdit);
      }
    } else {
      alert("⚠️ " + res.message);
    }
  };

  // Đổi tên buổi tập
  const handleUpdateSessionName = async (buoiId, newName) => {
    if (!newName.trim()) return;
    await api.updateBuoiTap(buoiId, { ten_buoi_tap: newName.trim() });
    loadAllData();
  };

  // Tải chi tiết các buổi tập của 1 kế hoạch để chỉnh sửa
  const loadPlanForEdit = async (plan) => {
    setSelectedPlanForEdit(plan);
    if (scheduleData?.ke_hoach?._id === plan._id) {
      setPlanDetailSessions(scheduleData.danh_sach_buoi_tap);
    } else {
      const res = await api.getWorkoutSchedule();
      if (res.success) {
        setPlanDetailSessions(res.data.danh_sach_buoi_tap);
      }
    }
  };

  // Mở modal thêm bài tập vào buổi
  const handleOpenAddExModal = (buoi) => {
    setCurrentBuoiForEx(buoi);
    setExForm({
      bai_tap_the_chat_id: exerciseCatalog[0]?._id || "",
      ten_bai_tap: "",
      nhom_co: "Ngực",
      loai_bai_tap: "strength",
      so_sets: 3,
      so_reps: 10,
      thoi_luong_phut: 10
    });
    setShowAddExModal(true);
  };

  // Lưu bài tập mới vào buổi
  const handleSaveExercise = async (e) => {
    e.preventDefault();
    if (!currentBuoiForEx) return;

    const payload = exForm.bai_tap_the_chat_id
      ? {
          bai_tap_the_chat_id: exForm.bai_tap_the_chat_id,
          so_sets: exForm.so_sets,
          so_reps: exForm.so_reps,
          thoi_luong_phut: exForm.thoi_luong_phut
        }
      : {
          ten_bai_tap: exForm.ten_bai_tap,
          nhom_co: exForm.nhom_co,
          loai_bai_tap: exForm.loai_bai_tap,
          so_sets: exForm.so_sets,
          so_reps: exForm.so_reps,
          thoi_luong_phut: exForm.thoi_luong_phut
        };

    const res = await api.addExerciseToBuoi(currentBuoiForEx._id, payload);
    if (res.success) {
      setShowAddExModal(false);
      loadAllData();
      if (selectedPlanForEdit) loadPlanForEdit(selectedPlanForEdit);
    } else {
      alert("⚠️ " + res.message);
    }
  };

  // Mở modal sửa thông số bài tập
  const handleOpenEditDetailModal = (detail) => {
    setEditingDetail(detail);
    setDetailForm({
      so_sets: detail.so_sets || 3,
      so_reps: detail.so_reps || 10,
      thoi_luong_phut: detail.thoi_luong_phut || ""
    });
    setShowEditDetailModal(true);
  };

  // Lưu sửa bài tập
  const handleSaveEditDetail = async (e) => {
    e.preventDefault();
    if (!editingDetail) return;

    const res = await api.updateExerciseDetail(editingDetail._id, detailForm);
    if (res.success) {
      setShowEditDetailModal(false);
      loadAllData();
      if (selectedPlanForEdit) loadPlanForEdit(selectedPlanForEdit);
    } else {
      alert("⚠️ " + res.message);
    }
  };

  // Xóa bài tập
  const handleDeleteExercise = async (detailId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài tập này khỏi buổi?")) return;
    const res = await api.deleteExerciseDetail(detailId);
    if (res.success) {
      loadAllData();
      if (selectedPlanForEdit) loadPlanForEdit(selectedPlanForEdit);
    } else {
      alert("⚠️ " + res.message);
    }
  };

  // Component hiển thị bộ thiết kế giáo án từng bước kèm hiệu ứng trượt mượt mà (slide from right)
  const renderWizardDesigner = (isFullPage = false) => {
    return (
      <div className="wizard-designer-container">
        {/* Stepper Node Bar */}
        <div className="wizard-stepper-wrap mb-4">
          <div
            className={`wizard-step-node ${wizardStep === 1 ? "active" : wizardStep > 1 ? "completed" : ""}`}
            onClick={() => goToWizardStep(1)}
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
          >
            <div className="wizard-step-circle">{wizardStep > 1 ? "✓" : "1"}</div>
            <div>
              <div className="wizard-step-text-title">Bước 1: Tần Suất & Cường Độ</div>
              <span className="wizard-step-text-sub">Số buổi & mức độ thể lực</span>
            </div>
          </div>

          <div className="wizard-step-divider" />

          <div
            className={`wizard-step-node ${wizardStep === 2 ? "active" : wizardStep > 2 ? "completed" : ""}`}
            onClick={() => goToWizardStep(2)}
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
          >
            <div className="wizard-step-circle">{wizardStep > 2 ? "✓" : "2"}</div>
            <div>
              <div className="wizard-step-text-title">Bước 2: Gợi Ý Giáo Án</div>
              <span className="wizard-step-text-sub">Chọn giáo án & xem bài tập</span>
            </div>
          </div>

          <div className="wizard-step-divider" />

          <div
            className={`wizard-step-node ${wizardStep === 3 ? "active" : ""}`}
            onClick={() => goToWizardStep(3)}
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
          >
            <div className="wizard-step-circle">3</div>
            <div>
              <div className="wizard-step-text-title">Bước 3: Giờ Tập & Hoàn Tất</div>
              <span className="wizard-step-text-sub">Setup khung giờ & đồng bộ</span>
            </div>
          </div>
        </div>

        {/* Khung trượt bước (Step Slider) */}
        <div className="wizard-steps-slider-wrap">
          <div
            key={`wizard-step-${wizardStep}`}
            className={slideDirection === "next" ? "wizard-slide-next" : "wizard-slide-prev"}
          >
            {/* BƯỚC 1: CHỌN SỐ BUỔI & CƯỜNG ĐỘ */}
            {wizardStep === 1 && (
              <div>
                {/* Section 1: Số buổi */}
                <div className="mb-4">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: "10px" }}>
                    1. Bạn muốn tập bao nhiêu buổi mỗi tuần?
                  </label>
                  <div className="row g-3">
                    {[
                      { freq: 3, icon: "⚡", title: "3 Buổi / Tuần", desc: "Tiết kiệm thời gian, kích thích toàn thân, lý tưởng cho người mới và bận rộn." },
                      { freq: 4, icon: "⚖️", title: "4 Buổi / Tuần", desc: "Cân bằng hoàn hảo giữa kích thích cơ bắp và phục hồi (Upper/Lower Split)." },
                      { freq: 5, icon: "🔥", title: "5 Buổi / Tuần", desc: "Tăng cơ nhanh, khối lượng tập luyện cao dành cho người có kinh nghiệm." },
                      { freq: 6, icon: "🚀", title: "6 Buổi / Tuần", desc: "Chuyên sâu thể hình (PPL 2 vòng), tần suất cao nhất dành cho gymer lâu năm." }
                    ].map((item) => (
                      <div key={item.freq} className="col-sm-6">
                        <div
                          className={`wizard-selection-card ${wizardFrequency === item.freq ? "selected" : ""}`}
                          onClick={() => handleSelectWizardFrequency(item.freq)}
                        >
                          <div>
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span style={{ fontSize: "1.4rem" }}>{item.icon}</span>
                              {wizardFrequency === item.freq && (
                                <span className="badge-metric-tag" style={{ fontSize: "0.7rem" }}>
                                  ✓ ĐANG CHỌN
                                </span>
                              )}
                            </div>
                            <h5 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "6px 0 4px 0" }}>
                              {item.title}
                            </h5>
                            <p style={{ fontSize: "0.78rem", color: "var(--lp-text-muted)", margin: 0, lineHeight: 1.4 }}>
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Chọn các ngày tập trong tuần */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: "0.92rem", margin: 0 }}>
                      2. Chọn các ngày trong tuần bạn sẽ tập luyện:
                    </label>
                    <span style={{ fontSize: "0.78rem", color: "var(--lp-text-muted)" }}>
                      (Bấm trực tiếp vào từng thứ để Bật / Tắt ngày tập)
                    </span>
                  </div>

                  {/* 7 Day interactive toggle cards */}
                  <div className="row g-2 mb-3">
                    {DAYS_OF_WEEK.map((d) => {
                      const isSelected = wizardSelectedDays.includes(d.day);
                      return (
                        <div key={d.day} className="col">
                          <div
                            className={`wizard-day-toggle-card ${isSelected ? "is-active" : "is-rest"}`}
                            onClick={() => handleToggleWizardDay(d.day)}
                            title={`Bấm để ${isSelected ? "chuyển sang ngày nghỉ" : "chọn làm ngày tập"}`}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="day-chip-label" style={{ fontSize: "0.92rem", marginBottom: "3px" }}>
                              {d.label}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "var(--lp-text-muted)", marginBottom: "4px" }}>
                              {d.fullName}
                            </div>
                            <span
                              className="badge-metric-tag"
                              style={{
                                fontSize: "0.68rem",
                                padding: "2px 6px",
                                background: isSelected ? "var(--lp-primary)" : "rgba(100, 116, 139, 0.15)",
                                color: isSelected ? "#fff" : "var(--lp-text-muted)"
                              }}
                            >
                              {isSelected ? "💪 Tập" : "🛌 Nghỉ"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Day Presets */}
                  <div
                    className="p-3 rounded"
                    style={{
                      background: "var(--lp-bg-surface)",
                      border: "1px solid var(--lp-card-border)"
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                      <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                        ⚡ Gợi ý tổ hợp ngày phổ biến:
                      </span>
                      <span style={{ fontSize: "0.74rem", color: "var(--lp-primary)", fontWeight: 600 }}>
                        Đã chọn: {wizardSelectedDays.length} ngày tập ({wizardSelectedDays.map(num => DAYS_OF_WEEK.find(d => d.day === num)?.label).join(", ")})
                      </span>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      {WORKOUT_DAY_PRESETS.map((pst, idx) => {
                        const isPresetActive =
                          pst.days.length === wizardSelectedDays.length &&
                          pst.days.every((d) => wizardSelectedDays.includes(d));

                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`wizard-day-preset-pill ${isPresetActive ? "active" : ""}`}
                            onClick={() => handleApplyDayPreset(pst.days)}
                          >
                            {isPresetActive ? "✓ " : ""}{pst.label} <span style={{ opacity: 0.8, fontSize: "0.72rem" }}>({pst.desc})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Section 3: Cường độ */}
                <div className="mb-4">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: "10px" }}>
                    3. Chọn Cường độ luyện tập & Thể trạng của bạn:
                  </label>
                  <div className="row g-3">
                    {[
                      {
                        id: "beginner",
                        badge: "🟢 Mới Bắt Đầu",
                        title: "Nhẹ Nhàng / Khởi Đầu",
                        setsReps: "3 Sets × 10-12 Reps",
                        desc: "Tập trung học động tác chuẩn xác, khối lượng vừa sức, nghỉ ngơi thoải mái tránh chấn thương."
                      },
                      {
                        id: "intermediate",
                        badge: "🟡 Tiêu Chuẩn Hypertrophy",
                        title: "Trung Bình / Tăng Cơ",
                        setsReps: "4 Sets × 8-10 Reps",
                        desc: "Khối lượng tiêu chuẩn giúp phát triển cơ bắp và sức bền tối ưu, nghỉ giữa hiệp 60-90 giây."
                      },
                      {
                        id: "advanced",
                        badge: "🔴 Cường Độ Cao",
                        title: "Nâng Cao / Siết Cơ",
                        setsReps: "4-5 Sets × 6-8 Reps",
                        desc: "Tạ nặng, áp lực cao, tăng sức mạnh bộc phát và siết nét tối đa cho người có nền tảng vững."
                      }
                    ].map((lvl) => (
                      <div key={lvl.id} className="col-md-4">
                        <div
                          className={`wizard-selection-card ${wizardIntensity === lvl.id ? "selected" : ""}`}
                          onClick={() => setWizardIntensity(lvl.id)}
                        >
                          <div>
                            <span className="badge-group-tag mb-2 d-inline-block" style={{ fontSize: "0.72rem" }}>
                              {lvl.badge}
                            </span>
                            <h5 style={{ fontSize: "0.92rem", fontWeight: 700, margin: "2px 0 4px 0" }}>
                              {lvl.title}
                            </h5>
                            <div
                              className="font-numeric mb-2"
                              style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--lp-primary)" }}
                            >
                              📌 {lvl.setsReps}
                            </div>
                            <p style={{ fontSize: "0.76rem", color: "var(--lp-text-muted)", margin: 0, lineHeight: 1.4 }}>
                              {lvl.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Thanh chuyển bước dưới cùng Step 1 */}
                <div className="d-flex align-items-center justify-content-between mt-4 pt-3 border-top flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2 flex-wrap" style={{ fontSize: "0.85rem", color: "var(--lp-text-muted)" }}>
                    <span>
                      Đã chọn: <strong style={{ color: "var(--lp-primary)" }}>{wizardFrequency} Buổi / Tuần</strong>{" "}
                      ({wizardSelectedDays.map((num) => DAYS_OF_WEEK.find((d) => d.day === num)?.label).join(", ")})
                    </span>
                    <span>•</span>
                    <span>
                      Cường độ: <strong style={{ color: "var(--lp-primary)" }}>{wizardIntensity === "beginner" ? "Khởi đầu" : wizardIntensity === "intermediate" ? "Tăng cơ" : "Nâng cao"}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn-action-pill btn-pill-primary"
                    style={{ background: "var(--lp-primary)", color: "#fff", padding: "10px 22px", fontSize: "0.9rem" }}
                    onClick={() => goToWizardStep(2)}
                  >
                    Tiếp Tục Sang Bước 2: Chọn Giáo Án Gợi Ý ➔
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 2: GỢI Ý GIÁO ÁN & BÀI TẬP */}
            {wizardStep === 2 && (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div>
                    <h5 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>
                      💡 Giáo Án Được Hệ Thống Gợi Ý ({wizardFrequency} Buổi / Tuần)
                    </h5>
                    <span style={{ fontSize: "0.78rem", color: "var(--lp-text-muted)" }}>
                      Chọn một giáo án dưới đây để xem trước chi tiết lịch tuần và danh sách bài tập
                    </span>
                  </div>
                </div>

                {/* Danh sách giáo án mẫu phù hợp */}
                <div className="row g-3 mb-4">
                  {WORKOUT_TEMPLATES.filter((t) => t.frequency === wizardFrequency).map((tmpl) => {
                    const isSelected = selectedTemplateId === tmpl.id;
                    return (
                      <div key={tmpl.id} className="col-md-6">
                        <div
                          className={`wizard-selection-card ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            setSelectedTemplateId(tmpl.id);
                            setPreviewDayIndex(0);
                          }}
                        >
                          <div>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className="badge-metric-tag" style={{ fontSize: "0.72rem" }}>
                                {tmpl.tag}
                              </span>
                              {isSelected && (
                                <span className="badge-metric-tag" style={{ fontSize: "0.7rem", background: "var(--lp-primary)", color: "#fff" }}>
                                  ✓ ĐANG CHỌN
                                </span>
                              )}
                            </div>
                            <h5 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "6px" }}>
                              {tmpl.title}
                            </h5>
                            <p style={{ fontSize: "0.78rem", color: "var(--lp-text-muted)", margin: "0 0 8px 0", lineHeight: 1.4 }}>
                              {tmpl.desc}
                            </p>
                            <div style={{ fontSize: "0.74rem", color: "var(--lp-primary)", fontWeight: 600 }}>
                              🎯 Phù hợp: {tmpl.suitable}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Tùy chọn Tự tùy biến (Custom) */}
                  <div className="col-md-6">
                    <div
                      className={`wizard-selection-card ${selectedTemplateId === "custom" ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedTemplateId("custom");
                        setPreviewDayIndex(0);
                      }}
                    >
                      <div>
                        <span className="badge-group-tag mb-2 d-inline-block" style={{ fontSize: "0.72rem" }}>
                          🎨 Tùy Biến Hoàn Toàn
                        </span>
                        <h5 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "6px" }}>
                          Tự Thiết Kế Lịch & Tự Chọn Bài
                        </h5>
                        <p style={{ fontSize: "0.78rem", color: "var(--lp-text-muted)", margin: 0, lineHeight: 1.4 }}>
                          Tự chia ngày tập, chọn nhóm cơ và thêm các bài tập theo sở thích riêng của bạn.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Preview Box: Xem trước 7 ngày và danh sách bài tập */}
                {(() => {
                  const currentTmpl = WORKOUT_TEMPLATES.find((t) => t.id === selectedTemplateId);
                  const currentDays = mapTemplateToSelectedDays(currentTmpl, wizardSelectedDays);
                  const activePreviewSession = currentDays[previewDayIndex] || currentDays[0];

                  return (
                    <div
                      className="p-3 rounded"
                      style={{
                        background: "var(--lp-bg-surface)",
                        border: "1px solid var(--lp-card-border)",
                        boxShadow: "var(--lp-shadow-inset)"
                      }}
                    >
                      {/* Day Selection Bar in Step 2 */}
                      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2 pb-2 border-bottom">
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                            🗓️ Lịch tập đã chọn ({wizardSelectedDays.length} ngày):
                          </span>
                          <span className="badge-metric-tag" style={{ fontSize: "0.72rem" }}>
                            {wizardSelectedDays.map((num) => DAYS_OF_WEEK.find((d) => d.day === num)?.label).join(" • ")}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-1 flex-wrap">
                          <span style={{ fontSize: "0.74rem", color: "var(--lp-text-muted)" }}>Bấm nhanh để đổi ngày:</span>
                          {DAYS_OF_WEEK.map((d) => {
                            const isDayActive = wizardSelectedDays.includes(d.day);
                            return (
                              <button
                                key={d.day}
                                type="button"
                                onClick={() => handleToggleWizardDay(d.day)}
                                style={{
                                  padding: "2px 8px",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  borderRadius: "6px",
                                  border: isDayActive ? "1px solid var(--lp-primary)" : "1px dashed var(--lp-card-border)",
                                  background: isDayActive ? "var(--lp-primary)" : "var(--lp-bg-surface)",
                                  color: isDayActive ? "#ffffff" : "var(--lp-text-muted)",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease"
                                }}
                                title={`${d.fullName}: Bấm để ${isDayActive ? "chuyển sang nghỉ" : "chọn làm ngày tập"}`}
                              >
                                {isDayActive ? "💪 " : ""}{d.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                        <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                          🔍 Xem Trước Cấu Trúc Lịch Tuần & Bài Tập:
                        </span>
                        <span style={{ fontSize: "0.74rem", color: "var(--lp-text-muted)" }}>
                          Bấm vào từng thứ để xem bài tập chi tiết
                        </span>
                      </div>

                      {/* 7 Day selector chips */}
                      <div className="d-flex gap-2 mb-3 overflow-auto pb-1">
                        {currentDays.map((d, idx) => {
                          const dayInfo = DAYS_OF_WEEK.find((item) => item.day === d.day);
                          const isSelected = previewDayIndex === idx;
                          const dayExs = getPreviewExercises(d.day, d.exercises);
                          return (
                            <div
                              key={d.day}
                              className={`wizard-day-preview-chip ${isSelected ? "active" : ""}`}
                              onClick={() => setPreviewDayIndex(idx)}
                            >
                              <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                                {dayInfo?.label || `T${d.day}`}
                              </div>
                              <div
                                className="sub-badge"
                                style={{
                                  fontSize: "0.68rem",
                                  color: d.isRest ? "var(--lp-text-muted)" : "var(--lp-success)",
                                  fontWeight: 600
                                }}
                              >
                                {d.isRest ? "🛌 Nghỉ" : `💪 Tập (${dayExs.length})`}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Chi tiết ngày đang preview */}
                      <div
                        className="p-3 rounded"
                        style={{
                          background: "var(--lp-bg-card)",
                          border: "1px solid var(--lp-card-border)"
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge-metric-tag">
                              {DAYS_OF_WEEK.find((d) => d.day === activePreviewSession.day)?.fullName}
                            </span>
                            <h6 style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>
                              {activePreviewSession.name}
                            </h6>
                          </div>
                          <span
                            className={`badge-group-tag ${activePreviewSession.isRest ? "" : "text-success"}`}
                          >
                            {activePreviewSession.isRest ? "🌿 Ngày nghỉ phục hồi" : "⚡ Ngày tập luyện"}
                          </span>
                        </div>

                        {activePreviewSession.isRest ? (
                          <div className="text-center py-3" style={{ color: "var(--lp-text-muted)", fontSize: "0.82rem" }}>
                            🛌 Ngày nghỉ phục hồi cơ bắp. Không có bài tập cần thực hiện.
                          </div>
                        ) : (
                          <div>
                            {(() => {
                              const activeDayExercises = getPreviewExercises(
                                activePreviewSession.day,
                                activePreviewSession.exercises
                              );

                              return (
                                <>
                                  <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--lp-text-muted)" }}>
                                      Danh sách bài tập ({activeDayExercises.length} bài tập):
                                    </div>
                                    <button
                                      type="button"
                                      className="btn-action-pill btn-pill-primary"
                                      style={{
                                        padding: "4px 14px",
                                        fontSize: "0.78rem",
                                        background: "var(--lp-primary)",
                                        color: "#fff",
                                        border: "none",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)"
                                      }}
                                      onClick={() => handleOpenWizardAddExModal(activePreviewSession.day)}
                                    >
                                      <span>➕</span> Thêm Bài Tập
                                    </button>
                                  </div>

                                  {activeDayExercises.length > 0 ? (
                                    <div className="d-flex flex-column gap-2">
                                      {activeDayExercises.map((ex, i) => (
                                        <div
                                          key={i}
                                          className="d-flex align-items-center justify-content-between p-2 rounded"
                                          style={{
                                            background: "var(--lp-bg-surface)",
                                            border: "1px solid var(--lp-card-border)",
                                            fontSize: "0.82rem"
                                          }}
                                        >
                                          <div className="d-flex align-items-center gap-2 flex-wrap">
                                            <span style={{ fontWeight: 600 }}>{ex.ten_bai_tap}</span>
                                            <span className="badge-group-tag" style={{ fontSize: "0.7rem" }}>
                                              {ex.nhom_co}
                                            </span>
                                            {ex.loai_bai_tap && (
                                              <span className="badge-metric-tag" style={{ fontSize: "0.68rem" }}>
                                                {ex.loai_bai_tap}
                                              </span>
                                            )}
                                          </div>
                                          <div className="d-flex align-items-center gap-3">
                                            <div className="font-numeric" style={{ fontWeight: 700, color: "var(--lp-primary)" }}>
                                              {ex.sets || (wizardIntensity === "beginner" ? 3 : 4)} Sets ×{" "}
                                              {ex.reps || (wizardIntensity === "beginner" ? 12 : wizardIntensity === "intermediate" ? 10 : 8)} Reps
                                            </div>
                                            <button
                                              type="button"
                                              className="btn btn-sm text-danger p-0 border-0"
                                              title="Xóa bài tập này khỏi buổi"
                                              onClick={() => handleDeleteWizardExercise(activePreviewSession.day, i, activePreviewSession.exercises)}
                                              style={{ lineHeight: 1, fontSize: "0.9rem", opacity: 0.8, cursor: "pointer" }}
                                            >
                                              🗑️
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div
                                      className="text-center py-4 px-3 rounded mt-2"
                                      style={{
                                        background: "rgba(37, 99, 235, 0.04)",
                                        border: "1px dashed var(--lp-card-border)"
                                      }}
                                    >
                                      <div style={{ fontSize: "1.4rem", marginBottom: "6px" }}>🏋️‍♂️</div>
                                      <h6 style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: "4px" }}>
                                        Chưa có bài tập nào cho buổi này
                                      </h6>
                                      <p style={{ fontSize: "0.78rem", color: "var(--lp-text-muted)", marginBottom: "12px" }}>
                                        Tùy biến buổi tập theo sở thích riêng của bạn bằng cách chọn từ kho bài tập hoặc tự nhập bài tập mới!
                                      </p>
                                      <button
                                        type="button"
                                        className="btn-action-pill btn-pill-primary"
                                        style={{ padding: "6px 18px", fontSize: "0.82rem", background: "var(--lp-primary)", color: "#fff" }}
                                        onClick={() => handleOpenWizardAddExModal(activePreviewSession.day)}
                                      >
                                        ➕ Thêm Bài Tập Ngay
                                      </button>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Thanh chuyển bước dưới cùng Step 2 */}
                <div className="d-flex align-items-center justify-content-between mt-4 pt-3 border-top flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-action-pill btn-pill-primary"
                    onClick={() => goToWizardStep(1)}
                  >
                    ⬅ Quay Lại Bước 1
                  </button>
                  <button
                    type="button"
                    className="btn-action-pill btn-pill-primary"
                    style={{ background: "var(--lp-primary)", color: "#fff", padding: "10px 22px", fontSize: "0.9rem" }}
                    onClick={() => goToWizardStep(3)}
                  >
                    Tiếp Tục Sang Bước 3: Cài Giờ Tập & Đồng Bộ ➔
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 3: THIẾT LẬP THỜI GIAN TẬP & ĐỒNG BỘ LỊCH */}
            {wizardStep === 3 && (
              <div>
                <div className="row g-2 mb-3">
                  <div className="col-md-7">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      Tên Giáo Án / Kế Hoạch *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={wizardPlanName}
                      onChange={(e) => setWizardPlanName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      Mô Tả Ngắn
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={wizardPlanDesc}
                      onChange={(e) => setWizardPlanDesc(e.target.value)}
                      placeholder="Mục tiêu tập luyện..."
                    />
                  </div>
                </div>

                {/* Quick Presets Toolbar */}
                <div
                  className="p-3 mb-3 rounded"
                  style={{
                    background: "var(--lp-bg-surface)",
                    border: "1px solid var(--lp-card-border)"
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                    <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                      ⚡ Cài nhanh khung giờ cho TẤT CẢ các buổi tập:
                    </span>
                    <span style={{ fontSize: "0.74rem", color: "var(--lp-text-muted)" }}>
                      (Bấm một nút để điền giờ cho cả tuần)
                    </span>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="wizard-time-preset-pill"
                      onClick={() => handleApplyTimePreset("06:00", "07:15")}
                    >
                      🌅 Sáng Sớm (06:00 - 07:15)
                    </button>
                    <button
                      type="button"
                      className="wizard-time-preset-pill"
                      onClick={() => handleApplyTimePreset("17:30", "18:45")}
                    >
                      🌇 Chiều Tan Làm (17:30 - 18:45)
                    </button>
                    <button
                      type="button"
                      className="wizard-time-preset-pill"
                      onClick={() => handleApplyTimePreset("19:30", "20:45")}
                    >
                      🌙 Buổi Tối (19:30 - 20:45)
                    </button>
                  </div>
                </div>

                {/* Danh sách 7 ngày trong tuần */}
                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "8px" }}>
                    Phân Bổ Lịch Tuần & Thời Gian Từng Buổi:
                  </label>

                  <div className="d-flex flex-column gap-2">
                    {wizardSessions.map((s, idx) => {
                      const dayInfo = DAYS_OF_WEEK.find((d) => d.day === s.day);

                      return (
                        <div
                          key={s.day}
                          className={`wizard-session-row ${s.isRest ? "is-rest" : ""}`}
                        >
                          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-2 flex-grow-1">
                              <span className="badge-metric-tag" style={{ minWidth: "75px", textAlign: "center" }}>
                                {dayInfo?.fullName}
                              </span>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                style={{ maxWidth: "340px", fontWeight: 600, fontSize: "0.85rem" }}
                                value={s.name}
                                disabled={s.isRest}
                                onChange={(e) => handleUpdateWizardSessionName(idx, e.target.value)}
                              />
                            </div>

                            <div className="d-flex align-items-center gap-2">
                              <button
                                type="button"
                                className={`btn-action-pill ${s.isRest ? "btn-pill-warning" : "btn-pill-primary"}`}
                                style={{ height: "30px", fontSize: "0.74rem" }}
                                onClick={() => handleToggleWizardRestDay(idx)}
                              >
                                {s.isRest ? "🛌 Đang Nghỉ" : "💪 Đang Tập"}
                              </button>
                            </div>
                          </div>

                          {!s.isRest && (
                            <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top flex-wrap gap-2">
                              <div className="d-flex align-items-center gap-2">
                                <span style={{ fontSize: "0.8rem", color: "var(--lp-text-muted)", fontWeight: 600 }}>
                                  ⏰ Giờ tập:
                                </span>
                                <input
                                  type="time"
                                  className="form-control form-control-sm"
                                  style={{ width: "95px", height: "28px", fontSize: "0.78rem", padding: "2px 6px" }}
                                  value={s.gio_bat_dau || "17:30"}
                                  onChange={(e) => handleUpdateWizardSessionTime(idx, "gio_bat_dau", e.target.value)}
                                />
                                <span style={{ fontSize: "0.8rem", color: "var(--lp-text-muted)" }}>đến</span>
                                <input
                                  type="time"
                                  className="form-control form-control-sm"
                                  style={{ width: "95px", height: "28px", fontSize: "0.78rem", padding: "2px 6px" }}
                                  value={s.gio_ket_thuc || "18:45"}
                                  onChange={(e) => handleUpdateWizardSessionTime(idx, "gio_ket_thuc", e.target.value)}
                                />
                              </div>

                              <div style={{ fontSize: "0.74rem", color: "var(--lp-text-muted)" }}>
                                🏋️ {s.exercises?.length || 0} bài tập được gán sẵn
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Checkbox Đồng bộ lịch & Kích hoạt */}
                <div
                  className="p-3 mb-3 rounded"
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.25)"
                  }}
                >
                  <div className="form-check mb-2">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id={`syncCalendarCheck-${isFullPage ? "page" : "modal"}`}
                      checked={wizardSyncCalendar}
                      onChange={(e) => setWizardSyncCalendar(e.target.checked)}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`syncCalendarCheck-${isFullPage ? "page" : "modal"}`}
                      style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--lp-text-main)" }}
                    >
                      📅 Tự động đưa lịch tập này lên trang Lịch (SuKien)
                    </label>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--lp-text-muted)", margin: "0 0 0 24px", lineHeight: 1.4 }}>
                    Hệ thống sẽ tự động tạo các sự kiện tập luyện định kỳ hàng tuần vào trang Lịch theo khung giờ bạn đã cài, kèm đầy đủ danh sách bài tập của từng ngày.
                  </p>

                  <div className="form-check mt-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id={`setActiveCheck-${isFullPage ? "page" : "modal"}`}
                      checked={wizardIsActive}
                      onChange={(e) => setWizardIsActive(e.target.checked)}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`setActiveCheck-${isFullPage ? "page" : "modal"}`}
                      style={{ fontSize: "0.85rem", color: "var(--lp-text-main)" }}
                    >
                      ⚡ Kích hoạt làm giáo án sử dụng chính ngay sau khi tạo
                    </label>
                  </div>
                </div>

                {/* Thanh chuyển bước dưới cùng Step 3 */}
                <div className="d-flex align-items-center justify-content-between mt-4 pt-3 border-top flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-action-pill btn-pill-primary"
                    onClick={() => goToWizardStep(2)}
                  >
                    ⬅ Quay Lại Bước 2
                  </button>
                  <div className="d-flex gap-2">
                    {!isFullPage && (
                      <button
                        type="button"
                        className="btn-action-pill btn-pill-primary"
                        onClick={() => setShowPlanModal(false)}
                      >
                        Hủy Bỏ
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-action-pill btn-pill-primary"
                      style={{ background: "var(--lp-primary)", color: "#fff", padding: "10px 24px", fontSize: "0.92rem", fontWeight: 700 }}
                      disabled={isSavingPlan}
                      onClick={handleSaveWizardPlan}
                    >
                      {isSavingPlan ? "⏳ Đang Lưu & Đồng Bộ..." : "🚀 Hoàn Tất & Lưu Giáo Án"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const todayDayNum = getTodayDayNumber();

  return (
    <div className="workout-container">
      {/* 1. Header Block & Visual Hierarchy */}
      <div className="workout-header-block">
        <div className="workout-title-row" style={{ alignItems: "center" }}>
          {onNavigateToCalendar && (
            <button
              type="button"
              className="btn-action-pill btn-pill-primary"
              onClick={onNavigateToCalendar}
              style={{ marginRight: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              ← Quay lại Lịch
            </button>
          )}
          <div className="workout-title-icon-badge">🏋️</div>
          <div className="workout-title-content">
            <h1 className="workout-page-title">Thể Chất & Gym Routine</h1>
            <p className="workout-page-subtitle">
              Quản lý giáo án rèn luyện thể chất, theo dõi chuỗi ngày tập liên tiếp (Streak) & Heatmap 30 ngày
            </p>
          </div>
        </div>

        {/* Standalone Segmented Navigation Bar */}
        <div className="workout-nav-tabs-bar">
          <button
            id="workout-tab-today"
            className={`workout-nav-tab-btn ${activeTab === "today" ? "active" : ""}`}
            onClick={() => setActiveTab("today")}
          >
            <span>📅</span> Lịch Tuần & Tập Luyện
          </button>
          <button
            id="workout-tab-plans"
            className={`workout-nav-tab-btn ${activeTab === "plans" ? "active" : ""}`}
            onClick={() => setActiveTab("plans")}
          >
            <span>📋</span> Quản Lý Giáo Án ({plansList.length})
          </button>
          <button
            id="workout-tab-create-plan"
            className={`workout-nav-tab-btn ${activeTab === "create_plan" ? "active" : ""}`}
            onClick={() => {
              setEditingPlan(null);
              setWizardStep(1);
              setSlideDirection("next");
              setWizardSelectedDays([2, 3, 5, 6]);
              setWizardFrequency(4);
              setActiveTab("create_plan");
            }}
          >
            <span>✨</span> Thiết Kế Giáo Án Mới
          </button>
          <button
            id="workout-tab-community"
            className={`workout-nav-tab-btn ${activeTab === "community" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("community");
              loadCommunityPlans();
            }}
          >
            <span>🌐</span> Cộng Đồng Gymmer
          </button>
          <button
            id="workout-tab-history"
            className={`workout-nav-tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <span>📊</span> Báo Cáo & Nhật Ký
          </button>
        </div>
      </div>

      {/* 2. KPI Quick Stats Strip (4 Uniform Balanced Cards) */}
      <div className="workout-kpi-strip">
        <div className="workout-kpi-card">
          <div className="workout-kpi-icon" style={{ background: "rgba(239, 68, 68, 0.14)", color: "#ef4444" }}>
            🔥
          </div>
          <div className="workout-kpi-text-area">
            <div className="workout-kpi-label">Workout Streak</div>
            <div className="workout-kpi-val font-numeric">
              {reportData?.streak !== undefined ? reportData.streak : 0} Ngày
            </div>
          </div>
        </div>

        <div className="workout-kpi-card">
          <div className="workout-kpi-icon" style={{ background: "rgba(16, 185, 129, 0.14)", color: "#10b981" }}>
            ⏱️
          </div>
          <div className="workout-kpi-text-area">
            <div className="workout-kpi-label">Tổng Thời Gian</div>
            <div className="workout-kpi-val font-numeric">
              {reportData?.tong_thoi_gian_phut || 0} Phút
            </div>
          </div>
        </div>

        <div className="workout-kpi-card">
          <div className="workout-kpi-icon" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
            🎯
          </div>
          <div className="workout-kpi-text-area">
            <div className="workout-kpi-label">Số Buổi Đã Tập</div>
            <div className="workout-kpi-val font-numeric">
              {reportData?.tong_buoi_tap || 0} Buổi
            </div>
          </div>
        </div>

        <div className="workout-kpi-card">
          <div className="workout-kpi-icon" style={{ background: "rgba(245, 158, 11, 0.14)", color: "#f59e0b" }}>
            ⚡
          </div>
          <div className="workout-kpi-text-area">
            <div className="workout-kpi-label">Giáo Án Đang Dùng</div>
            <div
              className="workout-kpi-val font-numeric"
              style={{ fontSize: "0.98rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title={scheduleData?.ke_hoach?.ten_ke_hoach || "Chưa chọn giáo án"}
            >
              {scheduleData?.ke_hoach?.ten_ke_hoach || "Chưa có giáo án"}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: HÔM NAY & LỊCH TUẦN (WEEKLY STRIP + HERO PROGRESS + CHECKLIST + TIMER)
          ========================================================================= */}
      {activeTab === "today" && (
        <>
          {/* Weekly 7-Day Strip with Separated Title & Plan Tag */}
          <div className="schedule-strip-card">
            <div className="schedule-header-row">
              <div className="schedule-header-left">
                <h3 className="schedule-header-title">
                  <span>🗓️</span> Lịch Tập 7 Ngày Trong Tuần
                </h3>
                {scheduleData?.ke_hoach && (
                  <span className="schedule-plan-badge">
                    ⚡ {scheduleData.ke_hoach.ten_ke_hoach}
                  </span>
                )}
              </div>
              <button
                className="btn-action-pill btn-pill-primary"
                onClick={() => setSelectedDay(todayDayNum)}
              >
                📍 Hôm Nay ({DAYS_OF_WEEK.find((d) => d.day === todayDayNum)?.fullName})
              </button>
            </div>

            <div className="weekly-schedule-grid">
              {DAYS_OF_WEEK.map((item) => {
                const daySession = scheduleData?.danh_sach_buoi_tap?.find(
                  (b) => b.ngay_trong_tuan === item.day
                );
                const isToday = item.day === todayDayNum;
                const isSelected = item.day === selectedDay;
                const isRest = daySession?.is_rest_day;

                return (
                  <div
                    key={item.day}
                    id={`schedule-day-${item.day}`}
                    className={`schedule-day-box ${isToday ? "is-today" : ""} ${
                      isSelected ? "is-selected" : ""
                    } ${isRest ? "is-rest" : ""}`}
                    onClick={() => setSelectedDay(item.day)}
                  >
                    <div className="day-code-wrap">
                      <span className="day-code">{item.label}</span>
                      {isToday && <span className="today-dot" title="Hôm nay" />}
                    </div>
                    <div className="session-name">
                      {isRest ? "🛌 Nghỉ ngơi" : daySession?.ten_buoi_tap || "Chưa có lịch"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nếu ngày được chọn là ngày nghỉ */}
          {currentSession?.is_rest_day ? (
            <div className="rest-day-card">
              <div className="rest-day-icon-bounce">🛌</div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 8px 0" }}>
                {DAYS_OF_WEEK.find((d) => d.day === selectedDay)?.fullName}: Ngày Nghỉ Phục Hồi
              </h3>
              <p
                style={{
                  maxWidth: "540px",
                  margin: "0 auto 18px auto",
                  color: "var(--lp-text-muted)",
                  fontSize: "0.88rem",
                  lineHeight: 1.5
                }}
              >
                Cơ bắp phát triển và tự chữa lành trong những ngày nghỉ ngơi. Hãy ăn uống đủ chất đạm,
                uống nhiều nước và ngủ đủ giấc để sẵn sàng cho buổi tập tiếp theo!
              </p>
              <div className="d-flex justify-content-center">
                <button
                  className="btn-action-pill btn-pill-primary"
                  onClick={() => handleToggleRestDay(currentSession._id, true)}
                >
                  ⚡ Chuyển thành ngày tập nếu bạn muốn
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Workout Progress Hero Banner */}
              <div className="workout-progress-card">
                <div className="workout-progress-left">
                  <div className="workout-progress-icon-badge">🎯</div>
                  <div>
                    <h3 className="workout-progress-title">
                      {currentSession?.ten_buoi_tap || "Buổi tập chính"}
                    </h3>
                    <p className="workout-progress-sub">
                      {DAYS_OF_WEEK.find((d) => d.day === selectedDay)?.fullName} • Hoàn thành{" "}
                      {completedCount}/{exerciseCount} bài tập
                    </p>
                  </div>
                </div>

                <div className="workout-progress-bar-wrap">
                  <div className="workout-slim-progress">
                    <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                <div className="workout-progress-percent font-numeric">
                  {progressPercent}%
                </div>
              </div>

              {/* Main Workout Cards: Left = Checklist (7 cols), Right = Timer & Player (5 cols) */}
              <div className="row g-3">
                {/* Cột trái: Checklist bài tập */}
                <div className="col-lg-7">
                  <div className="workout-main-card">
                    <div className="checklist-header-box">
                      <div className="checklist-header-title-wrap">
                        <span style={{ fontSize: "1.1rem" }}>📋</span>
                        <h4 className="checklist-header-title">Danh Sách Bài Tập Cần Thực Hiện</h4>
                      </div>
                      <div className="checklist-header-actions">
                        <button
                          className="btn-action-pill btn-pill-primary"
                          onClick={() => handleOpenAddExModal(currentSession)}
                        >
                          + Thêm Bài
                        </button>
                        <button
                          className="btn-action-pill btn-pill-warning"
                          onClick={() => handleToggleRestDay(currentSession._id, false)}
                          title="Đổi ngày này thành ngày nghỉ ngơi"
                        >
                          🛌 Đánh Dấu Nghỉ
                        </button>
                      </div>
                    </div>

                    {/* Danh sách checklist */}
                    {exerciseCount === 0 ? (
                      <div className="text-center py-5" style={{ color: "var(--lp-text-muted)" }}>
                        <p style={{ fontSize: "0.92rem", marginBottom: "14px" }}>
                          Chưa có bài tập nào cho buổi này.
                        </p>
                        <button
                          className="btn-action-pill btn-pill-primary"
                          onClick={() => handleOpenAddExModal(currentSession)}
                        >
                          + Thêm bài tập ngay
                        </button>
                      </div>
                    ) : (
                      <div className="workout-checklist-container">
                        {currentSession.chi_tiet.map((item) => {
                          const isDone = completedExercises.includes(item._id);
                          const isActive = activeExercise?._id === item._id;
                          const exInfo = item.bai_tap_the_chat_id;

                          return (
                            <div
                              key={item._id}
                              className={`checklist-exercise-item ${isDone ? "completed" : ""} ${
                                isActive ? "active-exercise" : ""
                              }`}
                              onClick={() => setActiveExercise(item)}
                            >
                              <div
                                className="checklist-item-checkbox-col"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExerciseCheck(item._id);
                                }}
                              >
                                <input
                                  type="checkbox"
                                  className="custom-check-box"
                                  checked={isDone}
                                  onChange={() => {}}
                                />
                              </div>

                              <div className="checklist-item-content">
                                <div className="checklist-item-title-col">
                                  <h5 className="exercise-title">
                                    {exInfo?.ten_bai_tap || "Bài tập"}
                                  </h5>
                                  {exInfo?.meo_tap && (
                                    <div
                                      style={{
                                        fontSize: "0.72rem",
                                        color: "var(--lp-text-muted)",
                                        marginTop: "2px"
                                      }}
                                    >
                                      💡 {exInfo.meo_tap}
                                    </div>
                                  )}
                                </div>

                                <div className="checklist-item-meta-col">
                                  <span className="badge-group-tag">
                                    {exInfo?.nhom_co || "Tổng hợp"}
                                  </span>
                                  <span className="badge-metric-tag font-numeric">
                                    {item.so_sets} Sets × {item.so_reps} Reps
                                  </span>
                                </div>

                                <div className="checklist-item-action-area">
                                  <button
                                    className="btn-icon-circle"
                                    title="Sửa bài tập"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditDetailModal(item);
                                    }}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className="btn-icon-circle text-danger"
                                    title="Xóa bài tập"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteExercise(item._id);
                                    }}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Nút Hoàn Thành Buổi Tập */}
                    <div className="mt-3 pt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <span style={{ fontSize: "0.82rem", color: "var(--lp-text-muted)" }}>
                        {completedCount === exerciseCount && exerciseCount > 0
                          ? "🌟 Bạn đã hoàn thành toàn bộ bài tập trong buổi!"
                          : "Tập luyện theo khả năng và ghi nhận khi hoàn thành."}
                      </span>
                      <button
                        className="btn-finish-workout"
                        onClick={handleCompleteWorkout}
                      >
                        ✅ Hoàn Thành Buổi Tập
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cột phải: Timer, Rest Timer & Active Exercise Player */}
                <div className="col-lg-5">
                  <div className="workout-main-card workout-timer-sticky">
                    <div className="workout-timer-box">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span style={{ fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase" }}>
                          ⏱️ Đồng Hồ Bấm Giờ
                        </span>
                        <span
                          className={`workout-status-badge ${
                            isStopwatchRunning ? "badge-running" : "badge-not-started"
                          }`}
                        >
                          {isStopwatchRunning ? "Đang tập..." : "Tạm dừng"}
                        </span>
                      </div>

                      <div className="timer-display font-numeric">{formatTime(stopwatchSeconds)}</div>

                      <div className="d-flex justify-content-center gap-2 mt-2">
                        <button
                          className={`btn-action-pill ${isStopwatchRunning ? "btn-pill-warning" : "btn-pill-primary"}`}
                          onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                        >
                          {isStopwatchRunning ? "⏸️ Tạm Dừng" : "▶️ Bắt Đầu Tập"}
                        </button>
                        <button
                          className="btn-action-pill btn-pill-primary"
                          onClick={() => {
                            setIsStopwatchRunning(false);
                            setStopwatchSeconds(0);
                          }}
                        >
                          🔄 Đặt Lại
                        </button>
                      </div>
                    </div>

                    {/* Rest Timer Countdown */}
                    <div className="active-exercise-card mb-3 p-3 text-center">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                          🛑 Nghỉ Giữa Các Hiệp (Rest Timer)
                        </span>
                        <span className="font-numeric" style={{ fontWeight: 800, color: "var(--lp-warning)", fontSize: "1rem" }}>
                          {restCountdown > 0 ? `${restCountdown}s` : "0s"}
                        </span>
                      </div>

                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn-action-pill btn-pill-primary"
                          style={{ height: "30px", fontSize: "0.74rem", padding: "0 10px" }}
                          onClick={() => setRestCountdown(30)}
                        >
                          +30s
                        </button>
                        <button
                          className="btn-action-pill btn-pill-primary"
                          style={{ height: "30px", fontSize: "0.74rem", padding: "0 10px" }}
                          onClick={() => setRestCountdown(60)}
                        >
                          +60s
                        </button>
                        <button
                          className="btn-action-pill btn-pill-primary"
                          style={{ height: "30px", fontSize: "0.74rem", padding: "0 10px" }}
                          onClick={() => setRestCountdown(90)}
                        >
                          +90s
                        </button>
                        {restCountdown > 0 && (
                          <button
                            className="btn-action-pill btn-pill-warning"
                            style={{ height: "30px", fontSize: "0.74rem", padding: "0 10px" }}
                            onClick={() => setRestCountdown(0)}
                          >
                            Tắt
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Active Exercise Detail Card */}
                    {activeExercise ? (
                      <div className="active-exercise-card">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="badge-metric-tag" style={{ fontSize: "0.72rem" }}>
                            Đang Thực Hiện
                          </span>
                          <span className="badge-group-tag">
                            {activeExercise.bai_tap_the_chat_id?.nhom_co || "Nhóm cơ"}
                          </span>
                        </div>
                        <h4 className="active-exercise-title">
                          {activeExercise.bai_tap_the_chat_id?.ten_bai_tap}
                        </h4>
                        <div
                          className="d-flex align-items-center gap-3 my-2 p-2 rounded"
                          style={{ background: "var(--lp-bg-card)", border: "1px solid var(--lp-card-border)" }}
                        >
                          <div style={{ flex: 1, textAlign: "center" }}>
                            <div style={{ fontSize: "0.7rem", color: "var(--lp-text-muted)" }}>Mục tiêu</div>
                            <div className="font-numeric" style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--lp-primary)" }}>
                              {activeExercise.so_sets} Sets
                            </div>
                          </div>
                          <div style={{ width: "1px", height: "28px", background: "var(--lp-card-border)" }} />
                          <div style={{ flex: 1, textAlign: "center" }}>
                            <div style={{ fontSize: "0.7rem", color: "var(--lp-text-muted)" }}>Lặp lại</div>
                            <div className="font-numeric" style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--lp-primary)" }}>
                              {activeExercise.so_reps} Reps
                            </div>
                          </div>
                        </div>

                        {activeExercise.bai_tap_the_chat_id?.meo_tap && (
                          <p style={{ fontSize: "0.78rem", color: "var(--lp-text-muted)", margin: "8px 0 0 0" }}>
                            📌 <b>Mẹo kỹ thuật:</b> {activeExercise.bai_tap_the_chat_id.meo_tap}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4" style={{ color: "var(--lp-text-muted)", fontSize: "0.82rem" }}>
                        Click vào một bài tập ở danh sách bên trái để theo dõi chi tiết tại đây.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Monthly Heatmap 30 Ngày */}
          <div className="workout-main-card mt-4">
            <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
              <h3 style={{ fontSize: "1rem", fontWeight: "700", margin: 0 }}>
                🟩 Tần Suất Rèn Luyện 30 Ngày Gần Nhất (Heatmap)
              </h3>
              <span style={{ fontSize: "0.78rem", color: "var(--lp-text-muted)" }}>
                Màu càng đậm thể hiện thời lượng tập càng nhiều
              </span>
            </div>

            <div className="heatmap-grid">
              {Array.from({ length: 30 }).map((_, idx) => {
                const dateStr = new Date(Date.now() - (29 - idx) * 86400000).toISOString().split("T")[0];
                const lvl = reportData?.heatmap?.[dateStr] || 0;
                return (
                  <div
                    key={idx}
                    className={`heatmap-cell ${lvl > 0 ? `heatmap-lvl-${lvl}` : ""}`}
                    title={`${dateStr}: Mức độ rèn luyện ${lvl}/4`}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 2: QUẢN LÝ GIÁO ÁN (CRUD, KÍCH HOẠT, TÙY CHỈNH NGÀY/BÀI TẬP)
          ========================================================================= */}
      {activeTab === "plans" && (
        <div>
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Danh Sách Giáo Án Cá Nhân</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--lp-text-muted)", margin: "4px 0 0 0" }}>
                Tạo nhiều kế hoạch tập luyện khác nhau và chuyển đổi lịch đang sử dụng bất kỳ lúc nào.
              </p>
            </div>
            <button className="btn-action-pill btn-pill-primary" onClick={() => handleOpenPlanModal()}>
              + Tạo Giáo Án Mới
            </button>
          </div>

          {/* Danh sách các kế hoạch (Grid) */}
          <div className="row g-3 mb-4">
            {plansList.map((plan) => (
              <div key={plan._id} className="col-md-6 col-lg-4">
                <div className={`plan-card-item ${plan.is_active ? "is-active-plan" : ""}`}>
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-1 flex-wrap">
                        {plan.is_active ? (
                          <span className="badge-metric-tag">⚡ ĐANG SỬ DỤNG</span>
                        ) : (
                          <span className="badge-group-tag">Giáo án lưu trữ</span>
                        )}
                        {plan.is_default && (
                          <span className="badge-group-tag" style={{ fontSize: "0.68rem" }}>
                            Mẫu mặc định
                          </span>
                        )}
                      </div>
                      {plan.share_code && (
                        <span
                          className="community-code-badge"
                          onClick={() => handleCopyCode(plan.share_code)}
                          title="Click để sao chép mã chia sẻ"
                        >
                          🔗 {plan.share_code}
                        </span>
                      )}
                    </div>

                    <h4 className="plan-card-title">{plan.ten_ke_hoach}</h4>
                    <p className="plan-card-desc">{plan.mo_ta || "Không có mô tả chi tiết."}</p>
                  </div>

                  <div className="mt-3 pt-3 border-top">
                    <div className="d-flex align-items-center justify-content-between mb-3" style={{ fontSize: "0.78rem", color: "var(--lp-text-muted)" }}>
                      <span>💪 {plan.so_buoi_tap || 0} Ngày tập</span>
                      <span>🛌 {plan.so_ngay_nghi || 0} Ngày nghỉ</span>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {!plan.is_active && (
                        <button
                          className="btn-action-pill btn-pill-primary"
                          style={{ height: "30px", fontSize: "0.74rem" }}
                          onClick={() => handleActivatePlan(plan._id)}
                        >
                          ⚡ Kích Hoạt
                        </button>
                      )}
                      <button
                        className="btn-action-pill btn-pill-primary"
                        style={{ height: "30px", fontSize: "0.74rem" }}
                        onClick={() => loadPlanForEdit(plan)}
                      >
                        ⚙️ Chi Tiết
                      </button>
                      <button
                        className="btn-action-pill btn-pill-primary"
                        style={{ height: "30px", fontSize: "0.74rem", borderColor: "var(--lp-primary)" }}
                        onClick={() => handleOpenShareModal(plan)}
                        title="Chia sẻ mã code cho bạn bè hoặc cộng đồng"
                      >
                        🔗 Chia Sẻ
                      </button>
                      <button
                        className="btn-icon-circle"
                        style={{ width: "30px", height: "30px" }}
                        onClick={() => handleOpenPlanModal(plan)}
                        title="Đổi tên giáo án"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon-circle text-danger"
                        style={{ width: "30px", height: "30px" }}
                        onClick={() => {
                          setPlanToDelete(plan);
                          setShowDeleteModal(true);
                        }}
                        title="Xóa giáo án này"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trình Tùy Chỉnh 7 Ngày Trong Tuần Của Kế Hoạch Đang Chọn */}
          {selectedPlanForEdit && (
            <div className="workout-main-card mt-4">
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                <div>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                    🛠️ Tùy Chỉnh 7 Ngày: {selectedPlanForEdit.ten_ke_hoach}
                  </h4>
                  <span style={{ fontSize: "0.8rem", color: "var(--lp-text-muted)" }}>
                    Điều chỉnh ngày tập, đánh dấu ngày nghỉ và thêm/sửa/xóa bài tập cho từng ngày
                  </span>
                </div>
                <button
                  className="btn-action-pill btn-pill-primary"
                  onClick={() => setSelectedPlanForEdit(null)}
                >
                  Đóng ✕
                </button>
              </div>

              <div className="d-flex flex-column gap-3">
                {DAYS_OF_WEEK.map((d) => {
                  const s = planDetailSessions?.find((b) => b.ngay_trong_tuan === d.day);
                  if (!s) return null;

                  return (
                    <div
                      key={d.day}
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        background: s.is_rest_day ? "var(--lp-bg-surface)" : "var(--lp-bg-card)",
                        border: s.is_rest_day ? "1.5px dashed var(--lp-card-border)" : "1px solid var(--lp-card-border)"
                      }}
                    >
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge-metric-tag">{d.fullName}</span>
                          <input
                            type="text"
                            defaultValue={s.ten_buoi_tap}
                            onBlur={(e) => handleUpdateSessionName(s._id, e.target.value)}
                            style={{
                              border: "none",
                              background: "transparent",
                              fontWeight: 700,
                              fontSize: "0.92rem",
                              color: "var(--lp-text-main)",
                              borderBottom: "1px dashed var(--lp-card-border)",
                              outline: "none"
                            }}
                          />
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <button
                            className={`btn-action-pill ${s.is_rest_day ? "btn-pill-warning" : "btn-pill-primary"}`}
                            style={{ height: "30px", fontSize: "0.74rem" }}
                            onClick={() => handleToggleRestDay(s._id, s.is_rest_day)}
                          >
                            {s.is_rest_day ? "🛌 Đang Là Ngày Nghỉ" : "💪 Đang Là Ngày Tập"}
                          </button>
                          {!s.is_rest_day && (
                            <button
                              className="btn-action-pill btn-pill-primary"
                              style={{ height: "30px", fontSize: "0.74rem" }}
                              onClick={() => handleOpenAddExModal(s)}
                            >
                              + Thêm Bài Tập
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bài tập trong ngày */}
                      {!s.is_rest_day && (
                        <div className="ps-2">
                          {s.chi_tiet && s.chi_tiet.length > 0 ? (
                            <div className="d-flex flex-column gap-2 mt-2">
                              {s.chi_tiet.map((it) => (
                                <div
                                  key={it._id}
                                  className="d-flex align-items-center justify-content-between p-2 rounded"
                                  style={{
                                    background: "var(--lp-bg-surface)",
                                    border: "1px solid var(--lp-card-border)",
                                    fontSize: "0.82rem"
                                  }}
                                >
                                  <div>
                                    <span style={{ fontWeight: 600 }}>
                                      {it.bai_tap_the_chat_id?.ten_bai_tap}
                                    </span>
                                    <span className="badge-group-tag ms-2">
                                      {it.bai_tap_the_chat_id?.nhom_co}
                                    </span>
                                    <span className="badge-metric-tag ms-2 font-numeric">
                                      {it.so_sets} Sets × {it.so_reps} Reps
                                    </span>
                                  </div>
                                  <div className="d-flex gap-1">
                                    <button
                                      className="btn-icon-circle"
                                      onClick={() => handleOpenEditDetailModal(it)}
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      className="btn-icon-circle text-danger"
                                      onClick={() => handleDeleteExercise(it._id)}
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: "0.8rem", color: "var(--lp-text-muted)", marginTop: "6px" }}>
                              Chưa có bài tập nào. Hãy bấm "+ Thêm Bài Tập".
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2.5: THIẾT KẾ GIÁO ÁN MỚI (TỪNG BƯỚC SLIDE TỪ PHẢI SANG)
          ========================================================================= */}
      {activeTab === "create_plan" && (
        <div className="glass-card mb-4" style={{ padding: "26px", borderRadius: "20px" }}>
          <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3 border-bottom pb-3">
            <div>
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: "1.5rem" }}>✨</span>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Thiết Kế Giáo Án Mới</h3>
                <span className="badge-metric-tag" style={{ fontSize: "0.75rem" }}>Quy Trình Từng Bước</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--lp-text-muted)", margin: "4px 0 0 0" }}>
                Chọn tần suất & cường độ, hệ thống sẽ gợi ý lịch mẫu và tạo các bài tập tương ứng với hiệu ứng trượt mượt mà.
              </p>
            </div>
            <button
              type="button"
              className="btn-action-pill btn-pill-primary"
              onClick={() => setActiveTab("plans")}
            >
              ← Quay Lại Quản Lý Giáo Án
            </button>
          </div>

          {renderWizardDesigner(true)}
        </div>
      )}

      {/* =========================================================================
          TAB 2.8: CỘNG ĐỒNG GYMMER & CHIA SẺ MÃ CODE GIÁO ÁN
          ========================================================================= */}
      {activeTab === "community" && (
        <div className="community-hub-container">
          {/* Hero Banner with Quick Code Input */}
          <div className="community-hero-card">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <span className="community-hero-badge">🌐 Mạng Lưới Gymer Độc Lập</span>
              {copyFeedback && (
                <span className="badge bg-success text-white py-1 px-3" style={{ fontSize: "0.8rem", borderRadius: "999px" }}>
                  {copyFeedback}
                </span>
              )}
            </div>
            
            <h2 className="community-hero-title">Cộng Đồng Giáo Án & Chia Sẻ Mã Code 🏋️‍♂️</h2>
            <p className="community-hero-subtitle">
              Chia sẻ giáo án độc quyền của bạn cho bạn bè qua mã Code ngắn gọn. Khi bạn bè nhập mã, hệ thống sẽ tự động sao chép toàn bộ buổi tập và các bài tập khoa học vào tài khoản của họ ngay lập tức!
            </p>

            {/* Quick Code Entry Bar */}
            <div className="community-code-box-wrap">
              <input
                type="text"
                className="community-code-input"
                placeholder="NHẬP MÃ CODE (VD: GYM-8X92, PPL-4D2K)..."
                value={quickCodeInput}
                onChange={(e) => setQuickCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleQuickPreviewByCode();
                }}
              />
              <button
                type="button"
                className="community-code-import-btn"
                disabled={isPreviewLoading || !quickCodeInput.trim()}
                onClick={() => handleQuickPreviewByCode()}
              >
                {isPreviewLoading ? "⏳ Đang tra cứu..." : "🔍 Xem Trước & Nhập"}
              </button>
            </div>

            {/* Quick Suggestions Tags */}
            <div className="community-quick-tags">
              <span style={{ fontSize: "0.78rem", color: "var(--lp-text-muted)", fontWeight: 600 }}>Mã gợi ý phổ biến:</span>
              {["PPL-PRO", "FB-3DAYS", "UPPER-LOWER-4", "BULK-5DAYS"].map((codeTag) => (
                <button
                  key={codeTag}
                  type="button"
                  className="community-quick-pill"
                  onClick={() => {
                    setQuickCodeInput(codeTag);
                    handleQuickPreviewByCode(codeTag);
                  }}
                >
                  ⚡ {codeTag}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Bar: Frequency & Search */}
          <div className="community-filter-bar">
            <div className="community-pills-group">
              {[
                { label: "Tất Cả", value: "all" },
                { label: "3 Buổi / Tuần", value: "3" },
                { label: "4 Buổi / Tuần", value: "4" },
                { label: "5 Buổi / Tuần", value: "5" },
                { label: "6 Buổi / Tuần", value: "6" }
              ].map((pill) => (
                <button
                  key={pill.value}
                  type="button"
                  className={`community-filter-pill-btn ${communityFreqFilter === pill.value ? "active" : ""}`}
                  onClick={() => {
                    setCommunityFreqFilter(pill.value);
                    loadCommunityPlans(pill.value, communitySearch);
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="d-flex align-items-center gap-2">
              <div className="community-search-box">
                <span>🔍</span>
                <input
                  type="text"
                  className="community-search-input"
                  placeholder="Tìm tên giáo án, tác giả, mã..."
                  value={communitySearch}
                  onChange={(e) => {
                    setCommunitySearch(e.target.value);
                    loadCommunityPlans(communityFreqFilter, e.target.value);
                  }}
                />
              </div>
              <button
                type="button"
                className="btn-action-pill btn-pill-primary"
                onClick={() => loadCommunityPlans(communityFreqFilter, communitySearch)}
                title="Làm mới bảng tin"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Grid of Community Plan Cards */}
          {loadingCommunity ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <div className="mt-2 text-muted" style={{ fontSize: "0.85rem" }}>Đang tải danh sách giáo án cộng đồng...</div>
            </div>
          ) : communityPlans.length === 0 ? (
            <div className="workout-main-card text-center py-5">
              <div style={{ fontSize: "3rem" }}>🏋️‍♂️</div>
              <h4 style={{ fontWeight: 700, margin: "12px 0 6px 0" }}>Chưa có giáo án cộng đồng nào phù hợp</h4>
              <p style={{ color: "var(--lp-text-muted)", fontSize: "0.85rem", maxWidth: "480px", margin: "0 auto 16px auto" }}>
                Hãy chia sẻ giáo án đầu tiên của bạn lên cộng đồng hoặc xóa bộ lọc tìm kiếm để xem thêm các lịch tập khác!
              </p>
              <button
                type="button"
                className="btn-action-pill btn-pill-primary"
                onClick={() => {
                  setCommunityFreqFilter("all");
                  setCommunitySearch("");
                  loadCommunityPlans("all", "");
                }}
              >
                Xóa Bộ Lọc
              </button>
            </div>
          ) : (
            <div className="community-grid">
              {communityPlans.map((cPlan) => (
                <div key={cPlan._id} className="community-plan-card">
                  <div>
                    {/* Header: Author & Like */}
                    <div className="community-card-author-row">
                      <div className="community-card-author-info">
                        <div className="community-card-avatar">
                          {(cPlan.tac_gia || "G").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="community-card-author-name">
                            {cPlan.tac_gia || "Gymer Cộng Đồng"}
                            {cPlan.is_mine && <span className="ms-1 badge bg-primary" style={{ fontSize: "0.62rem" }}>Bạn</span>}
                          </div>
                          <div className="community-card-author-role">Huấn luyện viên / Gymer</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`community-like-btn ${cPlan.da_thich ? "liked" : ""}`}
                        onClick={() => handleToggleLike(cPlan._id)}
                        title={cPlan.da_thich ? "Bỏ thích" : "Thả tim"}
                      >
                        <span>{cPlan.da_thich ? "❤️" : "🤍"}</span>
                        <span>{cPlan.so_luot_thich || 0}</span>
                      </button>
                    </div>

                    {/* Title & Desc */}
                    <h3 className="community-plan-title">{cPlan.ten_ke_hoach}</h3>
                    <p className="community-plan-desc">
                      {cPlan.mo_ta || "Giáo án tập luyện chuẩn khoa học được chia sẻ bởi thành viên cộng đồng."}
                    </p>

                    {/* Meta Badges */}
                    <div className="community-plan-meta-row">
                      <span className="community-meta-badge">
                        ⚡ {cPlan.so_buoi_tuan || cPlan.so_buoi_thuc_te || 4} Buổi / Tuần
                      </span>
                      <span className="community-meta-badge">
                        📥 {cPlan.luot_tai || 0} Lượt nhập
                      </span>
                      {cPlan.cuong_do && (
                        <span className="community-meta-badge">
                          🔥 {cPlan.cuong_do === "beginner" ? "Cơ bản" : cPlan.cuong_do === "intermediate" ? "Trung cấp" : "Nâng cao"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Code Chip & Actions */}
                  <div className="community-card-footer">
                    <div className="community-code-chip-box">
                      <div>
                        <div className="community-code-chip-label">Mã chia sẻ:</div>
                        <div className="community-code-chip-val">{cPlan.share_code}</div>
                      </div>
                      <button
                        type="button"
                        className="community-code-chip-btn"
                        onClick={() => handleCopyCode(cPlan.share_code)}
                        title="Sao chép mã chia sẻ"
                      >
                        📋 Sao chép
                      </button>
                    </div>

                    <div className="community-action-row">
                      <button
                        type="button"
                        className="community-btn-preview"
                        onClick={() => handleQuickPreviewByCode(cPlan.share_code)}
                        title="Xem chi tiết các buổi và bài tập"
                      >
                        👁️ Xem chi tiết
                      </button>
                      <button
                        type="button"
                        className="community-btn-import"
                        onClick={() => handleQuickPreviewByCode(cPlan.share_code)}
                      >
                        ⚡ Dùng Giáo Án Này
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: BÁO CÁO & NHẬT KÝ TẬP LUYỆN
          ========================================================================= */}
      {activeTab === "history" && (
        <div className="workout-main-card">
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 6px 0" }}>
            📊 Nhật Ký & Lịch Sử Rèn Luyện
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--lp-text-muted)", margin: "0 0 16px 0" }}>
            Toàn bộ các buổi tập đã hoàn thành được ghi nhận bền vững và bảo toàn trong hệ thống.
          </p>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Ngày Tập</th>
                  <th>Buổi Tập / Nội Dung</th>
                  <th>Thời Gian</th>
                  <th>Ghi Chú</th>
                </tr>
              </thead>
              <tbody>
                {reportData?.recent_logs && reportData.recent_logs.length > 0 ? (
                  reportData.recent_logs.map((log) => (
                    <tr key={log._id}>
                      <td className="font-numeric" style={{ fontWeight: 600 }}>
                        {new Date(log.ngay_tap).toLocaleDateString("vi-VN", {
                          weekday: "short",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit"
                        })}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: "var(--lp-primary)" }}>
                          {log.ten_buoi_tap || "Buổi tập hoàn thành"}
                        </span>
                      </td>
                      <td className="font-numeric">{log.thoi_gian_tap_phut || 45} phút</td>
                      <td style={{ color: "var(--lp-text-muted)", fontSize: "0.82rem" }}>
                        {log.ghi_chu || "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-5 text-muted">
                      Chưa có nhật ký tập luyện nào được ghi nhận. Hãy hoàn thành buổi tập đầu tiên của bạn!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS (GLASSMORPHIC & CLEAN)
          ========================================================================= */}

      {/* Modal 1: Tạo / Sửa Kế Hoạch */}
      {showPlanModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title font-weight-bold" style={{ fontSize: "1.05rem" }}>
                  {editingPlan ? "✏️ Chỉnh Sửa Kế Hoạch" : "➕ Tạo Kế Hoạch Mới"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPlanModal(false)}
                />
              </div>
              <form onSubmit={handleSavePlan}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      Tên Kế Hoạch / Giáo Án *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="VD: Giáo Án Push Pull Legs, Tăng Cơ 4 Buổi..."
                      value={planForm.ten_ke_hoach}
                      onChange={(e) => setPlanForm({ ...planForm, ten_ke_hoach: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      Mô Tả Kế Hoạch
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Mục tiêu tập luyện, phân bổ nhóm cơ..."
                      value={planForm.mo_ta}
                      onChange={(e) => setPlanForm({ ...planForm, mo_ta: e.target.value })}
                    />
                  </div>
                  {!editingPlan && (
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="setAsActivePlan"
                        checked={planForm.is_active}
                        onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="setAsActivePlan" style={{ fontSize: "0.85rem" }}>
                        Kích hoạt làm giáo án sử dụng chính ngay sau khi tạo
                      </label>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-action-pill btn-pill-primary"
                    onClick={() => setShowPlanModal(false)}
                  >
                    Hủy Bỏ
                  </button>
                  <button type="submit" className="btn-action-pill btn-pill-primary" style={{ background: "var(--lp-primary)", color: "#fff" }}>
                    {editingPlan ? "Cập Nhật" : "Tạo Kế Hoạch"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Xác Nhận Xóa Kế Hoạch */}
      {showDeleteModal && planToDelete && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-danger">
                <h5 className="modal-title text-danger font-weight-bold" style={{ fontSize: "1.05rem" }}>
                  ⚠️ Xác Nhận Xóa Kế Hoạch
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                />
              </div>
              <div className="modal-body">
                <p style={{ fontSize: "0.92rem", marginBottom: "12px" }}>
                  Bạn có chắc chắn muốn xóa giáo án <b>"{planToDelete.ten_ke_hoach}"</b>?
                </p>
                <div
                  className="p-3 rounded"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    fontSize: "0.82rem",
                    color: "var(--lp-danger)",
                    lineHeight: 1.5
                  }}
                >
                  🛡️ <b>Bảo toàn dữ liệu:</b> Các buổi tập trong giáo án này sẽ bị xóa, nhưng toàn bộ{" "}
                  <b>Lịch sử tập luyện, Chuỗi Streak và Heatmap</b> trước đây của bạn vẫn được lưu giữ an toàn!
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-action-pill btn-pill-primary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  className="btn-action-pill btn-pill-warning"
                  style={{ background: "var(--lp-danger)", color: "#fff", border: "none" }}
                  onClick={handleConfirmDeletePlan}
                >
                  Xác Nhận Xóa Vĩnh Viễn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Thêm Bài Tập Vào Buổi */}
      {showAddExModal && currentBuoiForEx && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title font-weight-bold" style={{ fontSize: "1.05rem" }}>
                  ➕ Thêm Bài Tập Vào: {currentBuoiForEx.ten_buoi_tap}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddExModal(false)}
                />
              </div>
              <form onSubmit={handleSaveExercise}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      Chọn Từ Danh Mục Bài Tập Mẫu
                    </label>
                    <select
                      className="form-select"
                      value={exForm.bai_tap_the_chat_id}
                      onChange={(e) => setExForm({ ...exForm, bai_tap_the_chat_id: e.target.value })}
                    >
                      <option value="">-- Hoặc nhập bài tập tùy chỉnh bên dưới --</option>
                      {exerciseCatalog.map((ex) => (
                        <option key={ex._id} value={ex._id}>
                          [{ex.nhom_co}] {ex.ten_bai_tap}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!exForm.bai_tap_the_chat_id && (
                    <div className="p-3 mb-3 rounded" style={{ background: "var(--lp-bg-surface)" }}>
                      <div className="mb-2">
                        <label className="form-label" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                          Tên Bài Tập Tùy Chỉnh *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="VD: Hít đất, Kéo xà đơn..."
                          value={exForm.ten_bai_tap}
                          onChange={(e) => setExForm({ ...exForm, ten_bai_tap: e.target.value })}
                        />
                      </div>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="form-label" style={{ fontSize: "0.82rem" }}>
                            Nhóm Cơ
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Ngực, Lưng, Chân..."
                            value={exForm.nhom_co}
                            onChange={(e) => setExForm({ ...exForm, nhom_co: e.target.value })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label" style={{ fontSize: "0.82rem" }}>
                            Loại
                          </label>
                          <select
                            className="form-select"
                            value={exForm.loai_bai_tap}
                            onChange={(e) => setExForm({ ...exForm, loai_bai_tap: e.target.value })}
                          >
                            <option value="strength">Sức mạnh (Strength)</option>
                            <option value="cardio">Cardio</option>
                            <option value="core">Core / Bụng</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="row g-2">
                    <div className="col-4">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                        Số Sets
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        className="form-control font-numeric"
                        value={exForm.so_sets}
                        onChange={(e) => setExForm({ ...exForm, so_sets: e.target.value })}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                        Số Reps
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="form-control font-numeric"
                        value={exForm.so_reps}
                        onChange={(e) => setExForm({ ...exForm, so_reps: e.target.value })}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                        Phút (Tùy chọn)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        className="form-control font-numeric"
                        value={exForm.thoi_luong_phut}
                        onChange={(e) => setExForm({ ...exForm, thoi_luong_phut: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-action-pill btn-pill-primary"
                    onClick={() => setShowAddExModal(false)}
                  >
                    Hủy Bỏ
                  </button>
                  <button type="submit" className="btn-action-pill btn-pill-primary" style={{ background: "var(--lp-primary)", color: "#fff" }}>
                    Thêm Vào Buổi Tập
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Sửa Thông Số Bài Tập */}
      {showEditDetailModal && editingDetail && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title font-weight-bold" style={{ fontSize: "1.05rem" }}>
                  ✏️ Sửa Thông Số: {editingDetail.bai_tap_the_chat_id?.ten_bai_tap}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditDetailModal(false)}
                />
              </div>
              <form onSubmit={handleSaveEditDetail}>
                <div className="modal-body">
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                        Số Sets
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        className="form-control font-numeric"
                        value={detailForm.so_sets}
                        onChange={(e) => setDetailForm({ ...detailForm, so_sets: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                        Số Reps
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="form-control font-numeric"
                        value={detailForm.so_reps}
                        onChange={(e) => setDetailForm({ ...detailForm, so_reps: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-action-pill btn-pill-primary"
                    onClick={() => setShowEditDetailModal(false)}
                  >
                    Hủy Bỏ
                  </button>
                  <button type="submit" className="btn-action-pill btn-pill-primary" style={{ background: "var(--lp-primary)", color: "#fff" }}>
                    Lưu Thay Đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Thêm Bài Tập trong Wizard Bước 2 */}
      {showWizardAddExModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1070 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title font-weight-bold" style={{ fontSize: "1.05rem" }}>
                  ➕ Thêm Bài Tập Vào: {DAYS_OF_WEEK.find((d) => d.day === wizardTargetDay)?.fullName}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowWizardAddExModal(false)}
                />
              </div>
              <form onSubmit={handleSaveWizardExercise}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      Chọn Từ Kho Bài Tập Mẫu
                    </label>
                    <select
                      className="form-select"
                      value={wizardExForm.bai_tap_the_chat_id}
                      onChange={(e) =>
                        setWizardExForm({
                          ...wizardExForm,
                          bai_tap_the_chat_id: e.target.value
                        })
                      }
                    >
                      <option value="">-- Hoặc tự nhập bài tập tùy chỉnh bên dưới --</option>
                      {exerciseCatalog.map((ex) => (
                        <option key={ex._id} value={ex._id}>
                          [{ex.nhom_co}] {ex.ten_bai_tap}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!wizardExForm.bai_tap_the_chat_id && (
                    <div className="p-3 mb-3 rounded" style={{ background: "var(--lp-bg-surface)", border: "1px solid var(--lp-card-border)" }}>
                      <div className="mb-2">
                        <label className="form-label" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                          Tên Bài Tập Tùy Chỉnh *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="VD: Hít đất, Kéo xà, Gập bụng..."
                          value={wizardExForm.ten_bai_tap}
                          onChange={(e) =>
                            setWizardExForm({ ...wizardExForm, ten_bai_tap: e.target.value })
                          }
                          required={!wizardExForm.bai_tap_the_chat_id}
                        />
                      </div>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="form-label" style={{ fontSize: "0.82rem" }}>
                            Nhóm Cơ
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={wizardExForm.nhom_co}
                            onChange={(e) =>
                              setWizardExForm({ ...wizardExForm, nhom_co: e.target.value })
                            }
                          >
                            <option value="Ngực">Ngực (Chest)</option>
                            <option value="Lưng">Lưng (Back)</option>
                            <option value="Lưng xô">Lưng xô (Lats)</option>
                            <option value="Vai">Vai (Shoulders)</option>
                            <option value="Tay trước">Tay trước (Biceps)</option>
                            <option value="Tay sau">Tay sau (Triceps)</option>
                            <option value="Đùi trước & Mông">Đùi trước & Mông (Quads/Glutes)</option>
                            <option value="Đùi sau & Lưng dưới">Đùi sau & Lưng dưới (Hamstrings)</option>
                            <option value="Bắp chân">Bắp chân (Calves)</option>
                            <option value="Cơ bụng & Core">Cơ bụng & Core (Abs)</option>
                            <option value="Cardio">Cardio / Tim mạch</option>
                            <option value="Toàn thân">Toàn thân (Full Body)</option>
                          </select>
                        </div>
                        <div className="col-6">
                          <label className="form-label" style={{ fontSize: "0.82rem" }}>
                            Loại Bài Tập
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={wizardExForm.loai_bai_tap}
                            onChange={(e) =>
                              setWizardExForm({ ...wizardExForm, loai_bai_tap: e.target.value })
                            }
                          >
                            <option value="strength">Sức mạnh (Strength)</option>
                            <option value="cardio">Cardio</option>
                            <option value="core">Core / Bụng</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="row g-2">
                    <div className="col-4">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                        Số Sets
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        className="form-control font-numeric"
                        value={wizardExForm.sets}
                        onChange={(e) =>
                          setWizardExForm({ ...wizardExForm, sets: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                        Số Reps
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="form-control font-numeric"
                        value={wizardExForm.reps}
                        onChange={(e) =>
                          setWizardExForm({ ...wizardExForm, reps: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                        Phút (Tùy chọn)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        className="form-control font-numeric"
                        value={wizardExForm.mins}
                        onChange={(e) =>
                          setWizardExForm({ ...wizardExForm, mins: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-action-pill btn-pill-primary"
                    onClick={() => setShowWizardAddExModal(false)}
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn-action-pill btn-pill-primary"
                    style={{ background: "var(--lp-primary)", color: "#fff" }}
                  >
                    ➕ Thêm Vào Buổi Tập
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CHIA SẺ GIÁO ÁN LÊN CỘNG ĐỒNG & TẠO MÃ CODE
          ========================================================================= */}
      {showShareModal && shareModalPlan && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title font-weight-bold" style={{ fontSize: "1.05rem" }}>
                  🔗 Chia Sẻ Giáo Án & Tạo Mã Code
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowShareModal(false)}
                />
              </div>

              <form onSubmit={handleGenerateShareCode}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                      Giáo án đang chọn
                    </label>
                    <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--lp-primary)" }}>
                      {shareModalPlan.ten_ke_hoach}
                    </div>
                  </div>

                  {shareModalPlan.share_code ? (
                    <div className="share-modal-code-display">
                      <div style={{ fontSize: "0.78rem", color: "var(--lp-text-muted)", marginBottom: "4px" }}>
                        MÃ CODE CHIA SẺ HIỆN TẠI
                      </div>
                      <div className="share-modal-code-text">{shareModalPlan.share_code}</div>
                      <div className="d-flex justify-content-center gap-2 mt-2">
                        <button
                          type="button"
                          className="btn-action-pill btn-pill-primary"
                          style={{ height: "32px", fontSize: "0.76rem" }}
                          onClick={() => handleCopyCode(shareModalPlan.share_code)}
                        >
                          📋 Sao chép mã code
                        </button>
                        <button
                          type="button"
                          className="btn-action-pill btn-pill-primary"
                          style={{ height: "32px", fontSize: "0.76rem" }}
                          onClick={() => {
                            const shareUrl = `${window.location.origin}/workout?code=${shareModalPlan.share_code}`;
                            navigator.clipboard.writeText(shareUrl);
                            setCopyFeedback("Đã sao chép link chia sẻ!");
                            setTimeout(() => setCopyFeedback(""), 3000);
                          }}
                        >
                          🔗 Sao chép link
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-info py-2" style={{ fontSize: "0.82rem" }}>
                      💡 Giáo án này chưa có mã chia sẻ. Hãy bấm "Tạo Mã Code" bên dưới để hệ thống sinh mã độc quyền cho bạn!
                    </div>
                  )}

                  {copyFeedback && (
                    <div className="alert alert-success py-2 mb-3 text-center" style={{ fontSize: "0.82rem" }}>
                      {copyFeedback}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: "0.84rem" }}>
                      Mã Code Tự Chọn (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      className="form-control font-numeric"
                      placeholder="VD: PPL-PRO, CHONG-DAY-VIP..."
                      value={shareForm.custom_code}
                      onChange={(e) => setShareForm({ ...shareForm, custom_code: e.target.value.toUpperCase() })}
                      style={{ letterSpacing: "1.5px", fontWeight: 700 }}
                    />
                    <small className="text-muted" style={{ fontSize: "0.74rem" }}>
                      Để trống để hệ thống tự động sinh mã ngẫu nhiên duy nhất (VD: GYM-9X4A).
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: "0.84rem" }}>
                      Thể Loại Giáo Án
                    </label>
                    <select
                      className="form-select"
                      value={shareForm.the_loai}
                      onChange={(e) => setShareForm({ ...shareForm, the_loai: e.target.value })}
                    >
                      <option value="Tăng cơ - Hypertrophy">Tăng cơ - Hypertrophy</option>
                      <option value="Sức mạnh - Strength">Sức mạnh - Strength</option>
                      <option value="Giảm mỡ & Siết cơ">Giảm mỡ & Siết cơ</option>
                      <option value="Tối giản cho người bận rộn">Tối giản cho người bận rộn</option>
                      <option value="Calisthenics & Bodyweight">Calisthenics & Bodyweight</option>
                      <option value="Thể lực & Cardio">Thể lực & Cardio</option>
                    </select>
                  </div>

                  <div className="form-check mb-2">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="publicCommunityCheck"
                      checked={shareForm.is_public_community}
                      onChange={(e) => setShareForm({ ...shareForm, is_public_community: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="publicCommunityCheck" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      🌐 Công khai trên Bảng Tin Cộng Đồng Gymmer
                    </label>
                  </div>
                  <small className="text-muted d-block mb-3" style={{ fontSize: "0.74rem", marginLeft: "24px" }}>
                    Khi bật, mọi người trong cộng đồng có thể nhìn thấy, đánh giá và tải giáo án này về lịch của họ.
                  </small>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-action-pill btn-pill-primary"
                    onClick={() => setShowShareModal(false)}
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="btn-action-pill btn-pill-primary"
                    style={{ background: "var(--lp-primary)", color: "#fff" }}
                    disabled={isGeneratingCode}
                  >
                    {isGeneratingCode ? "⏳ Đang tạo..." : shareModalPlan.share_code ? "🔄 Cập Nhật Mã" : "✨ Tạo Mã Chia Sẻ"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: XEM TRƯỚC & NHẬP GIÁO ÁN VÀO TÀI KHOẢN (PREVIEW & IMPORT)
          ========================================================================= */}
      {showPreviewModal && previewModalData && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title font-weight-bold" style={{ fontSize: "1.1rem" }}>
                    ⚡ Xem Trước & Nhập Giáo Án Theo Mã Code
                  </h5>
                  <div style={{ fontSize: "0.78rem", color: "var(--lp-text-muted)" }}>
                    Mã code: <strong style={{ color: "var(--lp-primary)", letterSpacing: "1px" }}>{previewModalData.plan.share_code}</strong> • Tác giả: <strong>{previewModalData.plan.tac_gia || "Gymer Cộng Đồng"}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPreviewModal(false)}
                />
              </div>

              <div className="modal-body">
                {/* Thông tin giáo án */}
                <div className="workout-main-card mb-3" style={{ padding: "16px" }}>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                    <h4 style={{ fontWeight: 800, fontSize: "1.15rem", margin: 0, color: "var(--lp-text-main)" }}>
                      {previewModalData.plan.ten_ke_hoach}
                    </h4>
                    <span className="badge-metric-tag">
                      {previewModalData.plan.so_buoi_tuan || previewModalData.plan.so_buoi_thuc_te || 4} Buổi / Tuần
                    </span>
                  </div>
                  <p style={{ fontSize: "0.84rem", color: "var(--lp-text-muted)", margin: "0 0 10px 0" }}>
                    {previewModalData.plan.mo_ta || "Không có mô tả chi tiết."}
                  </p>
                  <div className="d-flex align-items-center gap-3" style={{ fontSize: "0.78rem", color: "var(--lp-text-muted)" }}>
                    <span>📥 {previewModalData.plan.luot_tai || 0} Lượt tải về</span>
                    <span>❤️ {previewModalData.plan.so_luot_thich || 0} Lượt thích</span>
                  </div>
                </div>

                {/* Danh sách các buổi tập trong giáo án */}
                <h6 style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "10px" }}>
                  📋 Chi Tiết Các Buổi Tập ({previewModalData.sessions?.length || 0} ngày):
                </h6>
                <div className="preview-sessions-scroll mb-3">
                  {previewModalData.sessions?.map((session, sIdx) => {
                    const dayLabel = DAYS_OF_WEEK.find(d => d.day === session.ngay_trong_tuan)?.fullName || `Thứ ${session.ngay_trong_tuan}`;
                    return (
                      <div key={session._id || sIdx} className="preview-session-item">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge-group-tag" style={{ fontSize: "0.72rem" }}>{dayLabel}</span>
                            <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--lp-text-main)" }}>
                              {session.ten_buoi_tap}
                            </span>
                          </div>
                          {session.is_rest_day ? (
                            <span className="badge bg-secondary" style={{ fontSize: "0.7rem" }}>Nghỉ ngơi</span>
                          ) : (
                            <span className="badge bg-primary" style={{ fontSize: "0.7rem" }}>
                              {session.exercises?.length || 0} bài tập • {session.gio_bat_dau || "17:30"} - {session.gio_ket_thuc || "18:45"}
                            </span>
                          )}
                        </div>

                        {!session.is_rest_day && session.exercises && session.exercises.length > 0 && (
                          <div className="d-flex flex-wrap">
                            {session.exercises.map((ex, exIdx) => (
                              <div key={ex._id || exIdx} className="preview-ex-chip">
                                <span style={{ fontWeight: 700 }}>{ex.ten_bai_tap}</span>
                                <span style={{ color: "var(--lp-text-muted)", fontSize: "0.7rem" }}>
                                  ({ex.so_sets}x{ex.so_reps})
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tùy chỉnh khi nhập */}
                <div className="workout-main-card" style={{ padding: "16px" }}>
                  <h6 style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "12px" }}>
                    ⚙️ Tùy Chỉnh Của Bạn Khi Nhập:
                  </h6>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                      Tên Kế Hoạch Lưu Vào Tài Khoản
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={importForm.custom_name}
                      onChange={(e) => setImportForm({ ...importForm, custom_name: e.target.value })}
                      placeholder="Tên kế hoạch cá nhân..."
                      required
                    />
                  </div>

                  <div className="form-check mb-2">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="importActivateCheck"
                      checked={importForm.activate_now}
                      onChange={(e) => setImportForm({ ...importForm, activate_now: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="importActivateCheck" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      ⚡ Kích hoạt làm lịch tập chính ngay sau khi nhập
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="importSyncCalendarCheck"
                      checked={importForm.dong_bo_lich}
                      onChange={(e) => setImportForm({ ...importForm, dong_bo_lich: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="importSyncCalendarCheck" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      📅 Tự động đồng bộ các buổi tập này lên trang Lịch (SuKien)
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-action-pill btn-pill-primary"
                  onClick={() => setShowPreviewModal(false)}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  className="btn-action-pill btn-pill-primary"
                  style={{ background: "var(--lp-primary)", color: "#fff", padding: "9px 20px" }}
                  disabled={isImportingPlan}
                  onClick={handleExecuteImportPlan}
                >
                  {isImportingPlan ? "⏳ Đang Thiết Lập Lịch..." : "🚀 Áp Dụng Lịch Tập Này"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
