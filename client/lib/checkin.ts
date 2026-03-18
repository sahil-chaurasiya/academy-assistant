import api from './api';

export type CheckInResult = 'success' | 'already' | 'error';

export async function checkInStudent(studentId: string): Promise<CheckInResult> {
  try {
    const { data } = await api.post('/visits/checkin', { studentId });
    return data.alreadyCheckedIn ? 'already' : 'success';
  } catch {
    return 'error';
  }
}

export async function getTodayStatus(studentId: string): Promise<boolean> {
  try {
    const { data } = await api.get(`/visits/check/${studentId}`);
    return data.checkedIn;
  } catch {
    return false;
  }
}