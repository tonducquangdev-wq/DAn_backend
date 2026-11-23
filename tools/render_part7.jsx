let part7 = "";
part7 += `            {/* B\u1ea3ng ca l\u00e0m */}
            <div className="glass-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  \u269C\uFE0F L\u00edch Ca L\u00e0m Vi\u1ec7c ({shifts.length} Ca)
                </h3>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }})\u2191 T\u1ef7 t\u01b0\u01a1ng c\u00f4ng v\u00e0 l\u01b0\u01a1ng khi ca k\u00e9t th\u00fac</span>
              </div>
              {shifts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                  Ch\u01b0a c\u00f3 ca l\u00e0m vi\u1ec7c n\u00e0o. B\u00e1m "\u2795 Th\u00eam 1 Ca L\u00e0m" ho\u1eb7c "\u26A1 Setup L\u00edch Tu\u1ea7n" \u0111\u00e2y.
                </div>
              ) : (
                <div className="neu-table-wrapper table-responsive">
                  <table className="table align-middle mb-0" style={{ background: "transparent", color: "var(--text-main)" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border-color)", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        <th>Ng\u00e0y</th>
                        <th>Khung gi\u1edd</th>
                        <th>Gi\u1edd</th>
                        <th>L\u01b0\u01a1ng ca</th>
                        <th>Tr\u1ea1ng th\u00e1i</th>
                        <th style={{ textAlign: "right" }}>Thao t\u00e1c</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shifts.map((sh) => {
                        const isPast = sh.trang_thai === "da_hoan_thanh";
                        const isAbsent = sh.trang_thai === "nghi_phep";
                        return (
                          <tr key={sh._id} style={{ borderBottom: "1px solid var(--border-color)", opacity: isAbsent ? 0.55 : 1 }}>
                            <td style={{ fontWeight: 700, fontSize: "0.84rem" }}>{formatDateDisplay(sh.ngay_lam)}</td>
                            <td style={{ fontSize: "0.82rem" }} className="font-numeric">{sh.gio_bat_dau} - {sh.gio_ket_thuc}</td>
                            <td style={{ fontSize: "0.82rem" }} className="font-numeric">{sh.so_gio_lam}h</td>
                            <td style={{ fontWeight: 700, fontSize: "0.82rem", color: isPast ? "#10b981" : "var(--text-main)" }} className="font-numeric">
                              {Number(sh.tien_luong_ca || 0).toLocaleString("vi-VN")} \u0111
                            </td>
                            <td>
                              {isPast ? (
                                <span className="badge badge-success" style={{ fontSize: "0.7rem" }}>✓ \u0110\u00e3 l\u00e0m</span>
                              ) : isAbsent ? (
                                <span className="badge badge-warning" style={{ fontSize: "0.7rem" }}>🛌 Ngh\u1ec9</span>
                              ) : (
                                <span className="badge badge-primary" style={{ fontSize: "0.7rem" }}>⏳ S\u00e1p t\u1ed1i</span>
                              )}
                            </td>
                            <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                              {sh.trang_thai === "chua_den" && (
                                <>
                                  <button className="shift-action-btn btn-done" title="\u0110\u00e3 l\u00e0m" onClick={() => handleChangeShiftStatus(sh, "da_hoan_thanh")}>✓</button>
                                  <button className="shift-action-btn btn-leave" title="Ngh\u1ec9 ph\u00e9p" onClick={() => handleChangeShiftStatus(sh, "nghi_phep")}>🛌</button>
                                </>
                              )}
                              {sh.trang_thai === "da_hoan_thanh" && (
                                <button className="shift-action-btn btn-leave" title="Ngh\u1ec9 ph\u00e9p" onClick={() => handleChangeShiftStatus(sh, "nghi_phep")}>🛌</button>
                              )}
                              {sh.trang_thai === "nghi_phep" && (
                                <button className="shift-action-btn btn-rework" title="\u0110i l\u00e0m l\u1ea1i" onClick={() => handleChangeShiftStatus(sh, "chua_den")}>↩️</button>
                              )}
                              <button className="shift-action-btn btn-delete" title="X\u00f3a" onClick={() => handleDeleteShift(sh._id)}>🗑️</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </>
    )}

    {/* MODAL 1: T\u1ea0O D\u1ef0 \u00c1N / N\u01a0i L\u00c0M VI\u1ecaC M\u1edbi */}
`;

module.exports = part7;
