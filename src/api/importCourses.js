// // Script to import courses from CSV and store each course-faculty pair as a unique document in Firestore
// // Usage: node importCourses.js

// const admin = require('firebase-admin');
// const fs = require('fs');
// const path = require('path');
// const csv = require('csv-parser');

// // Initialize Firebase Admin SDK
// const serviceAccount = require('./serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });
// const db = admin.firestore();

// const csvFilePath = path.join(__dirname, 'course.csv');

// async function importCourses() {
//   const courses = [];
//   fs.createReadStream(csvFilePath)
//     .pipe(csv())
//     .on('data', (row) => {
//       courses.push(row);
//     })
//     .on('end', async () => {
//       console.log(`Read ${courses.length} rows from CSV.`);
//       for (const row of courses) {
//         const courseId = row['Course Id'];
//         const facultyId = row['Faculty Id'];
//         if (!courseId || !facultyId) continue;
//         const docId = `${courseId}_${facultyId}`;
//         const docData = {
//           courseId,
//           courseName: row['Course Name'],
//           credits: parseFloat(row['Credits']),
//           semester: row['Semester'],
//           facultyId,
//           branchId: row['Branch Id']
//         };
//         await db.collection('courses').doc(docId).set(docData);
//         console.log(`Imported: ${docId}`);
//       }
//       console.log('Import complete!');
//       process.exit(0);
//     });
// }

// importCourses().catch(err => {
//   console.error('Import failed:', err);
//   process.exit(1);
// });
