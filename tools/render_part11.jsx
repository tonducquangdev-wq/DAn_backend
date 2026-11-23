let part11 = "";
part11 += `      {/* MODAL 3: TH\u00caM 1 CA L\u00c0M NHANH */}
      {showSingleShiftModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "520px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "6px" }}>\u269C\uFE0F Th\u00eam Ca L\u00e0m Vi\u1ec7c</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "18px" }}>
              \u0110\u0103ng k\u00fd ca l\u00e0m c\u00f9 th\u1ec3c theo ng\u00e0y \u2013 t\u01b0\u01a1ng \u0111\u1ed9ng t\u00edn l\u01b0\u01a1ng v\u00e0 \u0111\u01a1ng b\u1ed3 l\u00ean L\u00edch.
            </p>
            <form onSubmit={handleCreateSingleShift}>
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>N\u01a0i l\u00e0m vi\u1ec7c *</label>
                <select required value={singleShiftForm.du_an_id} onChange={(e) => {
                  const pId = e.target.value;
                  const proj = duAns.find((d) => d._id === pId);
                  setSingleShiftForm({ ...singleShiftForm, du_an_id: pId, dia_diem: proj?.dia_chi || "", luong_theo_gio: proj?.luong_theo_gio !== undefined ? proj.luong_theo_gio : "" });
                }}>
                  <option value="">-- Ch\u1ecdn n\u01a1i l\u00e0m vi\u1ec7c --</option>
                  {partTimeProjects.map((p) => (
                    <option key={p._id} value={p._id}>{p.ten_du_an} (L\u01b0\u01a1ng: {Number(p.luong_theo_gio || 0).toLocaleString("vi-VN")} \u0111/h)</option>
                  ))}
                </select>
              </div>
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>\u271D\uFE0F Ng\u00e0y \u0111i l\u00e0m *</label>
                <input type="date" required value={singleShiftForm.ngay_lam} onChange={(e) => setSingleShiftForm({ ...singleShiftForm, ngay_lam: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>\u23F1 Gi\u1edd v\u00e0o ca</label>
                  <input type="time" required value={singleShiftForm.gio_bat_dau} onChange={(e) => setSingleShiftForm({ ...singleShiftForm, gio_bat_dau: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>\u231B Gi\u1edd tan ca</label>
                  <input type="time" required value={singleShiftForm.gio_ket_thuc} onChange={(e) => setSingleShiftForm({ ...singleShiftForm, gio_ket_thuc: e.target.value })} />
                </div>
              </div>
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                  <span>\u270F\uFE0F L\u01b0\u01a1ng theo gi\u1edd (VN\u0110/h)</span>
                  <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 400 }}>M\u1ef9 \u0111\u1ecbnh theo n\u01a1i l\u00e0m vi\u1ec7c</span>
                </label>
                <input type="number" min="0" step="1000" value={singleShiftForm.luong_theo_gio} onChange={(e) => setSingleShiftForm({ ...singleShiftForm, luong_theo_gio: e.target.value })} placeholder="V\u1ed9: 25000" />
                {singleShiftPreview && (
                  <div style={{ marginTop: "8px", padding: "8px 12px", background: "rgba(16, 185, 129, 0.08)", border: "1px dashed rgba(16, 185, 129, 0.3)", borderRadius: "8px", fontSize: "0.82rem", color: "#10b981", fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
                    <span>⏱️ T\u1ed5ng: {singleShiftPreview.hours} gi\u1edd</span>
                    <span>💰 D\u1ef1 \u0111\u1ecbnh: {singleShiftPreview.totalSalary.toLocaleString("vi-VN")} \u0111</span>
                  </div>
                )}
              </div>
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>Ti\u00eau \u0111\u1ec1 ca l\u00e0m (T\u00f9y ch\u1ecdn)</label>
                <input type="text" value={singleShiftForm.tieu_de} onChange={(e) => setSingleShiftForm({ ...singleShiftForm, tieu_de: e.target.value })} placeholder="V\u1ed9 d\u1eab: Ca thu ng\u00e2n, Ca ph\u00f9 b\u00e9p, Ca ki\u1ec3m h\u00e0ng..." />
              </div>
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>Ghi ch\u00fa</label>
                <input type="text" value={singleShiftForm.ghi_chu} onChange={(e) => setSingleShiftForm({ ...singleShiftForm, ghi_chu: e.target.value })} placeholder="Ghi ch\u00fa th\u00eam n\u1eu c\u00f3..." />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowSingleShiftModal(false)}>H\u1ef7</button>
                <button type="submit" className="btn-primary">L\u01b0u Ca & \u0110\u01a1ng B\u1ed3 L\u00edch</button>
              </div>
            </form>
          </div>
        </div>
      )}

`;

module.exports = part11;
