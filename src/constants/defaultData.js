export const INITIAL_STUDENTS = [
  {
    id: 's-101',
    rollNo: 'MCA-01',
    name: 'Aarav Sharma',
    batch: 'MCA 1st Year',
    email: 'aarav.sharma@college.edu',
    phone: '+91 98765 43210',
    gender: 'Male',
    createdAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 's-102',
    rollNo: 'MCA-02',
    name: 'Ananya Iyer',
    batch: 'MCA 1st Year',
    email: 'ananya.iyer@college.edu',
    phone: '+91 98765 43211',
    gender: 'Female',
    createdAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 's-103',
    rollNo: 'MCA-03',
    name: 'Rohan Deshmukh',
    batch: 'MCA 1st Year',
    email: 'rohan.deshmukh@college.edu',
    phone: '+91 98765 43212',
    gender: 'Male',
    createdAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 's-104',
    rollNo: 'MCA-04',
    name: 'Diya Patel',
    batch: 'MCA 1st Year',
    email: 'diya.patel@college.edu',
    phone: '+91 98765 43213',
    gender: 'Female',
    createdAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 's-105',
    rollNo: 'MCA-05',
    name: 'Vikramaditya Roy',
    batch: 'MCA 1st Year',
    email: 'vikram.roy@college.edu',
    phone: '+91 98765 43214',
    gender: 'Male',
    createdAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 's-106',
    rollNo: 'MCA-06',
    name: 'Sneha Kulkarni',
    batch: 'MCA 1st Year',
    email: 'sneha.k@college.edu',
    phone: '+91 98765 43215',
    gender: 'Female',
    createdAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 's-201',
    rollNo: 'MCA2-01',
    name: 'Pooja Verma',
    batch: 'MCA 2nd Year',
    email: 'pooja.verma@college.edu',
    phone: '+91 98765 43220',
    gender: 'Female',
    createdAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 's-202',
    rollNo: 'MCA2-02',
    name: 'Karthik Nair',
    batch: 'MCA 2nd Year',
    email: 'karthik.nair@college.edu',
    phone: '+91 98765 43221',
    gender: 'Male',
    createdAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 's-203',
    rollNo: 'MCA2-03',
    name: 'Meera Nambiar',
    batch: 'MCA 2nd Year',
    email: 'meera.nambiar@college.edu',
    phone: '+91 98765 43222',
    gender: 'Female',
    createdAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 's-204',
    rollNo: 'MCA2-04',
    name: 'Aditya Gupta',
    batch: 'MCA 2nd Year',
    email: 'aditya.gupta@college.edu',
    phone: '+91 98765 43223',
    gender: 'Male',
    createdAt: '2026-09-01T09:00:00.000Z',
  },
];

// Helper to generate realistic sample attendance records over the last 10 working days
export const generateDemoAttendance = (students) => {
  const records = {};
  const today = new Date();
  
  // Create records for the last 8 days
  for (let i = 8; i >= 1; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    ['MCA 1st Year', 'MCA 2nd Year'].forEach((batch) => {
      const batchStudents = students.filter((s) => s.batch === batch);
      if (batchStudents.length === 0) return;

      const recordKey = `${dateStr}_${batch}`;
      const statusMap = {};

      batchStudents.forEach((student, index) => {
        // Deterministic realistic attendance:
        // Aarav (idx 0): mostly present
        // Ananya (idx 1): 100% present
        // Rohan (idx 2): some absent/late (<75% to showcase defaulter alert!)
        // Sneha (idx 5): moderate
        if (student.rollNo === 'MCA-03') {
          // Rohan has low attendance for testing defaulter features
          statusMap[student.id] = i % 2 === 0 ? 'absent' : (i % 3 === 0 ? 'late' : 'present');
        } else if (student.rollNo === 'MCA2-04') {
          // Aditya Gupta also has some absents
          statusMap[student.id] = i === 1 || i === 3 || i === 5 ? 'absent' : 'present';
        } else if (index % 4 === 0 && i === 2) {
          statusMap[student.id] = 'late';
        } else if (index % 5 === 0 && i === 4) {
          statusMap[student.id] = 'absent';
        } else {
          statusMap[student.id] = 'present';
        }
      });

      records[recordKey] = {
        date: dateStr,
        batch: batch,
        subject: 'Core Computer Science',
        records: statusMap,
        updatedAt: new Date(d.getTime() + 10 * 3600 * 1000).toISOString(),
      };
    });
  }

  return records;
};
