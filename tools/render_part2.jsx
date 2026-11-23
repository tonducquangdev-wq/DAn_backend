let part2 = "";
part2 += `                      <div>
                        {/* Header card */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                          <div>
                            <span
                              className="badge"
                              style={{
                                fontSize: "0.72rem",
                                marginBottom: "6px",
                                display: "inline-block",
                                background: isPartTime ? "rgba(245, 158, 11, 0.15)" : isFullTime ? "rgba(59, 130, 246, 0.15)" : "rgba(139, 92, 246, 0.15)",
                                color: isPartTime ? "#f59e0b" : isFullTime ? "#3b82f6" : "#8b5cf6"
                              }}
                            >
                              {isPartTime ? "\u269C\uFE0F Vi\u1ec7c Part-time" : isFullTime ? "\u269C\uFE0F C\u00f4ng vi\u1ec7c ch\u00ednh" : "\u263C\uFE0F D\u1ef1 \u00e1n t\u1ef7 do"}
                            </span>
                            <h4 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
                              {da.ten_du_an}
                            </h4>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                            <button
                              type="button"
                              title="Ch\u1ec9nh s\u1eeed d\u1ef1 \u00e1n"
                              onClick={(e) => { e.stopPropagation(); handleOpenEditProjectModal(da); }}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--text-muted)",
                                fontSize: "0.95rem",
                                padding: "2px 6px",
                                borderRadius: "6px"
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                            >
                              \u270F\uFE0F
                            </button>
                            <button
                              type="button"
                              title="X\u00f3a d\u1ef1 \u00e1n"
                              onClick={(e) => { e.stopPropagation(); handleDeleteProject(da._id, da.ten_du_an); }}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--text-muted)",
                                fontSize: "0.95rem",
                                padding: "2px 6px",
                                borderRadius: "6px"
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                            >
                              \u2612\uFE0F
                            </button>
                          </div>
                        </div>
                        {/* Th\u00f4ng tin L\u01b0\u01a1ng & \u0110\u1ecba ch\u1ec9 */}
                        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                          {isPartTime && (
                            <div style={{ fontSize: "0.85rem", color: "#10b981", fontWeight: 700 }}>
                              \u270F\uFE0F L\u01b0\u01a1ng: {Number(da.luong_theo_gio || 0).toLocaleString("vi-VN")} \u0111 / gi\u1edd
                            </div>
                          )}
                          {isFullTime && (
                            <div style={{ fontSize: "0.85rem", color: "#3b82f6", fontWeight: 700 }}>
                              \u269C\uFE0F L\u01b0\u01a1ng c\u01a1 b\u1ea3n: {Number(da.luong_co_ban || 0).toLocaleString("vi-VN")} \u0111 / th\u00e1ng
                            </div>
                          )}
                          {da.dia_chi && (
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                              <span>\u2709\uFE0F</span>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{da.dia_chi}</span>
                            </div>
                          )}
                          {da.ngay_bat_dau && (
                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                              <span>\u271D\uFE0F</span>
                              <span>B\u1eaft \u0111\u1ea7u t\u1eeb: {formatDateDisplay(da.ngay_bat_dau)}</span>
                            </div>
                          )}
                        </div>
                        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "8px", lineHeight: "1.4" }}>{da.mo_ta || "Ch\u01b0a c\u00f3 m\u00f4 t\u1ea3 chi ti\u1ebft."}</p>
                      </div>
`;

module.exports = part2;
