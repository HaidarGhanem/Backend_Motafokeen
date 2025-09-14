const express = require('express');
const router = express.Router();
const Student = require('../models/students');
const Teacher = require('../models/teachers');
const Class = require('../models/classes');
const Subclass = require('../models/subclasses');
const Admin = require('../models/admins');
const AcademicYear = require('../models/year');

// Predefined list of Syrian cities
const SYRIAN_CITIES = [
    "طرطوس", "اللاذقية", "حمص", "دمشق", "حلب", 
    "إدلب", "درعا", "السويداء", "القنيطرة", "دير الزور",
    "الحسكة", "الرقة", "حماة", "القامشلي"
];

// Get all statistics (filtered by active year)
router.get('/', async (req, res) => {
    try {
        // 1. Get active academic year
        const yearInfo = await AcademicYear.findOne({ active: 1 }).lean();
        if (!yearInfo) {
            return res.status(404).json({
                success: false,
                message: 'لا يوجد عام دراسي مفعل حالياً'
            });
        }
        const activeYearId = yearInfo._id;
        const year = yearInfo.year;

        // 2. Get counts
        const [studentCount, teacherCount, adminCount] = await Promise.all([
            Student.countDocuments({ academicYearId: activeYearId }),
            Teacher.countDocuments(),
            Admin.countDocuments()
        ]);

        // 3. Get student distribution by class
        const classes = await Class.find().lean();
        const classStats = await Promise.all(classes.map(async (classItem) => {
            const subclasses = await Subclass.find({ classId: classItem._id });
            const subclassIds = subclasses.map(s => s._id);
            const count = await Student.countDocuments({ 
                subclassId: { $in: subclassIds },
                academicYearId: activeYearId
            });
            
            return {
                className: classItem.name,
                count,
                percentage: studentCount > 0 ? Math.round((count / studentCount) * 100) : 0
            };
        }));

        // 4. Get gender distribution
        const genderStats = await Student.aggregate([
            {
                $match: {
                    academicYearId: activeYearId,
                    gender: { $in: ["ذكر", "أنثى"] }
                }
            },
            {
                $group: {
                    _id: "$gender",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    gender: "$_id",
                    count: 1,
                    percentage: {
                        $round: [
                            { $multiply: [{ $divide: ["$count", studentCount] }, 100] },
                            1
                        ]
                    },
                    _id: 0
                }
            }
        ]);

        // 5. Get city distribution (top 5 only)
        const cityStats = await Student.aggregate([
            {
                $match: {
                    academicYearId: activeYearId,
                    city: { $exists: true, $ne: "" }
                }
            },
            {
                $group: {
                    _id: "$city",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $project: {
                    city: "$_id",
                    count: 1,
                    percentage: {
                        $round: [
                            { $multiply: [{ $divide: ["$count", studentCount] }, 100] },
                            1
                        ]
                    },
                    _id: 0
                }
            }
        ]);

        // 6. Response
        res.status(200).json({
            success: true,
            message: 'تم جلب الإحصائيات بنجاح',
            data: {
                counts: {
                    students: studentCount,
                    teachers: teacherCount,
                    admins: adminCount,
                    yearName: year
                },
                studentDistribution: {
                    byClass: classStats,
                    byGender: genderStats,
                    byCity: cityStats,
                    totalStudents: studentCount
                }
            }
        });

    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب الإحصائيات',
            error: error.message
        });
    }
});

// City distribution endpoint (filtered by active year)
router.get('/city-distribution', async (req, res) => {
    try {
        // 1. Get active academic year
        const yearInfo = await AcademicYear.findOne({ active: 1 }).lean();
        if (!yearInfo) {
            return res.status(404).json({
                success: false,
                message: 'لا يوجد عام دراسي مفعل حالياً'
            });
        }
        const activeYearId = yearInfo._id;

        // 2. Get total students for this year
        const totalStudents = await Student.countDocuments({ academicYearId: activeYearId });
        
        // 3. Get all city stats for this year
        const allCityStats = await Student.aggregate([
            {
                $match: {
                    academicYearId: activeYearId,
                    city: { $exists: true, $ne: "" }
                }
            },
            {
                $group: {
                    _id: "$city",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            {
                $project: {
                    city: "$_id",
                    count: 1,
                    percentage: {
                        $round: [
                            { $multiply: [{ $divide: ["$count", totalStudents] }, 100] },
                            1
                        ]
                    },
                    _id: 0
                }
            }
        ]);

        // 4. Map for quick lookup
        const cityMap = new Map();
        allCityStats.forEach(city => {
            cityMap.set(city.city, city);
        });

        // 5. Predefined Syrian cities
        const syrianCityStats = SYRIAN_CITIES.map(cityName => {
            const cityData = cityMap.get(cityName);
            if (cityData) {
                return cityData;
            } else {
                return {
                    city: cityName,
                    count: 0,
                    percentage: 0
                };
            }
        });

        // 6. Other cities (not predefined)
        const otherCities = allCityStats.filter(city => 
            !SYRIAN_CITIES.includes(city.city)
        );

        const otherCitiesTotal = otherCities.reduce((sum, city) => sum + city.count, 0);
        const otherCitiesPercentage = totalStudents > 0 ? 
            Math.round((otherCitiesTotal / totalStudents) * 100) : 0;

        // 7. Response
        res.status(200).json({
            success: true,
            message: 'تم جلب توزع الطلاب حسب المدينة بنجاح',
            data: {
                totalStudents,
                predefinedCities: syrianCityStats,
                otherCities: {
                    cities: otherCities,
                    total: otherCitiesTotal,
                    percentage: otherCitiesPercentage
                }
            }
        });

    } catch (error) {
        console.error('Error fetching city distribution:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب توزع الطلاب حسب المدينة',
            error: error.message
        });
    }
});

module.exports = router;
