import type { ReactNode } from "react";

export type TableColumn = {
  label: string;
  className?: string;
};

export default function Table({
  caption,
  columns,
  children,
  footer,
  ariaBusy,
  tableClassName = "min-w-212.5",
}: {
  caption: string;
  columns: readonly TableColumn[];
  children: ReactNode;
  footer?: ReactNode;
  ariaBusy?: boolean;
  tableClassName?: string;
}) {
  return (
    <div
      className="overflow-x-auto border border-clay-200 rounded-md"
      aria-busy={ariaBusy}
    >
      <table className={`w-full ${tableClassName} border-collapse text-left`}>
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-clay-150 text-sm">
          <tr>
            {columns.map((column) => (
              <th
                key={column.label}
                scope="col"
                className={`px-4 py-4 font-semibold ${column.className ?? ""}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        {children}
      </table>
      {footer}
    </div>
  );
}
