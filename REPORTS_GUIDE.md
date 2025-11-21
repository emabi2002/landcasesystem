# Reports & Analytics Guide

## Overview

The DLPP Legal CMS includes a comprehensive reporting system that allows you to generate, export, and print various reports in multiple formats.

## Available Reports

### 1. **Case Summary Report**
- **Description**: Complete list of all cases with full details
- **Columns**: Case Number, Title, Type, Status, Priority, Region, Created Date
- **Filters**: Date range, Status, Region
- **Use Case**: Get an overview of all cases in the system

### 2. **Case Statistics Report**
- **Description**: Statistical analysis of cases broken down by various categories
- **Includes**:
  - Total case count
  - Cases by Status (with percentages)
  - Cases by Type (with percentages)
  - Cases by Region (with percentages)
  - Cases by Priority (with percentages)
- **Export**: Multi-sheet Excel file or formatted PDF
- **Use Case**: Management reporting and analysis

### 3. **Task Status Report**
- **Description**: Overview of all tasks across all cases
- **Columns**: Task, Status, Priority, Due Date, Assigned To, Case Number
- **Sorting**: By due date (ascending)
- **Use Case**: Track task completion and workload

### 4. **Document Register**
- **Description**: Complete catalog of all documents in the system
- **Columns**: Document Title, Type, Upload Date, Case Number
- **Sorting**: By upload date (descending)
- **Use Case**: Document inventory and compliance

### 5. **Land Parcels Report**
- **Description**: List of all land parcels with associated cases
- **Columns**: Parcel Number, Location, Area (ha), Case Number
- **Sorting**: By parcel number (ascending)
- **Use Case**: Land management and tracking

## Export Formats

### Excel (.xlsx)
- **Features**:
  - Fully formatted spreadsheets
  - Auto-sized columns for readability
  - Multiple sheets for statistics reports
  - Formulas preserved
  - Ready for further analysis in Excel
- **Best For**: Data analysis, pivot tables, charts

### PDF (.pdf)
- **Features**:
  - Professional DLPP branding
  - Print-ready formatting
  - Grid-style tables
  - Landscape orientation for wide reports
  - Auto-generated header with report title, date, and department name
- **Best For**: Official documents, archiving, sharing

### Print
- **Features**:
  - Direct browser printing
  - Optimized layout
  - Automatic page breaks
  - Print preview before printing
- **Best For**: Quick hard copies, immediate needs

## How to Generate Reports

### Step 1: Select Report Type
1. Navigate to **Reports** from the main navigation
2. Click on the report type you want to generate
3. The report card will highlight in purple when selected

### Step 2: Apply Filters (Optional)
1. **Date Range**: Set "Date From" and "Date To" to filter by creation date
2. **Status** (Case Summary only): Filter by case status
3. **Region** (Case Summary only): Filter by specific region
4. Leave filters empty to include all records

### Step 3: Choose Export Format
Click one of the three export buttons:
- **Export to Excel** (Green button) - Downloads .xlsx file
- **Export to PDF** (Red button) - Downloads .pdf file
- **Print Report** (Outline button) - Opens print dialog

### Step 4: Wait for Generation
- The button will show "Generating..." while the report is being created
- A success message will appear when the report is ready
- The file will automatically download (Excel/PDF) or print dialog will open (Print)

## Report File Naming Convention

All exported reports follow this naming pattern:
```
{report-type}-{YYYY-MM-DD}.{extension}
```

Examples:
- `case-summary-2025-10-30.xlsx`
- `task-report-2025-10-30.pdf`
- `land-parcels-2025-10-30.xlsx`

## Tips & Best Practices

### For Excel Reports
- Use Excel's filter and sort features for further analysis
- Create pivot tables from the data
- Add your own charts and visualizations
- Statistics reports come with multiple sheets - check all tabs

### For PDF Reports
- PDFs are formatted for A4 or Letter size paper
- Landscape orientation is used for wide tables
- Headers include generation date and department name
- Suitable for official filing and distribution

### For Printing
- Check print preview before finalizing
- Adjust printer settings for best results
- Use landscape orientation for wide reports
- Consider saving as PDF first if you need to print multiple copies

## Filtering Best Practices

### Date Range Filtering
- Use date ranges to create monthly, quarterly, or annual reports
- Leave both dates empty to include all time periods
- Use only "Date From" to get everything after a certain date
- Use only "Date To" to get everything before a certain date

### Status Filtering
- Select "All Statuses" to see complete case list
- Filter by specific status for focused reports
- Combine with date range for time-based status reports

### Region Filtering
- Use region filter for provincial reporting
- Combine with status for regional status analysis
- Helpful for resource allocation planning

## Technical Details

### Libraries Used
- **xlsx**: Excel file generation
- **jsPDF**: PDF document creation
- **jspdf-autotable**: PDF table formatting
- **react-to-print**: Browser printing functionality

### Data Sources
- All reports query directly from Supabase
- Data is fetched in real-time when generating reports
- Filters are applied at the database level for performance

### Performance
- Reports are generated client-side
- Large datasets (>1000 records) may take a few seconds
- No server-side processing required
- All exports happen in the browser

## Troubleshooting

### Report Won't Generate
- **Check**: Is a report type selected? (card should be purple)
- **Check**: Is your internet connection active?
- **Check**: Are there records matching your filters?
- **Solution**: Try clearing filters and regenerating

### Excel File Won't Open
- **Cause**: File may be corrupted or incomplete
- **Solution**: Regenerate the report
- **Note**: Ensure Excel or compatible software is installed

### PDF Looks Weird
- **Cause**: Browser PDF viewer limitations
- **Solution**: Download and open in Adobe Reader or similar
- **Tip**: Use landscape orientation for wide reports

### Print Button Does Nothing
- **Cause**: Pop-up blocker may be active
- **Solution**: Allow pop-ups for this site
- **Alternative**: Use "Export to PDF" then print the PDF

## Future Enhancements

Planned features for future versions:
- Scheduled automatic reports
- Email delivery of reports
- Custom report templates
- Chart and graph visualizations
- Multi-user report collaboration
- Report favorites and templates

## Support

For issues with reporting:
1. Check this guide first
2. Verify your filters are correct
3. Try regenerating the report
4. Contact system administrator if issues persist

---

**Last Updated**: October 30, 2025  
**Version**: 1.0  
**Department of Lands & Physical Planning**
