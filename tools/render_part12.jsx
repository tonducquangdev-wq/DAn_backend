let part12 = "";
part12 += `      {/* MODAL 4: SETUP L\u00cdCH TU\u1ea6N H\u00c0NG LO\u1ea0T */}
      {showBulkShiftModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "560px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "6px" }}>\u26A1 Setup L\u00edch Tu\u1ea7n H\u00e0ng Lo\u1ea5t</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "18px" }}>
              Th\u00ecnh l\u1eadp c\u00e1c ca l\u00e0m vi\u1ec7c c\u1ed1 \u0111\u1ecbnh theo c\u00e1c th\u1ee9 trong tu\u1ea7n cho c\u00e0 th\u00e1ng ch\u1ec9 v\u1edvi 1 c\u00fa click!
            </p>
            <form onSubmit={handleCreateBulkShift}>
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>N\u01a0i l\u00e0m vi\u1ec7c *</label>
                <select required value={bulkShiftForm.du_an_id} onChange={(e) => {
                  const pId = e.target.value;
                  const proj = duAns.find((d) => d._id === pId);
                  setBulkShiftForm({ ...bulkShiftForm, du_an_id: pId, dia_diem: proj?.dia_chi || "", luong_theo_gio: proj?.luong_theo_gio !== undefined ? proj.luong_theo_gio : "" });
                }}>
                  <option value="">-- Ch\u1ecdn n\u01a1i l\u00e0m vi\u1ec7c --</option>
                  {partTimeProjects.map((p) => (
                    <option key={p._id} value={p._id}>{p.ten_du_an} (L\u01b0\u01a1ng: {Number(p.luong_theo_gio || 0).toLocaleString("vi-VN")} \u0111/h)</option>
                  ))}
                </select>
              </div>
              <div className="form-group mb-3">
                <label style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "8px", display: "block" }}>\u271D\uFE0F Ch\u1ecdn c\u00e1c th\u1ee9 trong tu\u1ea7n \u0111i l\u00e0m *</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {DAYS_OF_WEEK.map((item) => {
                    const isSelected = bulkShiftForm.days_of_week.includes(item.day);
                    return (
                      <button key={item.day} type="button" className={`day-pill-btn ${isSelected ? "active" : ""}`} onClick={() => {
                        const exists = bulkShiftForm.days_of_week.includes(item.day);
                        const nextDays = exists ? bulkShiftForm.days_of_week.filter((d) => d !== item.day) : [...bulkShiftForm.days_of_week, item.day];
                        setBulkShiftForm({ ...bulkShiftForm, days_of_week: nextDays });
                      }} title={item.fullName}>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
                  \u0110ang ch\u1ecdn:{bulkShiftForm.days_of_week.map((d) => DAYS_OF_WEEK.find((item) => item.day === d)?.fullName).join(", ") || "Ch\u01b0a ch\u1ecdn th\u1ee9 n\u00e0o"}
                </div>
              </div>

`;

module.exports = part12;
