let part13 = "";
part13 += `              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>\u23F1 Gi\u1edd v\u00e0o ca</label>
                  <input type="time" required value={bulkShiftForm.gio_bat_dau} onChange={(e) => setBulkShiftForm({ ...bulkShiftForm, gio_bat_dau: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>\u231B Gi\u1edd tan ca</label>
                  <input type="time" required value={bulkShiftForm.gio_ket_thuc} onChange={(e) => setBulkShiftForm({ ...bulkShiftForm, gio_ket_thuc: e.target.value })} />
                </div>
              </div>
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                  <span>\u270F\uFE0F L\u01b0\u01a1ng theo gi\u1edd (VN\u0110/h)</span>
                  <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 400 }}>M\u1ef9 \u0111\u1ecbnh theo n\u01a1i l\u00e0m vi\u1ec7c</span>
                </label>
                <input type="number" min="0" step="1000" value={bulkShiftForm.luong_theo_gio} onChange={(e) => setBulkShiftForm({ ...bulkShiftForm, luong_theo_gio: e.target.value })} placeholder="V\u1ed9: 25000" />
                {bulkShiftPreview && (
                  <div style={{ marginTop: "8px", padding: "8px 12px", background: "rgba(16, 185, 129, 0.08)", border: "1px dashed rgba(16, 185, 129, 0.3)", borderRadius: "8px", fontSize: "0.82rem", color: "#10b981", fontWeight: 600, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>⏱️ M\u1ed9i ca: {bulkShiftPreview.hoursPerShift} gi\u1edd</span>
                      <span>💰 M\u1ed9i ca: {bulkShiftPreview.salaryPerShift.toLocaleString("vi-VN")} \u0111</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed rgba(16, 185, 129, 0.2)", paddingTop: "4px" }}>
                      <span>📅 {bulkShiftForm.days_of_week.length} ca / tu\u1ea7n</span>
                      <span>💵 Thu nh\u1eadp tu\u1ea7n: {bulkShiftPreview.weeklySalary.toLocaleString("vi-VN")} \u0111</span>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>\u271D\uFE0F \u00c1p d\u1ee5ng t\u1eeb ng\u00e0y *</label>
                  <input type="date" required value={bulkShiftForm.tu_ngay} onChange={(e) => setBulkShiftForm({ ...bulkShiftForm, tu_ngay: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>\u271D\uFE0F \u0110\u1ebfn ng\u00e0y *</label>
                  <input type="date" required value={bulkShiftForm.den_ngay} onChange={(e) => setBulkShiftForm({ ...bulkShiftForm, den_ngay: e.target.value })} />
                </div>
              </div>
              <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.08)", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "18px" }}>
                🚀 H\u1ec7 th\u1ed1ng s\u1ec1 t\u1ef7 t\u1ea1o t\u00e1t c\u1ea3 c\u00e1c ca l\u00e0m vi\u1ec7c kh\u00f3p v\u1edbi c\u00e1c th\u1ee9 \u0111\u00e3 ch\u1ecdn trong kho\u1ea3ng th\u1eddi gian tr\u00ean v\u00e0 \u0111\u01a1ng b\u1ed3 to\u00e0n b\u1ed9 l\u00ean trang L\u00edch.
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowBulkShiftModal(false)}>H\u1ef7</button>
                <button type="submit" className="btn-primary">T\u1ea1o H\u00e0ng Lo\u1ea5t & \u0110\u01a1ng B\u1ed3 L\u00edch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

module.exports = part13;
