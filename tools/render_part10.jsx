let part10 = "";
part10 += `      {/* MODAL 2: TH\u00caM TASK TODO */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "520px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "6px" }}>➕ Th\u00eam C\u00f4ng Vi\u1ec7c M\u1edbi</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "18px" }}>
              T\u1ea1o nhi\u1ec7m v\u1ec7c c\u00f4ng vi\u1ec7c \u2013 h\u1ec7 th\u1ed1ng s\u1ec1 t\u01b0\u01a1ng \u0111\u1ed9ng l\u00ean trang L\u00edch.
            </p>
            <form onSubmit={handleCreateTask}>
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>Ti\u00eau \u0111\u1ec1 c\u00f4ng vi\u1ec7c *</label>
                <input type="text" required value={taskForm.tieu_de} onChange={(e) => setTaskForm({ ...taskForm, tieu_de: e.target.value })} placeholder="V\u1ed9 d\u1eab: Thi\u1ebft k\u1ebfp giao di\u1ec7n b\u1eb1ng Figma..." />
              </div>
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>Thu\u1ecbc D\u1ef1 \u00c1n / N\u01a0i L\u00e0m Vi\u1ec7c</label>
                <select value={taskForm.du_an_id} onChange={(e) => setTaskForm({ ...taskForm, du_an_id: e.target.value })}>
                  <option value="">-- Kh\u00f4ng thu\u1ec3c d\u1ef1 \u00e1n n\u00e0o (Task \u0111\u1ecdc l\u1eadp) --</option>
                  {duAns.map((d) => (
                    <option key={d._id} value={d._id}>{d.ten_du_an}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>\u23F0 H\u1ea1n ch\u1ed3t (Deadline)</label>
                  <input type="datetime-local" value={taskForm.han_chot} onChange={(e) => setTaskForm({ ...taskForm, han_chot: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>\u2728 M\u1ee9c \u0111\u1ed9 \u01b0u ti\u00ean</label>
                  <select value={taskForm.do_uu_tien} onChange={(e) => setTaskForm({ ...taskForm, do_uu_tien: e.target.value })}>
                    <option value="thap">\u2705 Th\u1ea5p</option>
                    <option value="trung_binh">\u2717 Trung b\u00ecnh</option>
                    <option value="cao">\u274C Cao (Khan c\u1ea5p)</option>
                  </select>
                </div>
              </div>
              <div className="form-group mb-3">
                <label style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "block" }}>Ghi ch\u00fa / M\u00f4 t\u1ea3 c\u00f4ng vi\u1ec7c</label>
                <textarea rows="2" value={taskForm.mo_ta} onChange={(e) => setTaskForm({ ...taskForm, mo_ta: e.target.value })} placeholder="Ghi ch\u00fa chi ti\u1ebft c\u00f4ng vi\u1ec7c..." />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>H\u1ef7</button>
                <button type="submit" className="btn-primary">L\u01b0u Task & V\u00e0o L\u00edch</button>
              </div>
            </form>
          </div>
        </div>
      )}

`;

module.exports = part10;
