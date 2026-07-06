declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface CellStyles {
    fontSize?: number;
    cellPadding?: number;
    overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
    cellWidth?: number | 'auto' | 'wrap';
    fillColor?: number[];
    textColor?: number | number[];
    fontStyle?: string;
    halign?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
  }

  interface UserOptions {
    head?: (string | number)[][];
    body?: (string | number)[][];
    startY?: number;
    theme?: 'striped' | 'grid' | 'plain';
    orientation?: 'portrait' | 'landscape';
    headStyles?: CellStyles;
    bodyStyles?: CellStyles;
    alternateRowStyles?: {
      fillColor?: number[];
    };
    styles?: CellStyles;
    columnStyles?: Record<number, CellStyles>;
    margin?: number | { top?: number; right?: number; bottom?: number; left?: number };
  }

  export default function autoTable(doc: jsPDF, options: UserOptions): void;
}
