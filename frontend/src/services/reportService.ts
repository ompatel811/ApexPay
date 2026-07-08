import axiosClient from './axiosClient';

export interface TransactionStatementItem {
  transactionReference: string;
  timestamp: string;
  type: string;
  description: string;
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  category: string;
  status: string;
}

export interface AccountStatement {
  openingBalance: number;
  closingBalance: number;
  creditsSum: number;
  debitsSum: number;
  transactions: TransactionStatementItem[];
  summaryPeriod: string;
}

export const reportService = {
  generateStatement: async (startDate: string, endDate: string): Promise<AccountStatement> => {
    const response = await axiosClient.get('/api/statements', { params: { startDate, endDate } });
    return response.data.data;
  },

  exportTransactions: async (format: 'CSV' | 'EXCEL' | 'PDF', startDate: string, endDate: string): Promise<Blob> => {
    const response = await axiosClient.post(
      '/api/reports/export',
      { format, startDate, endDate },
      { responseType: 'blob' }
    );
    return response.data;
  }
};
export default reportService;
