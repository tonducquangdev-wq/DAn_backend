let part4 = "";
part4 += `    {/* M\u00c0N H\u00c0NH CHI TI\u1ebet D\u1ef0 \u00c1N / N\u01a0i l\u00e0m vi\u1ec7c */}
    {selectedProjectId && (
      <>
        {/* Th\u00f4ng tin d\u1ef1 \u00e1n \u0111ang ch\u1ecdn */}
        <div className="glass-card mb-4" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.4rem" }}>
                {selectedProject?.loai_du_an === "part_time" ? "\u269C\uFE0F" : selectedProject?.loai_du_an === "cong_viec_chinh" ? "\u269C\uFE0F" : "\u263C\uFE0F"}
              </span>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>
                  {selectedProject?.ten_du_an || "N\u01a0i l\u00e0m vi\u1ec7c / D\u1ef1 \u00e1n"}
                </h2>
                {selectedProject?.mo_ta && (
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.4" }}>
                    {selectedProject.mo_ta}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {selectedProject?.loai_du_an === "part_time" && (
                <span className="badge" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", fontSize: "0.76rem", padding: "4px 10px", borderRadius: "6px" }}>
                  \u269C\uFE0F Part-time \u00b7 {Number(selectedProject.luong_theo_gio || 0).toLocaleString("vi-VN")} \u0111/gi\u1edd
                </span>
              )}
              {selectedProject?.loai_du_an === "cong_viec_chinh" && (
                <span className="badge" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", fontSize: "0.76rem", padding: "4px 10px", borderRadius: "6px" }}>
                  \u269C\uFE0F Full-time \u00b7 {Number(selectedProject.luong_co_ban || 0).toLocaleString("vi-VN")} \u0111/th\u00e1ng
                </span>
              )}
              {selectedProject?.loai_du_an === "du_an_tu_do" && (
                <span className="badge" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6", fontSize: "0.76rem", padding: "4px 10px", borderRadius: "6px" }}>
                  \u263C\uFE0F D\u1ef1 \u00e1n
                </span>
              )}
              {selectedProject?.dia_chi && (
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>📍 {selectedProject.dia_chi}</span>
              )}
              <button
                className="btn-secondary"
                style={{ fontSize: "0.78rem", padding: "4px 12px", borderRadius: "8px" }}
                onClick={() => handleOpenEditProjectModal(selectedProject)}
              >
                \u270F\uFE0F S\u1eeda
              </button>
            </div>
          </div>
        </div>

`;

module.exports = part4;
