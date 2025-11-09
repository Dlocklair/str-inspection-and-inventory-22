import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Inventory Export Functions
export const exportInventoryToPDF = (items: any[], propertyName?: string) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text('Inventory Report', 14, 20);
  
  if (propertyName) {
    doc.setFontSize(12);
    doc.text(`Property: ${propertyName}`, 14, 28);
  }
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, propertyName ? 34 : 28);
  
  // Prepare table data
  const tableData = items.map(item => [
    item.name,
    item.category_name || 'N/A',
    item.current_quantity?.toString() || '0',
    item.restock_threshold?.toString() || '0',
    item.unit || 'units',
    `$${(item.unit_price || 0).toFixed(2)}`,
    item.supplier || 'N/A',
    item.current_quantity <= item.restock_threshold ? 'Yes' : 'No'
  ]);
  
  autoTable(doc, {
    startY: propertyName ? 40 : 34,
    head: [['Item', 'Category', 'Stock', 'Restock Level', 'Unit', 'Price', 'Supplier', 'Needs Restock']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });
  
  doc.save(`inventory-report-${Date.now()}.pdf`);
};

export const exportInventoryToExcel = (items: any[], propertyName?: string) => {
  const worksheetData = items.map(item => ({
    'Item Name': item.name,
    'Category': item.category_name || 'N/A',
    'Current Stock': item.current_quantity || 0,
    'Restock Level': item.restock_threshold || 0,
    'Unit': item.unit || 'units',
    'Unit Price': item.unit_price || 0,
    'Cost per Package': item.cost_per_package || 0,
    'Units per Package': item.units_per_package || 0,
    'Supplier': item.supplier || 'N/A',
    'Needs Restock': item.current_quantity <= item.restock_threshold ? 'Yes' : 'No',
    'Notes': item.notes || ''
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
  
  XLSX.writeFile(workbook, `inventory-report-${Date.now()}.xlsx`);
};

// Inspection Export Functions
export const exportInspectionsToPDF = (inspections: any[], propertyName?: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Inspection Report', 14, 20);
  
  if (propertyName) {
    doc.setFontSize(12);
    doc.text(`Property: ${propertyName}`, 14, 28);
  }
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, propertyName ? 34 : 28);
  
  const tableData = inspections.map(inspection => [
    inspection.property_name || 'N/A',
    inspection.template_name || 'N/A',
    new Date(inspection.completed_at || inspection.created_at).toLocaleDateString(),
    inspection.completed_by || 'N/A',
    inspection.status || 'N/A',
    inspection.items?.filter((i: any) => i.status === 'fail').length?.toString() || '0'
  ]);
  
  autoTable(doc, {
    startY: propertyName ? 40 : 34,
    head: [['Property', 'Template', 'Date', 'Inspector', 'Status', 'Issues']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });
  
  doc.save(`inspection-report-${Date.now()}.pdf`);
};

export const exportInspectionsToExcel = (inspections: any[], propertyName?: string) => {
  const worksheetData = inspections.map(inspection => ({
    'Property': inspection.property_name || 'N/A',
    'Template': inspection.template_name || 'N/A',
    'Date': new Date(inspection.completed_at || inspection.created_at).toLocaleDateString(),
    'Inspector': inspection.completed_by || 'N/A',
    'Status': inspection.status || 'N/A',
    'Issues Found': inspection.items?.filter((i: any) => i.status === 'fail').length || 0,
    'Total Items': inspection.items?.length || 0,
    'Notes': inspection.notes || ''
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inspections');
  
  XLSX.writeFile(workbook, `inspection-report-${Date.now()}.xlsx`);
};

// Damage Report Export Functions
export const exportDamageReportsToPDF = (reports: any[], propertyName?: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Damage Reports', 14, 20);
  
  if (propertyName) {
    doc.setFontSize(12);
    doc.text(`Property: ${propertyName}`, 14, 28);
  }
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, propertyName ? 34 : 28);
  
  const tableData = reports.map(report => [
    report.title,
    report.severity,
    report.status,
    report.location,
    report.assignedTo || 'Unassigned',
    report.estimatedCost ? `$${report.estimatedCost.toFixed(2)}` : 'N/A',
    report.actualCost ? `$${report.actualCost.toFixed(2)}` : 'N/A',
    new Date(report.createdAt).toLocaleDateString()
  ]);
  
  autoTable(doc, {
    startY: propertyName ? 40 : 34,
    head: [['Title', 'Severity', 'Status', 'Location', 'Assigned To', 'Est. Cost', 'Actual Cost', 'Date']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });
  
  doc.save(`damage-reports-${Date.now()}.pdf`);
};

export const exportDamageReportsToExcel = (reports: any[], propertyName?: string) => {
  const worksheetData = reports.map(report => ({
    'Title': report.title,
    'Description': report.description,
    'Severity': report.severity,
    'Status': report.status,
    'Location': report.location,
    'Assigned To': report.assignedTo || 'Unassigned',
    'Estimated Cost': report.estimatedCost || 0,
    'Actual Cost': report.actualCost || 0,
    'Property': report.propertyName || 'N/A',
    'Created Date': new Date(report.createdAt).toLocaleDateString(),
    'Updated Date': new Date(report.updatedAt).toLocaleDateString(),
    'Notes': report.notes || ''
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Damage Reports');
  
  XLSX.writeFile(workbook, `damage-reports-${Date.now()}.xlsx`);
};
