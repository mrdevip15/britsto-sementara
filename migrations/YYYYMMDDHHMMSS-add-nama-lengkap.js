'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('siswas', 'namaLengkap', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('tentors', 'namaLengkap', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('siswas', 'namaLengkap');
    await queryInterface.removeColumn('tentors', 'namaLengkap');
  }
}; 