import { useState } from "react"

export default function Table({ columns, data, onRowClick }) {

  const [sortColumn,    setSortColumn]    = useState(null)
  const [sortDirection, setSortDirection] = useState("asc")

  function handleSort(index) {
    if (sortColumn === index) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(index)
      setSortDirection("asc")
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (sortColumn === null) return 0
    const valueA = a[sortColumn]
    const valueB = b[sortColumn]
    if (typeof valueA !== "string") return 0
    return sortDirection === "asc"
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA)
  })

  return (
    <div className="ui-table ui-fade">
    <div className="max-h-[600px] overflow-y-auto">

      <table className="w-full text-sm">

        {/* HEADER */}
        <thead className="
          sticky top-0 z-10
          bg-neutral-50 dark:bg-neutral-950
          border-b border-neutral-200 dark:border-neutral-800
        ">
          <tr>
            {columns.map((col, index) => {
              const sortable = index === 0 || index === 1
              return (
                <th
                  key={index}
                  onClick={() => sortable && handleSort(index)}
                  className={`
                    px-4 py-3
                    text-left text-[11px] font-semibold uppercase tracking-widest
                    text-neutral-400 dark:text-neutral-500
                    whitespace-nowrap
                    ${sortable ? "cursor-pointer select-none hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors" : ""}
                  `}
                >
                  <div className="flex items-center gap-1.5">
                    {col}
                    {sortable && sortColumn === index && (
                      <span className="opacity-60 text-[10px]">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {sortedData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(rowIndex)}
              className="
                border-b border-neutral-100 dark:border-neutral-800/80
                cursor-pointer
                transition-colors duration-100
                hover:bg-cyan-50/40 dark:hover:bg-cyan-950/10
              "
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`
                    px-4 py-3
                    ${cellIndex === 0
                      ? "font-medium text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-700 dark:text-neutral-300"
                    }
                  `}
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
  )

}
