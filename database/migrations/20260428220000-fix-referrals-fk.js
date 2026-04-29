'use strict';

/**
 * Fixes a critical bug where the referrals table foreign keys pointed to
 * keyword.ID instead of users.id. Caused by Sequelize auto-inferring the
 * association target incorrectly when the original migration ran.
 *
 * Symptom: every referral insert failed with FK constraint violation
 * referencing the keyword table — referrals never got recorded.
 */
module.exports = {
  async up(queryInterface) {
    const sql = queryInterface.sequelize;

    const [fks] = await sql.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'referrals'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    for (const fk of fks) {
      if (fk.REFERENCED_TABLE_NAME !== 'users') {
        await sql.query(`ALTER TABLE referrals DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
      }
    }

    // Re-add only if missing
    const [referrerFk] = await sql.query(`
      SELECT 1 FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'referrals'
        AND COLUMN_NAME = 'referrer_id' AND REFERENCED_TABLE_NAME = 'users'
    `);
    if (referrerFk.length === 0) {
      await sql.query(`ALTER TABLE referrals ADD CONSTRAINT fk_referrals_referrer FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    const [referredFk] = await sql.query(`
      SELECT 1 FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'referrals'
        AND COLUMN_NAME = 'referred_id' AND REFERENCED_TABLE_NAME = 'users'
    `);
    if (referredFk.length === 0) {
      await sql.query(`ALTER TABLE referrals ADD CONSTRAINT fk_referrals_referred FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE`);
    }
  },

  async down() {
    // No-op: never restore the broken state.
  },
};
