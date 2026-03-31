/**
 * CSV Export Utilities
 * Generates CSV files for attendance, marks, fees
 */

const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs');

/**
 * Export attendance data to CSV
 */
const exportAttendanceCSV = async (data, filename) => {
  const outputPath = path.join(__dirname, '../exports', `${filename}.csv`);
  
  // Ensure exports dir exists
  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: [
      { id: 'rollNumber', title: 'Roll Number' },
      { id: 'studentName', title: 'Student Name' },
      { id: 'subject', title: 'Subject' },
      { id: 'date', title: 'Date' },
      { id: 'status', title: 'Status' },
      { id: 'markedBy', title: 'Marked By' }
    ]
  });

  await csvWriter.writeRecords(data);
  return outputPath;
};

/**
 * Export marks data to CSV
 */
const exportMarksCSV = async (data, filename) => {
  const outputPath = path.join(__dirname, '../exports', `${filename}.csv`);
  
  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: [
      { id: 'rollNumber', title: 'Roll Number' },
      { id: 'studentName', title: 'Student Name' },
      { id: 'subject', title: 'Subject' },
      { id: 'examType', title: 'Exam Type' },
      { id: 'marksObtained', title: 'Marks Obtained' },
      { id: 'totalMarks', title: 'Total Marks' },
      { id: 'percentage', title: 'Percentage' },
      { id: 'grade', title: 'Grade' }
    ]
  });

  await csvWriter.writeRecords(data);
  return outputPath;
};

/**
 * Export fee data to CSV
 */
const exportFeeCSV = async (data, filename) => {
  const outputPath = path.join(__dirname, '../exports', `${filename}.csv`);
  
  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: [
      { id: 'rollNumber', title: 'Roll Number' },
      { id: 'studentName', title: 'Student Name' },
      { id: 'feeType', title: 'Fee Type' },
      { id: 'amount', title: 'Amount' },
      { id: 'dueDate', title: 'Due Date' },
      { id: 'paidDate', title: 'Paid Date' },
      { id: 'status', title: 'Status' },
      { id: 'semester', title: 'Semester' }
    ]
  });

  await csvWriter.writeRecords(data);
  return outputPath;
};

/**
 * Calculate grade based on percentage
 */
const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

module.exports = {
  exportAttendanceCSV,
  exportMarksCSV,
  exportFeeCSV,
  calculateGrade
};
