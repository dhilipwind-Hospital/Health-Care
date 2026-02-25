/**
 * Generic CSV Export Utility
 * 
 * Usage:
 *   exportToCSV(data, columns, 'filename');
 * 
 * where columns is an array of { header: 'Display Name', key: 'fieldName' }
 */

interface ExportColumn {
    header: string;
    key: string;
    /** Optional formatter for complex/nested values */
    formatter?: (value: any, record: any) => string;
}

/**
 * Safely extract a nested value from an object using dot-notation key
 * e.g., getNestedValue(obj, 'department.name') → obj.department.name
 */
function getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return '';
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Escape a CSV cell value (handles commas, quotes, newlines)
 */
function escapeCSVCell(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // If value contains comma, double-quote, or newline, wrap in quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV(
    data: any[],
    columns: ExportColumn[],
    filename: string = 'export'
): void {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Build header row
    const headerRow = columns.map(col => escapeCSVCell(col.header)).join(',');

    // Build data rows
    const dataRows = data.map(record => {
        return columns.map(col => {
            let value: any;
            if (col.formatter) {
                value = col.formatter(getNestedValue(record, col.key), record);
            } else {
                value = getNestedValue(record, col.key);
            }
            return escapeCSVCell(value);
        }).join(',');
    });

    // Combine
    const csvContent = [headerRow, ...dataRows].join('\n');

    // Create blob and trigger download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Quick export for Ant Design Table data
 * Pass the dataSource and column definitions
 */
export function exportTableToCSV(
    dataSource: any[],
    antColumns: any[],
    filename: string = 'export'
): void {
    const exportColumns: ExportColumn[] = antColumns
        .filter((col: any) => col.title && col.dataIndex) // skip action columns
        .map((col: any) => ({
            header: typeof col.title === 'string' ? col.title : String(col.title || ''),
            key: Array.isArray(col.dataIndex) ? col.dataIndex.join('.') : col.dataIndex,
        }));

    exportToCSV(dataSource, exportColumns, filename);
}

export default exportToCSV;
