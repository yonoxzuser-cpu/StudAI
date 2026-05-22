import React, { useState, useEffect } from "react";
import { ExcelPayload } from "../types";
import { Download, Plus, Trash2, RotateCcw, FileSpreadsheet, Sparkles, Check, Edit2 } from "lucide-react";

interface ExcelViewerProps {
  payload: ExcelPayload;
}

export default function ExcelViewer({ payload }: ExcelViewerProps) {
  const [tableName, setTableName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [editingCell, setEditingCell] = useState<{ rIdx: number; cIdx: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [exporting, setExporting] = useState(false);

  // Initialize spreadsheet from payload
  useEffect(() => {
    if (payload) {
      setTableName(payload.tableName || "Tabel Data StudAI");
      setHeaders(payload.headers || []);
      setRows(payload.rows ? payload.rows.map((row) => [...row]) : []);
    }
  }, [payload]);

  const handleCellEditStart = (rIdx: number, cIdx: number, val: string) => {
    setEditingCell({ rIdx, cIdx });
    setEditValue(val);
  };

  const handleCellSave = () => {
    if (editingCell) {
      const updatedRows = [...rows];
      updatedRows[editingCell.rIdx][editingCell.cIdx] = editValue;
      setRows(updatedRows);
      setEditingCell(null);
    }
  };

  const handleAddRow = () => {
    const emptyRow = Array(headers.length).fill("");
    setRows([...rows, emptyRow]);
  };

  const handleDeleteRow = (idx: number) => {
    setRows(rows.filter((_, rIdx) => rIdx !== idx));
  };

  const handleReset = () => {
    setTableName(payload.tableName || "Tabel Data StudAI");
    setHeaders(payload.headers || []);
    setRows(payload.rows ? payload.rows.map((row) => [...row]) : []);
    setEditingCell(null);
  };

  // Auto Calculations logic (detect columns with numbers or currency values)
  const getColumnNumericStatus = (cIdx: number) => {
    let isNumeric = true;
    let sum = 0;
    let count = 0;

    if (rows.length === 0) return { isNumeric: false, sum: 0, avg: 0 };

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const val = rows[rIdx][cIdx];
      if (val === undefined || val === null || val === "") continue;

      // Clean string from Indonesian currencies (Rp), dots/commas or percent symbols
      const cleanVal = val.replace(/[^0-9.-]/g, "");
      const num = parseFloat(cleanVal);

      if (isNaN(num)) {
        isNumeric = false;
        break;
      } else {
        sum += num;
        count++;
      }
    }

    return {
      isNumeric: isNumeric && count > 0,
      sum: Math.round(sum * 100) / 100,
      avg: count > 0 ? Math.round((sum / count) * 100) / 100 : 0,
    };
  };

  // Convert table to CSV URL link for immediate download
  const handleCSVExport = () => {
    setExporting(true);
    const csvContent = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${tableName.toLowerCase().replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      setExporting(false);
    }, 1500);
  };

  if (headers.length === 0) {
    return (
      <div className="p-6 bg-white border-2 border-slate-200 rounded-2xl text-center text-slate-500 font-bold shadow-sm">
        Tabel data kosong / tidak dapat dimuat.
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-slate-200 shadow-md rounded-3xl overflow-hidden max-w-full my-4">
      {/* Table operations controls bar */}
      <div className="bg-slate-50 p-4 border-b-2 border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            className="text-xs font-black-display tracking-tight text-slate-850 uppercase bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-indigo-650 focus:outline-none transition-colors px-1"
            title="Ubah judul tabel"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-2 bg-white hover:bg-slate-100 border-2 border-slate-200 rounded-xl text-slate-600 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Kembalikan tabel orisinal"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-550" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={handleAddRow}
            className="px-3 py-2 bg-white hover:bg-slate-100 border-2 border-slate-200 rounded-xl text-indigo-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Baris</span>
          </button>

          <button
            id="csv-export-button"
            onClick={handleCSVExport}
            disabled={exporting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-slate-900 shadow-[2px_2px_0px_#000000] rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all hover:translate-y-0.5"
          >
            {exporting ? <Check className="w-4 h-4" /> : <Download className="w-3.5 h-3.5" />}
            <span>{exporting ? "Selesai" : "Unduh CSV"}</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Responsive Grid */}
      <div className="max-w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-100 border-b-2 border-slate-250 select-none">
              <th className="px-3 py-3 w-10 text-center text-xs font-mono font-bold text-slate-500">
                #
              </th>
              {headers.map((h, hIdx) => (
                <th key={hIdx} className="px-4 py-3 font-mono font-bold text-xs uppercase tracking-wider text-slate-700 border-r border-slate-200">
                  {h}
                </th>
              ))}
              <th className="px-3 py-3 w-12 text-center text-xs font-bold text-slate-500">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-100 bg-white">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50/70 group transition-colors">
                <td className="px-2 py-3 w-10 text-center font-mono text-xs text-slate-400 bg-slate-50 font-bold">
                  {rIdx + 1}
                </td>
                {headers.map((_, cIdx) => {
                  const cellValue = row[cIdx] || "";
                  const isEditing = editingCell?.rIdx === rIdx && editingCell?.cIdx === cIdx;

                  return (
                    <td
                      key={cIdx}
                      className="px-4 py-2 border-r border-slate-200 min-w-[120px] max-w-[280px] truncate relative cursor-text group-hover:bg-slate-100/10"
                      onClick={() => !isEditing && handleCellEditStart(rIdx, cIdx, cellValue)}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={(e) => e.key === "Enter" && handleCellSave()}
                          autoFocus
                          className="w-full h-full bg-white text-slate-900 px-2 py-1 rounded border-2 border-indigo-600 focus:outline-none text-sm font-mono"
                        />
                      ) : (
                        <div className="flex items-center justify-between gap-1">
                          <span className={`${cellValue ? "text-slate-800" : "text-slate-400 italic"} font-mono text-xs md:text-sm font-bold`}>
                            {cellValue || "[kosong]"}
                          </span>
                          <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 pointer-events-none" />
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center w-12">
                  <button
                    onClick={() => handleDeleteRow(rIdx)}
                    title="Hapus baris ini"
                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}

            {/* Calculations Footer panel (if numeric columns are present) */}
            {rows.length > 0 && (
              <tr className="bg-indigo-50/40 border-t-2 border-slate-250 text-xs font-mono">
                <td className="px-2 py-3 text-center text-indigo-700 bg-slate-50 font-bold">
                  Σ
                </td>
                {headers.map((_, cIdx) => {
                  const stats = getColumnNumericStatus(cIdx);
                  return (
                    <td key={cIdx} className="px-4 py-2.5 border-r border-slate-200">
                      {stats.isNumeric ? (
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500 font-bold">Jumlah:</span>
                            <span className="text-emerald-700 font-extrabold">{stats.sum}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500 font-bold">Rata2:</span>
                            <span className="text-indigo-700 font-extrabold">{stats.avg}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-2 py-2 w-12 bg-slate-50"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet stats footnotes */}
      <div className="bg-slate-50 p-3 px-4 flex justify-between items-center text-[10px] text-slate-500 border-t-2 border-slate-200 font-mono font-bold">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="uppercase">Klik sel manapun untuk menyunting langsung</span>
        </div>
        <span>TOTAL: {rows.length} BARIS • {headers.length} KOLOM</span>
      </div>
    </div>
  );
}
