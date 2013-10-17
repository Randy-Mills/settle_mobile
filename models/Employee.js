module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Employee', {
		employeeId: {type: DataTypes.INTEGER, primaryKey: true},
		companyId: DataTypes.INTEGER,
		firstName: DataTypes.STRING(64),
		lastName: DataTypes.STRING(64),
		userName: DataTypes.STRING(20),
		defaultWeeklyWorkHours: DataTypes.FLOAT(10,2),
		contactDetailsId: DataTypes.INTEGER,
		timeApproverEmployeeId: DataTypes.INTEGER,
		expenseApproverEmployeeId: DataTypes.INTEGER,
		startDate: DataTypes.DATE,
		isTimeRequired: DataTypes.INTEGER(1),
		lastModifiedUserName: DataTypes.STRING(20),
		lastModifiedDate: DataTypes.DATE,
		createdByUserName: DataTypes.STRING(20),
		createdDate: DataTypes.DATE,
		yearlyVacationHours: DataTypes.FLOAT(10,2),
		bankedVacationHours: DataTypes.FLOAT(10,2),
		officeLocationId: DataTypes.INTEGER,
		targetUtilization: DataTypes.INTEGER,
		active: DataTypes.INTEGER(1),
		employeeType: DataTypes.INTEGER,
		wellness: DataTypes.FLOAT(10,2)
	}, {
		freezeTableName: true,
		timestamps: false
	})
};