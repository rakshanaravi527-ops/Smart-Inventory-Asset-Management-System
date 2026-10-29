import React, { useState, useEffect, useCallback } from 'react';
import { get } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';
import { HiDownload, HiDocumentText } from 'react-icons/hi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('utilization');
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/departments').then((r) => setDepartments(r.data?.data || []));
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = `/reports/${reportType}`;
      const res = await get(endpoint, { departmentId: selectedDept || undefined });
      setData(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [reportType, selectedDept]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...data.map((row) => headers.map((h) => `"${row[h] ?? ''}"`).join(','))].join(
        '\n'
      );
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV downloaded');
  };

  const handleExportPDF = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${reportType.toUpperCase()} REPORT`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers.map((h) => String(row[h] ?? '')));

    autoTable(doc, {
      startY: 34,
      head: [headers],
      body: rows,
      styles: { fontSize: 8 },
    });

    doc.save(`${reportType}_report.pdf`);
    toast.success('PDF downloaded');
  };

  const getColumns = () => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).map((key) => ({
      header: key.replace(/([A-Z])/g, ' $1').toUpperCase(),
      accessor: key,
      render: (r) => String(r[key] ?? '—'),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Institutional Audits & Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Export asset utilization metrics, consumable stock levels, service records, and tamper-proof audit trails
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <HiDownload className="mr-1.5" /> Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-600/30 transition"
          >
            <HiDocumentText className="mr-1.5" /> Download PDF
          </button>
        </div>
      </div>

      {/* Report controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3">
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
        >
          <option value="utilization">Asset Utilization & Idle Analysis</option>
          <option value="stock">Consumables & Stock Levels</option>
          <option value="maintenance">Maintenance & Compliance History</option>
          <option value="audit">Tamper-Proof Audit Trail</option>
        </select>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Preview Table */}
      <DataTable columns={getColumns()} data={data} loading={loading} />
    </div>
  );
}

