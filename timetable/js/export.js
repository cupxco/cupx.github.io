/**
 * export.js
 * Handles exporting timetable data to PDF, Excel (XLSX), and CSV.
 * Operates purely on data objects without requiring DOM/UI rendering.
 */

const DataExporter = (function () {
    
    const INSTITUTION_NAME = "TimeMaster Academy"; // This could be passed dynamically

    // --- Internal Helpers ---

    /**
     * Converts the nested schedule object into a 2D array (grid) for tables.
     */
    function buildGridForEntity(scheduleData, entityId, days, slots) {
        const headerRow = ['Time', ...days];
        const rows = [headerRow];

        slots.forEach(slot => {
            const row = [slot];
            days.forEach(day => {
                const cellData = scheduleData[entityId]?.[day]?.[slot];
                if (cellData) {
                    // Combine subject and teacher/details for the cell
                    row.push(`${cellData.subjectId || cellData.subject}\n(${cellData.teacherId || cellData.details || ''})`);
                } else {
                    row.push('');
                }
            });
            rows.push(row);
        });

        return rows;
    }

    /**
     * Triggers a browser download for a generated Blob.
     */
    function triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    // --- Core Export Functions ---

    /**
     * Exports timetable data to a well-formatted PDF using jsPDF and AutoTable.
     * @param {Object} timetableData - The generated schedule state.
     */
    function exportToPDF(timetableData) {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            console.error("jsPDF library is not loaded.");
            return false;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        const { classSchedule, days, slots } = timetableData;

        const generatedDate = new Date().toLocaleDateString();
        let yOffset = 15;

        // Title Page / Header
        doc.setFontSize(22);
        doc.setTextColor(79, 70, 229); // Indigo-600
        doc.text(INSTITUTION_NAME, 14, yOffset);
        
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        yOffset += 8;
        doc.text(`Generated on: ${generatedDate}`, 14, yOffset);
        yOffset += 15;

        // Generate a table for each class
        const classes = Object.keys(classSchedule);
        
        classes.forEach((classId, index) => {
            if (index > 0) {
                doc.addPage();
                yOffset = 20;
            }

            doc.setFontSize(16);
            doc.setTextColor(30, 41, 59); // Slate-800
            doc.text(`Class Timetable: ${classId}`, 14, yOffset);
            
            const gridData = buildGridForEntity(classSchedule, classId, days, slots);
            const headers = gridData[0];
            const body = gridData.slice(1);

            doc.autoTable({
                startY: yOffset + 5,
                head: [headers],
                body: body,
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
                bodyStyles: { valign: 'top' },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 30, fillColor: [248, 250, 252] }
                },
                styles: { fontSize: 10, cellPadding: 4, minCellHeight: 20 },
                margin: { top: 20 }
            });
        });

        doc.save(`Timetable_${generatedDate.replace(/\//g, '-')}.pdf`);
        return true;
    }

    /**
     * Exports timetable data to a multi-sheet Excel file using SheetJS.
     * @param {Object} timetableData - The generated schedule state.
     */
    function exportToExcel(timetableData) {
        if (!window.XLSX) {
            console.error("SheetJS (XLSX) library is not loaded.");
            return false;
        }

        const { classSchedule, teacherSchedule, days, slots } = timetableData;
        const wb = XLSX.utils.book_new();

        // 1. Build Class Timetable Sheet
        let classSheetData = [];
        Object.keys(classSchedule).forEach(classId => {
            classSheetData.push([`Class: ${classId}`]);
            const grid = buildGridForEntity(classSchedule, classId, days, slots);
            classSheetData = classSheetData.concat(grid);
            classSheetData.push([]); // Empty row for spacing
            classSheetData.push([]);
        });
        const wsClass = XLSX.utils.aoa_to_sheet(classSheetData);
        XLSX.utils.book_append_sheet(wb, wsClass, "Class Timetables");

        // 2. Build Teacher Timetable Sheet
        let teacherSheetData = [];
        Object.keys(teacherSchedule || {}).forEach(teacherId => {
            teacherSheetData.push([`Teacher: ${teacherId}`]);
            const grid = buildGridForEntity(teacherSchedule, teacherId, days, slots);
            teacherSheetData = teacherSheetData.concat(grid);
            teacherSheetData.push([]); 
            teacherSheetData.push([]);
        });
        const wsTeacher = XLSX.utils.aoa_to_sheet(teacherSheetData);
        XLSX.utils.book_append_sheet(wb, wsTeacher, "Teacher Timetables");

        // 3. Build Master List (Flat Data)
        let masterData = [['Type', 'ID', 'Day', 'Time', 'Subject', 'Details']];
        Object.keys(classSchedule).forEach(classId => {
            days.forEach(day => {
                slots.forEach(slot => {
                    const entry = classSchedule[classId][day][slot];
                    if (entry) {
                        masterData.push([
                            'Class', 
                            classId, 
                            day, 
                            slot, 
                            entry.subjectId || entry.subject, 
                            entry.teacherId || entry.details || ''
                        ]);
                    }
                });
            });
        });
        const wsMaster = XLSX.utils.aoa_to_sheet(masterData);
        XLSX.utils.book_append_sheet(wb, wsMaster, "Master List");

        // Trigger Download
        XLSX.writeFile(wb, `Master_Timetable.xlsx`);
        return true;
    }

    /**
     * Exports raw timetable data to a flat CSV file.
     * @param {Object} timetableData - The generated schedule state.
     */
    function exportToCSV(timetableData) {
        const { classSchedule, days, slots } = timetableData;
        
        let csvContent = "Type,Entity ID,Day,Time,Subject,Details\n";

        Object.keys(classSchedule).forEach(classId => {
            days.forEach(day => {
                slots.forEach(slot => {
                    const entry = classSchedule[classId][day][slot];
                    if (entry) {
                        // Escape quotes and commas
                        const subject = `"${String(entry.subjectId || entry.subject).replace(/"/g, '""')}"`;
                        const details = `"${String(entry.teacherId || entry.details || '').replace(/"/g, '""')}"`;
                        csvContent += `Class,${classId},${day},${slot},${subject},${details}\n`;
                    }
                });
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, 'Raw_Timetable_Data.csv');
        return true;
    }

    // --- Public API ---
    return {
        exportToPDF,
        exportToExcel,
        exportToCSV
    };

})();

// For ES Modules context:
// export default DataExporter;

