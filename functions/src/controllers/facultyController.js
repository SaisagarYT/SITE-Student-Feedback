// const { db } = require("../config/firebase");

// /**
//  * GET /api/faculty
//  * Fetch all faculty records.
//  */
// exports.getAllFaculty = async (req, res) => {
//   try {
//     const facultySnap = await db.collection("faculties").get();
//     const facultyList = facultySnap.docs.map(doc => doc.data());
//     return res.json(facultyList);
//   } catch (error) {
//     console.error("Get all faculty error:", error);
//     return res.status(500).json({ error: error.message });
//   }
// };
