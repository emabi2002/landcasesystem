declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface UserOptions {
    head?: (string | number)[][];
    body?: (string | number)[][];
    startY?: number;
    theme?: 'striped' | 'grid' | 'plain';
    headStyles?: {
      fillColor?: number[];
      textColor?: number | number[];
      fontStyle?: string;
    };
    alternateRowStyles?: {
      fillColor?: number[];
    };
    styles?: {
      fontSize?: number;
      cellPadding?: number;
    };
  }

  export default function autoTable(doc: jsPDF, options: UserOptions): void;
}
