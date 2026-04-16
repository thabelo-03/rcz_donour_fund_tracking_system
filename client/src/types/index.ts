export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'admin' | 'finance_officer' | 'treasurer' | 'auditor' | 'project_manager';
  department?: string;
  congregation?: string;
  isActive?: boolean;
  lastLogin?: string;
}

export interface Donor {
  _id: string;
  name: string;
  type: 'International' | 'NGO' | 'Faith-Based' | 'Local' | 'Government' | 'Individual';
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  contactPerson?: string;
  totalDonated: number;
  totalGrants: number;
  activeGrants: number;
  confidenceScore: number;
  status: 'Active' | 'Inactive' | 'Prospective';
  notes?: string;
  communications?: Communication[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Communication {
  _id?: string;
  date: string;
  subject: string;
  message: string;
  type: 'Email' | 'Meeting' | 'Phone' | 'Report';
}

export interface Milestone {
  _id?: string;
  title: string;
  description?: string;
  dueDate?: string;
  completedDate?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  deliverables?: string;
  amountAllocated: number;
  amountSpent: number;
}

export interface ComplianceItem {
  _id?: string;
  item: string;
  completed: boolean;
  completedDate?: string;
  notes?: string;
}

export interface Grant {
  _id: string;
  title: string;
  donor: Donor | string;
  grantNumber: string;
  description?: string;
  category: 'Education' | 'Health' | 'Humanitarian Relief' | 'Community Development' | 'Infrastructure' | 'Capacity Building';
  totalAmount: number;
  amountDisbursed: number;
  amountSpent: number;
  amountRemaining: number;
  currency: string;
  fundType: 'Restricted' | 'Unrestricted' | 'Temporarily Restricted';
  status: 'Applied' | 'Approved' | 'Active' | 'Reporting' | 'Closed' | 'Suspended';
  startDate?: string;
  endDate?: string;
  reportingFrequency?: string;
  nextReportDue?: string;
  projectManager?: string;
  congregation?: string;
  milestones?: Milestone[];
  complianceChecklist?: ComplianceItem[];
  conditions?: string;
  notes?: string;
  createdAt?: string;
}

export interface Transaction {
  _id: string;
  transactionId: string;
  type: 'Donation Received' | 'Grant Disbursement' | 'Expenditure' | 'Transfer' | 'Refund';
  amount: number;
  currency: string;
  donor?: Donor | string;
  grant?: Grant | string;
  description: string;
  category: string;
  paymentMethod: string;
  reference?: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Completed' | 'Rejected' | 'Flagged';
  approvalStatus: string;
  initiatedBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
  initiatedDate?: string;
  reviewedDate?: string;
  approvedDate?: string;
  congregation?: string;
  project?: string;
  notes?: string;
  isFlagged: boolean;
  flagReason?: string;
  reconciled: boolean;
  reconciledDate?: string;
  reconciledBy?: string;
  createdAt?: string;
}

export interface AuditEntry {
  _id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'FLAG' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'VIEW';
  entity: string;
  entityId?: string;
  description: string;
  performedBy: string;
  role?: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  timestamp: string;
  changes?: { before?: any; after?: any };
}

export interface DashboardStats {
  totalDonors: number;
  totalGrants: number;
  activeGrants: number;
  totalReceived: number;
  totalSpent: number;
  balance: number;
  pendingApprovals: number;
  flaggedTransactions: number;
  byCategory: { _id: string; total: number }[];
  byMonth: { _id: { year: number; month: number }; received: number; spent: number }[];
  recentTransactions: Transaction[];
  recentAudit: AuditEntry[];
  grantsByStatus: { _id: string; count: number; totalAmount: number }[];
}
