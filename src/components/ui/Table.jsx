import { useState } from "react";

export default function Table({ columns, data, onRowClick }) {

  const [sortColumn,    setSortColumn]    = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  function handleSort(index) {
    if (sortColumn === index) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(index);
      setSortDirection("asc");
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (sortColumn === null) return 0;
    const valueA = a[sortColumn];
    const valueB = b[sortColumn];
    if (typeof valueA !== "string") return 0;
    return sortDirection === "asc"
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });

  return (
    <div className="ui-table ui-fade">
      <div className="max-h-[600px] overflow-y-auto">

        <table className="w-full">

          {/* HEADER */}
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              {columns.map((col, index) => {
                const sortable = index === 0 || index === 1;
                return (
                  <th
                    key={index}
                    onClick={() => sortable && handleSort(index)}
                    style={{
                      padding:       "10px 16px",
                      textAlign:     "left",
                      fontFamily:    "'Geist Mono', ui-monospace, monospace",
                      fontSize:      "10.5px",
                      fontWeight:    600,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color:         "var(--text-3)",
                      whiteSpace:    "nowrap",
                      cursor:        sortable ? "pointer" : "default",
                      userSelect:    "none",
                      position:      "sticky",
                      top:           0,
                      background:    "var(--surface-2)",
                      zIndex:        1,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      {col}
                      {sortable && sortColumn === index && (
                        <span style={{ opacity: 0.5, fontSize: "9px" }}>
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick && onRowClick(rowIndex)}
                className="ui-row"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    style={{
                      padding:    "12px 16px",
                      fontSize:   "12.5px",
                      color:      cellIndex === 0 ? "var(--text)" : "var(--text-2)",
                      fontWeight: cellIndex === 0 ? 500 : 400,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

        </table>

      </div>
    </div>
  );

}
