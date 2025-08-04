// This file contains shared TypeScript interfaces used across the application.

export interface BankAccount {
  id: string;
  bank_name: string;
  account_title: string;
  account_number: string;
  iban: string;
}

export interface PurchaseInfoResponse {
  course_price: number;
  course_title: string;
  bank_accounts: BankAccount[];
  payment_status?: 'pending' | 'approved' | 'rejected' | null;
}

export interface ApplicationStatusResponse {
    status: 'pending' | 'enrolled' | 'rejected' | 'not_applied' | 'approved';
    application_id?: string;
}
