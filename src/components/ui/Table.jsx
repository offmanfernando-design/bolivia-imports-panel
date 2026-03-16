import { useState } from "react"

export default function Table({ columns, data, onRowClick }) {

  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState("asc")

  const handleSort = (index) => {

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

    <div className="ui-table max-h-[520px] overflow-y-auto ui-fade">

      <table className="w-full text-sm">

        {/* HEADER */}

        <thead
          className="
          sticky top-0 z-10
          bg-neutral-50 dark:bg-neutral-900
          border-b border-neutral-200 dark:border-neutral-800
          "
        >

          <tr>

            {columns.map((col, index) => {

              const sortable = index === 0 || index === 1

              return (

                <th
                  key={index}
                  onClick={() => sortable && handleSort(index)}
                  className={`
                  px-4 py-3.5
                  text-left
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  text-neutral-500 dark:text-neutral-400
                  ${sortable ? "cursor-pointer select-none" : ""}
                  `}
                >

                  <div className="flex items-center gap-2">

                    {col}

                    {sortable && sortColumn === index && (
                      <span className="text-xs opacity-60">
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
              onClick={() => onRowClick(rowIndex)}
              className="
              ui-row
              border-b border-neutral-200 dark:border-neutral-800
              cursor-pointer
              "
            >

              {row.map((cell, cellIndex) => (

                <td
                  key={cellIndex}
                  className="
                  px-4 py-3.5
                  text-neutral-800 dark:text-neutral-200
                  "
                >
                  {cell}
                </td>

              ))}

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )

}