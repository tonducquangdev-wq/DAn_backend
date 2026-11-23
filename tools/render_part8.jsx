let part8 = "";
part8 += `      {showProjectModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "560px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "6px" }}>
              {editingProject ? "\u270F\uFE0F Ch\u1ec9nh s\u1eeed Vi\u1ec7c L\u00e0m / D\u1ef1 \u00c1n" : "\u2795 T\u1ea1o Vi\u1ec7c L\u00e0m / D\u1ef1 \u00c1n M\u1edbi"}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "18px" }}>
              {editingProject ? "C\u1ea5p nh\u1eadt th\u00f4ng tin d\u1ef1 \u00e1n, m\u1ee9c l\u01b0\u01a1ng ho\u1eb7c \u0111\u1ecba ch\u1ec9 n\u01a1i l\u00e0m vi\u1ec7c." : "Ch\u1ecdn lo\u1ea1i h\u00ecnh c\u00f4ng vi\u1ec7c \u0111\u1ec3 qu\u1ea3n l\u00fd l\u00edch tr\u00ecnh v\u00e0 t\u01b0\u01a1 \u0111\u1ed9ng t\u00edn thu nh\u1eadp."}
            </p>
            <form onSubmit={handleSaveProject}>
              <div className="form-group mb-3">
                <label style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "8px", display: "block" }}>Ph\u00e2n lo\u1ea1i c\u00f4ng vi\u1ec7c *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <button type="button" onClick={() => setProjectForm({ ...projectForm, loai_du_an: "part_time" })} style={{ padding: "10px 8px", borderRadius: "12px", border: projectForm.loai_du_an === "part_time" ? "2px solid #f59e0b" : "1px solid var(--border-color)", background: projectForm.loai_du_an === "part_time" ? "rgba(245, 158, 11, 0.12)" : "var(--bg-surface)", color: projectForm.loai_du_an === "part_time" ? "#f59e0b" : "var(--text-main)", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", textAlign: "center" }}>🏪 Part-time / Ca</button>
                  <button type="button" onClick={() => setProjectForm({ ...projectForm, loai_du_an: "cong_viec_chinh" })} style={{ padding: "10px 8px", borderRadius: "12px", border: projectForm.loai_du_an === "cong_viec_chinh" ? "2px solid #3b82f6" : "1px solid var(--border-color)", background: projectForm.loai_du_an === "cong_viec_chinh" ? "rgba(59, 130, 246, 0.12)" : "var(--bg-surface)", color: projectForm.loai_du_an === "cong_viec_chinh" ? "#3b82f6" : "var(--text-main)", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", textAlign: "center" }}>🏢 C\u00f4ng vi\u1ec7c ch\u00ednh</button>
                  <button type="button" onClick={() => setProjectForm({ ...projectForm, loai_du_an: "du_an_tu_do" })} style={{ padding: "10px 8px", borderRadius: "12px", border: projectForm.loai_du_an === "du_an_tu_do" ? "2px solid #8b5cf6" : "1px solid var(--border-color)", background: projectForm.loai_du_an === "du_an_tu_do" ? "rgba(139, 92, 246, 0.12)" : "var(--bg-surface)", color: projectForm.loai_du_an === "du_an_tu_do" ? "#8b5cf6" : "var(--text-main)", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", textAlign: "center" }}>📁 D\u1ef1 \u00e1n t\u1ef7 do</button>
                </div>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>
                  {projectForm.loai_du_an === "part_time" ? "T\u00ean n\u01a1i l\u00e0m part-time *" : projectForm.loai_du_an === "cong_viec_chinh" ? "T\u00ean c\u00f4ng ty / N\u01a0i l\u00e0m vi\u1ec7c *" : "T\u00ean d\u1ef1 \u00e1n *"}
                </label>
                <input type="text" required value={projectForm.ten_du_an} onChange={(e) => setProjectForm({ ...projectForm, ten_du_an: e.target.value })} placeholder={projectForm.loai_du_an === "part_time" ? "V\u1ed9 d\u1eab: Family Mart Qu\u1eadn 1, Highlands Coffee..." : "V\u1ed9 d\u1eab: L\u00e4p tr\u00ecnh Website, \u0110\u01a1 \u00e1n..."} />
              </div>

`;

module.exports = part8;
