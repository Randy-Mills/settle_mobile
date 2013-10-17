module.exports = function(sequelize, DataTypes) {
	return sequelize.define('UserCostingCode', {
		userId: {type: DataTypes.INTEGER, primaryKey: true},
		costingCodeId: {type: DataTypes.INTEGER, primaryKey: true},
		lastModifiedUserName: DataTypes.STRING(20),
		lastModifiedDate: DataTypes.DATE,
		createdByUserName: DataTypes.STRING(20),
		createdDate: DataTypes.DATE
	}, {
		freezeTableName: true,
		timestamps: false
	})
};