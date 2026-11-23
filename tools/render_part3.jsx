let part3 = "";
part3 += `                      {/* Footer card */}
                      <div
                        style={{
                          marginTop: "16px",
                          paddingTop: "12px",
                          borderTop: "1px solid var(--border-color)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: "0.76rem",
                          color: "var(--text-muted)"
                        }}
                      >
                        <span>\u270E\uFE0F Click v\u00e0o th\u1ebf \u0111\u1ec3 xem chi ti\u1ebft & l\u00edch l\u00e0m</span>
                        {isPartTime && (
                          <span style={{ color: "#f59e0b", fontWeight: 700 }}>\u269C\uFE0F C\u00f3 setup l\u00edch</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

`;

module.exports = part3;
