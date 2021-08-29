const { Sequelize,DataTypes } = require('sequelize');
const sequelize = new Sequelize(`sqlite://${process.env.AUTOTSS_DB}`,{ logging:false })
const { JSON,STRING,BIGINT, } = DataTypes
sequelize.authenticate();
const device = sequelize.define('device',{
    name: { type: STRING },
    ecid: { type: BIGINT, primaryKey: true },
    generator: { type: BIGINT, allowNull: true },
    owner: { type: BIGINT },
    apnonce: { type: STRING, allowNull: true },
    model: { type: STRING },
    tickets: { type: JSON }
})
module.exports = { device,sequelize }