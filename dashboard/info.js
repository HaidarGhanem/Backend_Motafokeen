const express = require('express');
const router = express.Router();
const Student = require('../models/students');
const Teacher = require('../models/teachers');
const Class = require('../models/classes');
const Subclass = require('../models/subclasses');
const Admin = require('../models/admins');
const AcademicYear = require('../models/year');
const authorize = require('../functions/authorize');

// Predefined list of Syrian cities
const SYRIAN_CITIES = [
    "طرطوس", "اللاذقية", "حمص", "دمشق", "حلب", 
    "إدلب", "درعا", "السويداء", "القنيطرة", "دير الزور",
    "الحسكة", "الرقة", "حماة", "القامشلي"
];

// Get all statistics
router.get('/', async (req, res) => {
    try {
        // 1. Get counts of all entities
        const [studentCount, teacherCount, adminCount] = await Promise.all([
            Student.countDocuments(),
            Teacher.countDocuments(),
            Admin.countDocuments()
        ]);

        const yearInfo = await AcademicYear.findOne({ active: 1 })
            .select('year -_id')
            .lean();

        const year = yearInfo ? yearInfo.year : null;

        // 2. Get student distribution by class
        const classes = await Class.find().lean();
        const classStats = await Promise.all(classes.map(async (classItem) => {
            const subclasses = await Subclass.find({ classId: classItem._id });
            const subclassIds = subclasses.map(s => s._id);
            const count = await Student.countDocuments({ subclassId: { $in: subclassIds } });
            
            return {
                className: classItem.name,
                count,
                percentage: studentCount > 0 ? Math.round((count / studentCount) * 100) : 0
            };
        }));

        // 3. Get gender distribution
        const genderStats = await Student.aggregate([
            {
                $match: {
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

        // 4. Get city distribution for the main endpoint (limited data)
        const cityStats = await Student.aggregate([
            {
                $match: {
                    city: { $exists: true, $ne: "" }
                }
            },
            {
                $group: {
                    _id: "$city",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 5 // Only get top 5 cities for main endpoint
            },
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

        // 4. Prepare response
        const response = {
            counts: {
                students: studentCount,
                teachers: teacherCount,
                admins: adminCount,
                yearName: year
            },
            studentDistribution: {
                byClass: classStats,
                byGender: genderStats,
                byCity: cityStats, // Add city data to main endpoint
                totalStudents: studentCount
            }
        };
        
        res.status(200).json({
            success: true,
            message: 'تم جلب الإحصائيات بنجاح',
            data: response
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

// Enhanced city distribution endpoint with predefined cities
router.get('/city-distribution', async (req, res) => {
    try {
        // 1. Get total student count for percentages
        const totalStudents = await Student.countDocuments();
        
        // 2. Get all cities from students
        const allCityStats = await Student.aggregate([
            {
                $match: {
                    city: { $exists: true, $ne: "" }
                }
            },
            {
                $group: {
                    _id: "$city",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
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

        // 3. Create a map for quick lookup
        const cityMap = new Map();
        allCityStats.forEach(city => {
            cityMap.set(city.city, city);
        });

        // 4. Create results for predefined Syrian cities
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

        // 5. Get other cities (not in predefined list)
        const otherCities = allCityStats.filter(city => 
            !SYRIAN_CITIES.includes(city.city)
        );

        // Calculate total for other cities
        const otherCitiesTotal = otherCities.reduce((sum, city) => sum + city.count, 0);
        const otherCitiesPercentage = totalStudents > 0 ? 
            Math.round((otherCitiesTotal / totalStudents) * 100) : 0;

        // 6. Prepare response
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