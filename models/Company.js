module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Company', {
		companyId: {type: DataTypes.INTEGER, primaryKey: true},
		companyTypeId: DataTypes.INTEGER,
		name: DataTypes.STRING(64),
		shortName: DataTypes.STRING(3),
		contactDetailsId: DataTypes.INTEGER,
		billingContactDetailsId: DataTypes.INTEGER,
		defaultWeeklyWorkHours: DataTypes.FLOAT(10,2),
		lastModifiedUserName: DataTypes.STRING(20),
		lastModifiedDate: DataTypes.DATE,
		createdByUserName: DataTypes.STRING(20),
		createdDate: DataTypes.DATE
	}, {
		freezeTableName: true,
		timestamps: false
	})
};