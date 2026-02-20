import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DamageReport } from '@/hooks/useDamageReports';

interface PropertyInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export const generateClaimPDF = (report: DamageReport, property?: PropertyInfo | null) => {
  const doc = new jsPDF();
  let y = 15;

  // Title
  doc.setFontSize(20);
  doc.text('Damage Claim Report', 14, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, y);
  doc.text(`Claim Status: ${(report.claim_status || 'Not Filed').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`, 120, y);
  y += 8;
  doc.setTextColor(0);

  // Property Information
  if (property) {
    doc.setFontSize(14);
    doc.text('Property Information', 14, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [],
      body: [
        ['Property Name', property.name],
        ['Address', `${property.address}, ${property.city}, ${property.state} ${property.zip}`],
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Reservation Details
  doc.setFontSize(14);
  doc.text('Reservation Details', 14, y);
  y += 6;
  const reservationData: string[][] = [];
  if (report.guest_name) reservationData.push(['Guest Name', report.guest_name]);
  if (report.reservation_id) reservationData.push(['Booking/Reservation ID', report.reservation_id]);
  if (report.booking_platform) reservationData.push(['Platform', report.booking_platform.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())]);
  if (report.check_in_date) reservationData.push(['Check-in Date', new Date(report.check_in_date + 'T12:00:00').toLocaleDateString()]);
  if (report.check_out_date) reservationData.push(['Check-out Date', new Date(report.check_out_date + 'T12:00:00').toLocaleDateString()]);

  if (reservationData.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [],
      body: reservationData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Damage Details
  doc.setFontSize(14);
  doc.text('Damage Details', 14, y);
  y += 6;
  const damageData: string[][] = [
    ['Title', report.title || 'N/A'],
    ['Location', report.location],
    ['Severity', report.severity.charAt(0).toUpperCase() + report.severity.slice(1)],
    ['Damage Date', new Date(report.damage_date + 'T12:00:00').toLocaleDateString()],
  ];
  if (report.date_damage_discovered) damageData.push(['Date Discovered', new Date(report.date_damage_discovered + 'T12:00:00').toLocaleDateString()]);
  damageData.push(['Responsible Party', report.responsible_party === 'no-fault' ? 'No Fault' : report.responsible_party.charAt(0).toUpperCase() + report.responsible_party.slice(1)]);
  if (report.estimated_value) damageData.push(['Estimated Cost', `$${report.estimated_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`]);
  if (report.repair_cost) damageData.push(['Repair Cost', `$${report.repair_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`]);

  autoTable(doc, {
    startY: y,
    head: [],
    body: damageData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Description
  doc.setFontSize(12);
  doc.text('Description:', 14, y);
  y += 5;
  doc.setFontSize(10);
  const descLines = doc.splitTextToSize(report.description, 180);
  doc.text(descLines, 14, y);
  y += descLines.length * 5 + 6;

  // Resolution
  if (report.resolution_sought) {
    doc.setFontSize(12);
    doc.text('Resolution Sought:', 14, y);
    y += 5;
    doc.setFontSize(10);
    doc.text(report.resolution_sought.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 14, y);
    y += 8;
  }

  // Claim Info
  if (report.claim_reference_number || report.claim_status) {
    doc.setFontSize(14);
    doc.text('Claim Information', 14, y);
    y += 6;
    const claimData: string[][] = [];
    if (report.claim_status) claimData.push(['Status', report.claim_status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())]);
    if (report.claim_reference_number) claimData.push(['Reference Number', report.claim_reference_number]);
    if (report.claim_deadline) claimData.push(['Filing Deadline', new Date(report.claim_deadline + 'T12:00:00').toLocaleDateString()]);
    
    autoTable(doc, {
      startY: y,
      head: [],
      body: claimData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Timeline notes
  if (report.claim_timeline_notes) {
    doc.setFontSize(12);
    doc.text('Timeline Notes:', 14, y);
    y += 5;
    doc.setFontSize(10);
    const noteLines = doc.splitTextToSize(report.claim_timeline_notes, 180);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 5 + 6;
  }

  // Notes
  if (report.notes) {
    doc.setFontSize(12);
    doc.text('Additional Notes:', 14, y);
    y += 5;
    doc.setFontSize(10);
    const noteLines = doc.splitTextToSize(report.notes, 180);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 5 + 6;
  }

  // Photo counts
  const beforeCount = (report.before_photo_urls || []).length;
  const afterCount = (report.photo_urls || []).length;
  const receiptCount = (report.receipt_urls || []).length;

  if (beforeCount + afterCount + receiptCount > 0) {
    if (y > 250) { doc.addPage(); y = 15; }
    doc.setFontSize(14);
    doc.text('Attachments Summary', 14, y);
    y += 6;
    const attachData: string[][] = [];
    if (beforeCount > 0) attachData.push(['Before Photos', `${beforeCount} photo(s) attached`]);
    if (afterCount > 0) attachData.push(['Damage Photos', `${afterCount} photo(s) attached`]);
    if (receiptCount > 0) attachData.push(['Receipts/Quotes', `${receiptCount} document(s) attached`]);
    
    autoTable(doc, {
      startY: y,
      head: [],
      body: attachData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    });
  }

  const filename = `claim-report-${report.title?.replace(/\s+/g, '-').toLowerCase() || report.id}-${Date.now()}.pdf`;
  doc.save(filename);
};
