let part6 = "";
part6 += `        {/* Setup L\u00edch L\u00e0m & L\u01b0\u01a1ng Part-time (ch\u1ec9 hi\u1ec7n khi l\u00e0 part_time) */}
        {selectedProject?.loai_du_an === "part_time" && (
          <>
            <div className="glass-card mb-4" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-main)" }}>
                \u269C\uFE0F Setup L\u00edch L\u00e0m & L\u01b0\u01a1ng Part-time
              </span>
              <button
                className="btn-secondary"
                style={{ fontSize: "0.78rem", padding: "4px 12px", borderRadius: "8px" }}
                onClick={() => {
                  loadShifts();
                  showToast("\u0110\u00e3 \u0111\u00f4ng b\u1ed3 v\u00e0 t\u00ednh l\u1ea1i l\u01b0\u01a1ng th\u00e0nh c\u00f4ng! \u270F\uFE0F", "success");
                }}
              >
                \u27F3 \u0110\u00f4ng b\u1ed3 & T\u00ednh l\u1ea1i l\u01b0\u01a1ng
              </button>
            </div>

            {/* 4 KPI */}
            <div className="shift-kpi-strip mb-4">
              <div className="shift-kpi-card">
                <div className="shift-kpi-icon" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>⏱️</div>
                <div>
                  <div className="shift-kpi-label">T\u1ed5ng G\u1edd \u0110\u00e3 L\u00e0m</div>
                  <div className="shift-kpi-val font-numeric">{shiftStats.tong_gio_da_lam || 0} G\u1edd</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }})\u0110\u00e3 ho\u00e0n th\u00e0nh {shiftStats.so_ca_da_lam || 0} ca</div>
                </div>
              </div>
              <div className="shift-kpi-card">
                <div className="shift-kpi-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>💰</div>
                <div>
                  <div className="shift-kpi-label">L\u01b0\u01a1ng \u0110\u00e3 Ki\u1ec3m</div>
                  <div className="shift-kpi-val font-numeric" style={{ color: "#10b981" }}>{(shiftStats.luong_tich_luy || 0).toLocaleString("vi-VN")} \u0111</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }})\u0110\u1ecbch l\u01b0u theo ng\u00e0y tr\u1ed3i qua</div>
                </div>
              </div>
              <div className="shift-kpi-card">
                <div className="shift-kpi-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>🔮</div>
                <div>
                  <div className="shift-kpi-label">L\u01b0\u01a1ng D\u1ef1 Ki\u1ec7n</div>
                  <div className="shift-kpi-val font-numeric">{ (shiftStats.luong_du_kien_toan_bo || 0).toLocaleString("vi-VN") } \u0111</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }})\u2191 {shiftStats.tong_gio_toan_bo || 0} gi\u1edd</div>
                </div>
              </div>
              <div className="shift-kpi-card">
                <div className="shift-kpi-icon" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}>📅</div>
                <div>
                  <div className="shift-kpi-label">Ca Ti\u1ebfp Theo</div>
                  {shiftStats.ca_tiep_theo ? (
                    <>
                      <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text-main)" }}>
                        {formatDateDisplay(shiftStats.ca_tiep_theo.thoi_gian_bat_dau)}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: 700 }}>⏰ {shiftStats.ca_tiep_theo.gio_bat_dau} - {shiftStats.ca_tiep_theo.gio_ket_thuc}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Kh\u00f4ng c\u00f3 ca s\u00e1p t\u1ed1i</div>
                  )}
                </div>
              </div>
            </div>

`;

module.exports = part6;
