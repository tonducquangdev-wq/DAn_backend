let part = "";
part += `return (
  <div style={{ position: "relative" }}>
    {/* Toast Notification */}
    {toast && (
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 10001,
          padding: "14px 22px",
          borderRadius: "14px",
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "0.9rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}
      >
        <span>{toast.type === "success" ? "\u2713" : "\u26A0"}</span>
        <span>{toast.message}</span>
      </div>
    )}

    {/* Header Top */}
    <div className="header-top mb-3">
      <div>
        <h1 className="page-title mb-0">\u273C\uFE0F Qu\u1ea3n L\u00fd Vi\u1ec7c L\u00e0m, D\u1ef1 \u00c1n & Tasks</h1>
      </div>
      <div className="action-bar">
        {selectedProjectId ? (
          <>
            <button className="btn-secondary" onClick={handleBackToList}>
              \u2190 Danh s\u00e1ch
            </button>
            <button className="btn-secondary" onClick={() => handleOpenTaskModal(selectedProjectId)}>
              \u2795 Th\u00eam Task
            </button>
            {selectedProject?.loai_du_an === "part_time" && (
              <>
                <button className="btn-secondary" onClick={() => handleOpenSingleShiftModal(selectedProjectId)}>
                  \u2795 Th\u00eam 1 Ca L\u00e0m
                </button>
                <button className="btn-primary" onClick={handleOpenBulkShiftModal}>
                  \u26A1 Setup L\u00edch Tu\u1ea7n (H\u00e0ng Lo\u1ea5t)
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <button className="btn-secondary" onClick={() => handleOpenTaskModal()}>
              \u2795 Th\u00eam Task M\u1edbi
            </button>
            <button className="btn-primary" onClick={handleOpenProjectModal}>
              \u2795 T\u1ea1o D\u1ef1 \u00c1n / Vi\u1ec7c L\u00e0m M\u1edbi
            </button>
          </>
        )}
      </div>
    </div>

    {/* M\u00c0N H\u00ceNH DANH S\u00c1CH D\u1ef0 \u00c1N / N\u01a0I L\u00c0M V\u1ecaC */}
    {!selectedProjectId && (
      <>
        {/* Danh s\u00e1ch D\u1ef1 \u00c1n / N\u01a0i l\u00e0m vi\u1ec7c */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              \u269C\uFE0F N\u01a0i L\u00e0m V\u1ecaC & D\u1ef1 \u00c1n ({duAns.length})
            </h3>
          </div>

          {duAns.length === 0 ? (
            <div className="glass-card text-center py-4" style={{ color: "var(--text-muted)" }}>
              <p style={{ margin: "0 0 10px 0" }}>Ch\u01b0a c\u00f3 d\u1ef1 \u00e1n ho\u1eb7c vi\u1ec7c l\u00e0m n\u00e0o. B\u00e1m "T\u1ea1o D\u1ef1 \u00c1n / Vi\u1ec7c L\u00e0m M\u1edbi" \u0111\u1ec3 b\u00e1t \u0111\u1ea7u.</p>
              <button className="btn-primary" style={{ fontSize: "0.85rem", padding: "6px 16px" }} onClick={handleOpenProjectModal}>
                + T\u1ea1o Vi\u1ec7c L\u00e0m / D\u1ef1 \u00c1n \u0110\u1ea7u Ti\u00ean
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {duAns.map((da) => {
                const isPartTime = da.loai_du_an === "part_time";
                const isFullTime = da.loai_du_an === "cong_viec_chinh";
                return (
                  <div
                    key={da._id}
                    className="glass-card"
                    style={{
                      borderLeft: "6px solid " + (da.mau_sac || "var(--primary)"),
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      position: "relative",
                      cursor: "pointer"
                    }}
                    onClick={() => setSelectedProjectId(da._id)}
                  >
`;

module.exports = part;
