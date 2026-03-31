/**
 * Role-Based Access Control Middleware
 */

/**
 * Restrict access to specific roles
 * Usage: authorize('admin', 'teacher')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.userRole}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

/**
 * Admin only
 */
const adminOnly = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.'
    });
  }
  next();
};

/**
 * Teacher or Admin
 */
const teacherOrAdmin = (req, res, next) => {
  if (!['teacher', 'admin'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Teacher or Admin access required.'
    });
  }
  next();
};

/**
 * Verify teacher can only access their assigned classes/subjects
 */
const verifyTeacherAccess = (req, res, next) => {
  if (req.userRole === 'admin') return next(); // Admin bypasses

  const { branch, year, section, subject } = req.body || req.query;
  const teacher = req.user;

  if (!teacher.assignedSubjects || teacher.assignedSubjects.length === 0) {
    return res.status(403).json({
      success: false,
      message: 'No subjects assigned to this teacher.'
    });
  }

  const hasAccess = teacher.assignedSubjects.some(s => {
    const branchMatch = !branch || s.branch === branch;
    const yearMatch = !year || s.year === parseInt(year);
    const sectionMatch = !section || s.section === section;
    const subjectMatch = !subject || s.subject === subject;
    return branchMatch && yearMatch && sectionMatch && subjectMatch;
  });

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized for this class/subject.'
    });
  }

  next();
};

module.exports = { authorize, adminOnly, teacherOrAdmin, verifyTeacherAccess };
