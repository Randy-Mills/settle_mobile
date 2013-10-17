module.exports = function(sequelize, DataTypes) {
	return sequelize.define('CostingCode', {
		costingCodeId: {type: DataTypes.INTEGER, primaryKey: true},
		companyId: DataTypes.INTEGER,
		name: DataTypes.STRING(64),
		shortName: DataTypes.STRING(10),
		costingCodeTypeId: DataTypes.INTEGER,
		status: DataTypes.INTEGER,
		lastModifiedUserName: DataTypes.STRING(20),
		lastModifiedDate: DataTypes.DATE,
		createdByUserName: DataTypes.STRING(20),
		createdDate: DataTypes.DATE
	}, {
		freezeTableName: true,
		timestamps: false
	})
};