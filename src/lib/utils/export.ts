export function convertToCSV(data: any[]): string {
    if (data.length === 0) return "";
    const header = Object.keys(data[0]).join(",");
    const rows = data.map(row =>
        Object.values(row).map(value => {
            if (typeof value === 'string') {
                return `"${value.replace(/"/g, '""')}"`; // Escape quotes
            }
            return value;
        }).join(",")
    );
    return [header, ...rows].join("\n");
}

export function downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
