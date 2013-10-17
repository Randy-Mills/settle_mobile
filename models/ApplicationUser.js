module.exports = function(sequelize, DataTypes) {
	return sequelize.define('ApplicationUser', {
		userId: {type: DataTypes.INTEGER, primaryKey: true},
		displayName: DataTypes.STRING,
		employeeId: DataTypes.INTEGER,
		hashedPassword: DataTypes.STRING,
		enabled: DataTypes.INTEGER(1),
		forcePasswordChangeOnLogin: DataTypes.INTEGER(1),
		invalidAttempts: DataTypes.INTEGER,
		minimumPasswordAgeDays: DataTypes.INTEGER,
		maximumPasswordAgeDays: DataTypes.INTEGER,
		lastModifiedUserName: DataTypes.STRING(20),
		lastModifiedDate: DataTypes.DATE,
		createdByUserName: DataTypes.STRING(20),
		createdDate: DataTypes.DATE
	}, {
		freezeTableName: true,
		timestamps: false
	})
};