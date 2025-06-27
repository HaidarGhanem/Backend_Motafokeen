const Marks = require('../models/studies/marks')
const Subject = require('../models/studies/subjects')

const ExamsMarks = async (studentId, classId, semester) => {
    try {
       
        // 2. Validate input
        if (!semester || isNaN(semester)) {
            return ({
                success: false,
                message: "Valid semester parameter is required (1 or 2)"
            })
        }

        // 3. Get all subjects for the student's class and semester
        const subjects = await Subject.find({
            classId: classId,
            semster: parseInt(semester) // Note: using 'semster' to match your document
        }).lean()

        if (subjects.length === 0) {
            return ({
                success: false,
                message: "No subjects found for this class and semester",
                debug: {
                    query: {
                        classId: classId,
                        semster: parseInt(semester)
                    },
                    actualClassIdInSession: classId
                }
            })
        }

        // 4. Get all marks for this student
        const marks = await Marks.find({
            studentId: studentId
        }).lean()

        // 5. Combine subjects with marks
        const subjectsWithMarks = subjects.map(subject => {
            const subjectMark = marks.find(mark => 
                mark.subjectId && mark.subjectId.toString() === subject._id.toString()
            )

            return {
                subjectId: subject._id,
                subjectName: subject.name,
                semester: subject.semster, // Note: using semster
                marks: subjectMark ? {
                    firstQuiz: subjectMark.firstQuiz || 0,
                    secondQuiz: subjectMark.secondQuiz || 0,
                    finalExam: subjectMark.finalExam || 0,
                    total: subjectMark.total || 0
                } : {
                    firstQuiz: 0,
                    secondQuiz: 0,
                    finalExam: 0,
                    total: 0
                }
            }
        })

        return ({
            success: true,
            data: {
                studentId,
                classId,
                semester: parseInt(semester),
                subjects: subjectsWithMarks
            }
        })

    } catch (error) {
        console.error('Error:', error)
        return ({
            success: false,
            message: "Internal server error",
            error: error.message
        })
    }
}

module.exports = { ExamsMarks }