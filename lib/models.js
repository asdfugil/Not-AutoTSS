const { Sequelize,DataTypes } = require('sequelize');
const sequelize = new Sequelize(`sqlite://${process.env.AUTOTSS_DB}`,{ logging:true })
const { STRING, } = DataTypes
sequelize.sync();
const device = sequelize.define('device',{
    name: { type: STRING },
    ecid: { type: STRING, primaryKey: true },
    generator: { type: STRING, allowNull: true },
    owner: { type: STRING },
    apnonce: { type: STRING, allowNull: true },
    model: { type: STRING },
})
module.exports = { device,sequelize }