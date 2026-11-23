let part9 = "";
part9 += `              {projectForm.loai_du_an === "part_time" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>\u270F\uFE0F L\u01b0\u01a1ng theo gi\u1edd (VN\u0110/h) *</label>
                    <input type="number" required min="0" step="1000" value={projectForm.luong_theo_gio} onChange={(e) => setProjectForm({ ...projectForm, luong_theo_gio: e.target.value })} placeholder="V\u1ed9: 25000 ho\u1eb7c 30000" />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>\u271D\uFE0F Ng\u00e0y b\u1eaft \u0111\u1ea7u \u0111\u1ec3 l\u00e0m</label>
                    <input type="date" value={projectForm.ngay_bat_dau} onChange={(e) => setProjectForm({ ...projectForm, ngay_bat_dau: e.target.value })} />
                  </div>
                </div>
              )}
              {projectForm.loai_du_an === "cong_viec_chinh" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>\u269C\uFE0F L\u01b0\u01a1ng c\u01a1 b\u1ea3n h\u00e0ng th\u00e1ng (VN\u0110)</label>
                    <input type="number" min="0" step="100000" value={projectForm.luong_co_ban} onChange={(e) => setProjectForm({ ...projectForm, luong_co_ban: e.target.value })} placeholder="V\u1ed9: 10000000" />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>\u271D\uFE0F Ng\u00e0y b\u1eaft \u0111\u1ea7u l\u00e0m vi\u1ec7c</label>
                    <input type="date" value={projectForm.ngay_bat_dau} onChange={(e) => setProjectForm({ ...projectForm, ngay_bat_dau: e.target.value })} />
                  </div>
                </div>
              )}

              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>\u2709\uFE0F \u0110\u1ecba ch\u1ec9 n\u01a1i l\u00e0m vi\u1ec7c</label>
                <input type="text" value={projectForm.dia_chi} onChange={(e) => setProjectForm({ ...projectForm, dia_chi: e.target.value })} placeholder="V\u1ed9: 12 Nguy\u1ec5n Th\u1ecb Minh Khai, Ph\u01b0\u1eddng \u0110a Kao, Q1..." />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px", display: "block" }}>\u2728 M\u00e0u s\u1ea1c nh\u00e2n di\u1ec7n</label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {PRESET_COLORS.map((c) => (
                    <button key={c.hex} type="button" onClick={() => setProjectForm({ ...projectForm, mau_sac: c.hex })} style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: c.hex, border: projectForm.mau_sac === c.hex ? "3px solid #ffffff" : "2px solid transparent", boxShadow: projectForm.mau_sac === c.hex ? "0 0 0 2px " + c.hex : "none", cursor: "pointer" }} title={c.name} />
                  ))}
                  <input type="color" value={projectForm.mau_sac} onChange={(e) => setProjectForm({ ...projectForm, mau_sac: e.target.value })} style={{ width: "34px", height: "30px", padding: 0, border: "none", cursor: "pointer", background: "none" }} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowProjectModal(false); setEditingProject(null); }}>H\u1ef7</button>
                <button type="submit" className="btn-primary">{editingProject ? "L\u01b0u Thay \u0110\u1ed5i & \u0110\u1ed3ng B\u1ed3 L\u00edch" : "L\u01b0u & Th\u00eam V\u00e0o L\u00edch"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

`;

module.exports = part9;
