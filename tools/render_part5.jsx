let part5 = "";
part5 += `        {/* Tasks thu\u1ed9c d\u1ef1 \u00e1n */}
        <div className="glass-card mb-4">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              \u2705 Tasks thu\u1ed9c d\u1ef1 \u00e1n
              <span className="badge" style={{ background: "var(--primary-light)", color: "var(--primary)", fontSize: "0.72rem", padding: "2px 8px", borderRadius: "6px" }}>
                {tasks.filter((t) => t.du_an_id?._id === selectedProjectId).length}
              </span>
            </h3>
            <button className="btn-primary" style={{ fontSize: "0.78rem", padding: "4px 12px", borderRadius: "8px" }} onClick={() => handleOpenTaskModal(selectedProjectId)}>
              \u2795 Th\u00eam Task
            </button>
          </div>
          {tasks.filter((t) => t.du_an_id?._id === selectedProjectId).length === 0 ? (
            <div style={{ textAlign: "center", padding: "18px 0", color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.86rem" }}>
              Ch\u01b0a c\u00f3 Task n\u00e0o thu\u1ed9c d\u1ef1 \u00e1n n\u00e0y.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {tasks
                .filter((t) => t.du_an_id?._id === selectedProjectId)
                .map((t) => {
                  const isDone = t.trang_thai === "hoan_thanh";
                  return (
                    <div
                      key={t._id}
                      className="today-event-item"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        opacity: isDone ? 0.65 : 1,
                        transition: "all 0.2s ease",
                        borderRadius: "10px",
                        background: "var(--bg-recessed)",
                        borderLeft: "4px solid " + (selectedProject?.mau_sac || "var(--primary)")
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => toggleTaskStatus(t)}
                          style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--primary)" }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.88rem", textDecoration: isDone ? "line-through" : "none", color: isDone ? "var(--text-muted)" : "var(--text-main)" }}>
                            {t.tieu_de}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "2px" }}>
                            {t.han_chot && (
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                \u23F0 {formatDateTimeDisplay(t.han_chot)}
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: "0.7rem",
                                padding: "1px 7px",
                                borderRadius: "4px",
                                background: t.do_uu_tien === "cao" ? "rgba(239,68,68,0.12)" : t.do_uu_tien === "thap" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                                color: t.do_uu_tien === "cao" ? "#ef4444" : t.do_uu_tien === "thap" ? "#10b981" : "#f59e0b",
                                fontWeight: 700
                              }}
                            >
                              {t.do_uu_tien === "cao" ? "\u274C Cao" : t.do_uu_tien === "thap" ? "\u2705 Th\u1ea5p" : "\u2717 TB"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTask(t._id, t.tieu_de)}
                        title="X\u00f3a task"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.9rem", padding: "2px 6px", borderRadius: "6px" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                      >
                        \u2612\uFE0F
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

`;

module.exports = part5;
