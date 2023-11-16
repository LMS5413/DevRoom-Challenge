import { SuperClient} from "../SuperClient.ts";
import {DataTypes} from "sequelize";

const database = SuperClient.database.define("ProfileModel", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    correctAnswers: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    incorrectAnswers: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    victoryCount: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});
database.sync();
export default database;