export type UserRole = 'Employee' | 'Safety Officer' | 'Hazard Officer' | 'Manager' | 'Administrator' | 'Compliance Officer' | 'Government Auditor';

export interface User {
  userId: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Pending';
  password?: string;
  department?: string;
  joinedDate?: string;
}

export interface AuditLog {
  auditId: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: string;
}

export interface Employee {
  employeeId: string;
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  contactInfo: string;
  department: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Terminated';
  userId?: string;
  email?: string;
  position?: string;
}

export interface EmployeeDocument {
  documentId: string;
  employeeId: string;
  employeeName?: string;
  docType: 'ID Proof' | 'Training Certificate';
  fileUri: string;
  uploadedDate: string;
  verificationStatus: 'Verified' | 'Pending' | 'Rejected';
}

export type HazardSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type HazardStatus = 'Open' | 'Under Investigation' | 'Resolved' | 'Closed';

export interface Hazard {
  hazardId: string;
  employeeId: string;
  employeeName: string;
  description: string;
  location: string;
  date: string;
  status: HazardStatus;
  severity: HazardSeverity;
  category?: string;
}

export interface Incident {
  incidentId: string;
  hazardId: string;
  hazardDescription?: string;
  officerId: string;
  officerName: string;
  actions: string;
  date: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
}

export interface Inspection {
  inspectionId: string;
  officerId: string;
  officerName: string;
  location: string;
  findings: string;
  date: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  type?: string;
}

export interface ComplianceCheck {
  checkId: string;
  inspectionId: string;
  inspectionLocation?: string;
  result: 'Pass' | 'Fail' | 'Partial';
  notes: string;
  date: string;
  status: 'Open' | 'Closed';
}

export interface Program {
  programId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'Cancelled' | 'Planned';
  enrolledCount?: number;
  completedCount?: number;
}

export interface Training {
  trainingId: string;
  programId: string;
  programTitle: string;
  employeeId: string;
  employeeName: string;
  completionDate?: string;
  status: 'Enrolled' | 'In Progress' | 'Completed' | 'Failed';
}

export interface ComplianceRecord {
  complianceId: string;
  entityId: string;
  entityDescription?: string;
  type: 'Hazard' | 'Inspection' | 'Program';
  result: 'Compliant' | 'Non-Compliant' | 'Partial';
  date: string;
  notes: string;
}

export interface Audit {
  auditId: string;
  officerId: string;
  officerName: string;
  scope: string;
  findings: string;
  date: string;
  status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
}

export interface Report {
  reportId: string;
  title: string;
  scope: 'Hazard' | 'Inspection' | 'Program' | 'Compliance';
  metrics: Record<string, number | string>;
  generatedDate: string;
  generatedBy?: string;
}

export interface Notification {
  notificationId: string;
  userId: string;
  entityId: string;
  message: string;
  category: 'Hazard' | 'Inspection' | 'Program' | 'Compliance';
  status: 'Unread' | 'Read';
  createdDate: string;
}
