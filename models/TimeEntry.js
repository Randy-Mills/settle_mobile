module.exports = function(sequelize, DataTypes) {
	return sequelize.define('TimeEntry', {
		timeEntryId: {type: DataTypes.INTEGER, primaryKey: true}, 
		employeeId: DataTypes.INTEGER,
		costingCodeId: DataTypes.INTEGER,
		hours: DataTypes.FLOAT(10,2),
		approverId: DataTypes.INTEGER,
		approvalStatus: DataTypes.INTEGER,
		entryDate: DataTypes.DATE,
		approvalDate: DataTypes.DATE,
		comments: DataTypes.TEXT,
		approverComments: DataTypes.TEXT,
		subCostingCodeId: DataTypes.INTEGER,
		lastModifiedUserName: DataTypes.STRING(20),
		lastModifiedDate: DataTypes.DATE,
		createdByUserName: DataTypes.STRING(20),
		createdDate: DataTypes.DATE
	}, {
		freezeTableName: true,
		timestamps: false
	})
};